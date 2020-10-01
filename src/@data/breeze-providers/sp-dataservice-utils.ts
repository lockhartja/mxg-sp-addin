import { HttpClient } from '@angular/common/http';
import {
    core,
    AbstractDataServiceAdapter,
    AjaxAdapter,
    DataProperty,
    DataService,
    DataType,
    EntityType,
    HttpResponse,
    MappingContext,
    MetadataStore,
    ServerError
} from 'breeze-client';
import { SaveErrorFromServer } from 'breeze-client/src/entity-manager';
import * as _m from 'moment';

export class CustomDataServiceUtils {
    ajaxAdapter: AjaxAdapter;
    requestDigest: string;
    spWeb: SP.Web;
    spCtx: SP.ClientContext;
    httpClient: HttpClient;

    clientTypeNameToServer(clientTypeName: string): string {
        return `SP.Data.${clientTypeName}ListItem`;
    }

    makeUpdateDeleteItemsUri(id: number, queryUrl: string): string {
        return queryUrl.replace('/items', `/items(${id})`);
    }

    createError(response: HttpResponse): ServerError {
        const err = new Error() as ServerError;
        err.httpResponse = response;
        err.status = response.status;
        let errObj = response.data;

        if (!errObj) {
            err.message = response.error && response.error.toString();
            return err;
        }

        // some ajax providers will convert errant result into an object (angularjs), others will not (jQuery)
        // if not do it here.
        if (typeof errObj === 'string') {
            try {
                errObj = JSON.parse(errObj);
            } catch (e) {
                // sometimes httpResponse.data is just the error message itself
                err.message = errObj;
                return err;
            }
        }

        const saveContext = response.saveContext;

        let tmp =
            errObj.Message ||
            errObj.ExceptionMessage ||
            errObj.EntityErrors ||
            errObj.Errors;
        const isDotNet = !!tmp;
        let message: string;
        let entityErrors: any[];

        if (!isDotNet) {
            message = errObj.message;
            entityErrors = errObj.errors || errObj.entityErrors;
        } else {
            tmp = errObj;
            do {
                // .NET exceptions can provide both ExceptionMessage and Message but ExceptionMethod if it
                // exists has a more detailed message.
                message = tmp.ExceptionMessage || tmp.Message;
                tmp = tmp.InnerException;
            } while (tmp);
            // .EntityErrors will only occur as a result of an EntityErrorsException being deliberately thrown on the server
            entityErrors = errObj.Errors || errObj.EntityErrors;
            entityErrors =
                entityErrors &&
                entityErrors.map(e => {
                    return {
                        errorName: e.ErrorName,
                        entityTypeName: MetadataStore.normalizeTypeName(
                            e.EntityTypeName
                        ),
                        keyValues: e.KeyValues,
                        propertyName: e.PropertyName,
                        errorMessage: e.ErrorMessage
                    };
                });
        }

        if (saveContext && entityErrors) {
            const propNameFn =
                saveContext.entityManager.metadataStore.namingConvention
                    .serverPropertyNameToClient;
            entityErrors.forEach(e => {
                e.propertyName = e.propertyName && propNameFn(e.propertyName);
            });
            (err as SaveErrorFromServer).entityErrors = entityErrors;
        }

        err.message =
            message ||
            `Server side errors encountered -
          see the entityErrors collection on this object for more detail`;
        return err;
    }

    getAbsoluteUrl(dataService: DataService, url: string) {
        const serviceName = dataService.qualifyUrl('');
        // only prefix with serviceName if not already on the url
        let base = core.stringStartsWith(url, serviceName) ? '' : serviceName;
        // If no protocol, turn base into an absolute URI
        if (window && serviceName.indexOf('//') < 0) {
            // no protocol; make it absolute
            base =
                window.location.protocol +
                '//' +
                window.location.host +
                (core.stringStartsWith(serviceName, '/') ? '' : '/') +
                base;
        }
        return base + url;
    }

    getDefaultSelect(mappingContext: MappingContext): MappingContext {
        const query = mappingContext.query;
        if (typeof query === 'string') {
            return mappingContext;
        }
        const entityType = query.resultEntityType as EntityType;
        if (!entityType) {
            return mappingContext;
        }
        const defaultSelect =
            entityType.custom && entityType.custom['defaultSelect'];
        mappingContext.query = query.select(defaultSelect);
        return mappingContext;
    }

    getRequestDigestHeaders(defaultHeaders: {
        [index: string]: string;
    }): { [index: string]: string } {
        if (!this.requestDigest) {
            return defaultHeaders;
        }
        return { 'X-RequestDigest': this.requestDigest };
    }

    handleHttpErrors(
        reject: (reason: any) => void,
        response: HttpResponse,
        messagePrefix?: string
    ): void {
        const err = this.createError(response);
        AbstractDataServiceAdapter._catchNoConnectionError(err);

        if (messagePrefix) {
            err.message = `${messagePrefix}; ${err.message}`;
        }
        reject(err);
    }

    normalizeSaveValue(prop: DataProperty, val: any): any {
        if (prop.isUnmapped) {
            return undefined;
        }
        const propDataType = prop.dataType as DataType;
        if (propDataType === DataType.DateTimeOffset) {
            val =
                val &&
                new Date(val.getTime() - val.getTimezoneOffset() * 60000);
        } else if (propDataType === DataType.DateTime) {
            val = val && _m(val).toISOString();
        } else if (prop.dataType) {
            // quoteJsonOData
            val = val != null ? val.toString() : val;
        }
        return val;
    }
    // private setSPODataErrorMessage(err: any) {
    //     // OData errors can have the message buried very deeply - and nonobviously
    //     // Normal MS OData responses have a response.body
    //     // SharePoint OData responses have a response.data instead
    //     // this code is tricky so be careful changing the response.data parsing.
    //     let data = (err.data = err.response.data);
    //     let m: any;
    //     const msg = [];
    //     let nextErr: any;

    //     if (data) {
    //         try {
    //             if (typeof data === 'string') {
    //                 data = err.data = JSON.parse(data);
    //             }
    //             do {
    //                 nextErr = data.error || data.innererror;
    //                 if (!nextErr) {
    //                     m = data.message || '';
    //                     msg.push(typeof m === 'string' ? m : m.value);
    //                 }
    //                 nextErr = nextErr || data.internalexception;
    //                 data = nextErr;
    //             } while (nextErr);
    //             if (msg.length > 0) {
    //                 err.message = msg.join('; ') + '.';
    //             }
    //         } catch (e) {
    //             /* carry on */
    //         }
    //     }
    // }

    serverTypeNameToClient(servertTypeName: string): string {
        const re = /^(SP\.Data.)(.*)(ListItem)$/;
        const typeName = servertTypeName.replace(re, '$2');
        return MetadataStore.normalizeTypeName(typeName);
    }

    unwrapResponseData(response: HttpResponse): any {
        const data = response.data && response.data.d;
        return data.results === undefined ? data : data.results;
    }
}
