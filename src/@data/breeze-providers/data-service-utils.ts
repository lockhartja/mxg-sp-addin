// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { XtendedEntityType, XtendedMappingCtx } from '@atypes';
// import { DataAccessModule } from '@data/data-access.module';
// import { SpCtxRepoService } from '@data/repo-managers/sp-ctx-repo.service';
// import {
//     core,
//     AbstractDataServiceAdapter,
//     AjaxAdapter,
//     DataProperty,
//     DataService,
//     DataType,
//     HttpResponse,
//     MappingContext,
//     MetadataStore,
//     ServerError,
//     EntityError,
// } from 'breeze-client';
// import { SaveContext } from 'breeze-client/src/entity-manager';

// interface IEntityError {
//     ErrorName: string;
//     EntityTypeName: string;
//     PropertyName: string;
//     ErrorMessage: string;
//     KeyValues: unknown;
// }

// interface IDotNetError {
//     Message?: string;
//     ExceptionMessage?: string;
//     EntityErrors?: IEntityError[];
//     Errors?: IEntityError[];
//     InnerException?: IDotNetError;
// }

// @Injectable({ providedIn: DataAccessModule })
// export class CustomDataServiceUtils {
//     ajaxAdapter: AjaxAdapter;

//     constructor(
//         public spCtxRepo: SpCtxRepoService,
//         public httpClient: HttpClient
//     ) {}

//     clientTypeNameToServer(clientTypeName: string): string {
//         return `SP.Data.${clientTypeName}ListItem`;
//     }

//     makeUpdateDeleteItemsUri(id: number, queryUrl: string): string {
//         return queryUrl.replace('/items', `/items(${id})`);
//     }

//     transformValue(prop: DataProperty, val: unknown): unknown {
//         if (prop.isUnmapped) {
//             return undefined;
//         }

//         if (val instanceof Date) {
//             if (prop.dataType === DataType.DateTimeOffset) {
//                 val = new Date(val.getTime() - val.getTimezoneOffset() * 60000);
//                 return val;
//             }

//             // The datajs lib tries to treat client dateTimes that are defined as DateTimeOffset on the server differently
//             // from other dateTimes. This fix compensates before the save.
//             if (prop.dataType === DataType.DateTimeOffset) {
//                 return val.toString();
//             }
//         }
//         return val;
//     }

//     createError(response: HttpResponse): ServerError {
//         const err = new Error() as ServerError & {
//             entityErrors: EntityError[];
//         };
//         err.httpResponse = response;
//         err.status = response.status;
//         const errorResponse = response.data as unknown;

//         if (!errorResponse) {
//             const responseError = response.error as Record<string, unknown>;
//             err.message = responseError?.toString();
//             return err;
//         }

//         let errorObject: IDotNetError;

//         // some ajax providers will convert errant result into an object (angularjs), others will not (jQuery)
//         // if not do it here.
//         if (typeof errorResponse === 'string') {
//             try {
//                 errorObject = JSON.parse(errorResponse) as IDotNetError;
//             } catch (e) {
//                 // sometimes httpResponse.data is just the error message itself
//                 err.message = errorResponse;
//                 return err;
//             }
//         }

//         const saveContext = response.saveContext as SaveContext;

//         const tmp =
//             errorObject?.Message ||
//             errorObject?.ExceptionMessage ||
//             errorObject?.EntityErrors ||
//             errorObject?.Errors;

//         const isDotNet = !!tmp;

//         let message: string;

//         let entityErrors: EntityError[];
//         let entityServerErrors: IEntityError[];

//         if (!isDotNet) {
//             message = errorObject.Message;

//             entityServerErrors = errorObject.Errors || errorObject.EntityErrors;
//         } else {
//             let tempErrorObject = errorObject;
//             do {
//                 // .NET exceptions can provide both ExceptionMessage and Message but ExceptionMethod if it
//                 // exists has a more detailed message.
//                 message =
//                     tempErrorObject.ExceptionMessage || tempErrorObject.Message;

//                 tempErrorObject = tempErrorObject.InnerException;
//             } while (tempErrorObject);

//             // .EntityErrors will only occur as a result of an EntityErrorsException being deliberately thrown on the server
//             entityServerErrors = errorObject.Errors || errorObject.EntityErrors;

//             entityErrors =
//                 entityServerErrors &&
//                 entityServerErrors.map((e) => {
//                     return {
//                         errorName: e.ErrorName,
//                         // eslint-disable-next-line
//                         entityTypeName: MetadataStore.normalizeTypeName(
//                             e.EntityTypeName
//                         ) as string,
//                         keyValues: e.KeyValues,
//                         propertyName: e.PropertyName,
//                         errorMessage: e.ErrorMessage,
//                         isServerError: false,
//                         entity: undefined,
//                     };
//                 });
//         }

//         if (saveContext && entityErrors) {
//             const propNameFn =
//                 saveContext.entityManager.metadataStore.namingConvention
//                     .serverPropertyNameToClient;
//             entityErrors.forEach((e) => {
//                 e.propertyName = e.propertyName && propNameFn(e.propertyName);
//             });
//             err.entityErrors = entityErrors;
//         }

//         err.message =
//             message ||
//             `Server side errors encountered -
//           see the entityErrors collection on this object for more detail`;
//         return err;
//     }

//     getAbsoluteUrl(dataService: DataService, url: string): string {
//         const serviceName = dataService.qualifyUrl('');
//         // only prefix with serviceName if not already on the url
//         let base = core.stringStartsWith(url, serviceName) ? '' : serviceName;
//         // If no protocol, turn base into an absolute URI
//         if (window && serviceName.indexOf('//') < 0) {
//             // no protocol; make it absolute
//             base =
//                 window.location.protocol +
//                 '//' +
//                 window.location.host +
//                 (core.stringStartsWith(serviceName, '/') ? '' : '/') +
//                 base;
//         }
//         return base + url;
//     }

//     getDefaultSelect(mappingContext: MappingContext): MappingContext {
//         const query = mappingContext.query;
//         if (typeof query === 'string') {
//             return mappingContext;
//         }
//         const entityType = query.resultEntityType as XtendedEntityType;
//         if (!entityType) {
//             return mappingContext;
//         }
//         const defaultSelect =
//             entityType.custom && entityType.custom.defaultSelect;
//         mappingContext.query = query.select(defaultSelect);
//         return mappingContext;
//     }

//     getQueryUrl(
//         mc: XtendedMappingCtx,
//         relativeUrl: boolean | ((...args) => string)
//     ): string {
//         let url: string;
//         if (relativeUrl === true) {
//             url = mc.getUrl();
//         } else if (typeof relativeUrl === 'function') {
//             url = relativeUrl(mc.dataService, mc.getUrl());
//         } else {
//             url = this.getAbsoluteUrl(mc.dataService, mc.getUrl());
//         }
//         return url;
//     }

//     // getRequestDigestHeaders(defaultHeaders: {
//     //     [index: string]: string;
//     // }): { [index: string]: string } {
//     //     if (!this.requestDigest) {
//     //         return defaultHeaders;
//     //     }
//     //     return { 'X-RequestDigest': this.requestDigest };
//     // }

//     getRoutePrefix(dataService: DataService): string {
//         // Get the routePrefix from a Web API OData service name.
//         // The routePrefix is presumed to be the pathname within the dataService.serviceName
//         // Examples of serviceName -> routePrefix:
//         //   'http://localhost:55802/odata/' -> 'odata/'
//         //   'http://198.154.121.75/service/odata/' -> 'service/odata/'

//         // if (typeof document === 'object') {
//         //     // browser
//         //     const parser = document.createElement('a');
//         //     parser.href = dataService.serviceName;
//         // } else {
//         //     // node
//         //     // TODO: how to best handle this
//         //     // assumes existence of node's url.parse method.
//         //     // parser = url.parse(dataService.serviceName);
//         // }

//         const parser = document.createElement('a');
//         parser.href = dataService.serviceName;

//         let prefix = parser.pathname;

//         if (prefix[0] === '/') {
//             prefix = prefix.substr(1);
//         } // drop leading '/'  (all but IE)
//         if (prefix.substr(-1) !== '/') {
//             prefix += '/';
//         } // ensure trailing '/'
//         return prefix;
//     }

//     handleHttpErrors(
//         reject: (reason: ServerError) => void,
//         response: HttpResponse,
//         messagePrefix?: string
//     ): void {
//         const err = this.createError(response);
//         AbstractDataServiceAdapter._catchNoConnectionError(err);

//         if (messagePrefix) {
//             err.message = `${messagePrefix}; ${err.message}`;
//         }
//         reject(err);
//     }

//     normalizeSaveValue(prop: DataProperty, val: unknown): unknown {
//         if (prop.isUnmapped) {
//             return undefined;
//         }
//         const propDataType = prop.dataType as DataType;

//         if (
//             propDataType === DataType.DateTimeOffset ||
//             propDataType === DataType.DateTime
//         ) {
//             return this.transformValue(prop, val);
//         } else if (prop.dataType) {
//             // quoteJsonOData
//             val = val != null ? val.toString() : val;
//         }
//         return val;
//     }
//     // private setSPODataErrorMessage(err: any) {
//     //     // OData errors can have the message buried very deeply - and nonobviously
//     //     // Normal MS OData responses have a response.body
//     //     // SharePoint OData responses have a response.data instead
//     //     // this code is tricky so be careful changing the response.data parsing.
//     //     let data = (err.data = err.response.data);
//     //     let m: any;
//     //     const msg = [];
//     //     let nextErr: any;

//     //     if (data) {
//     //         try {
//     //             if (typeof data === 'string') {
//     //                 data = err.data = JSON.parse(data);
//     //             }
//     //             do {
//     //                 nextErr = data.error || data.innererror;
//     //                 if (!nextErr) {
//     //                     m = data.message || '';
//     //                     msg.push(typeof m === 'string' ? m : m.value);
//     //                 }
//     //                 nextErr = nextErr || data.internalexception;
//     //                 data = nextErr;
//     //             } while (nextErr);
//     //             if (msg.length > 0) {
//     //                 err.message = msg.join('; ') + '.';
//     //             }
//     //         } catch (e) {
//     //             /* carry on */
//     //         }
//     //     }
//     // }

//     serverTypeNameToClient(serverTypeName: string): string {
//         const re = /^(SP\.Data.)(.*)(ListItem)$/;
//         const typeName = serverTypeName.replace(re, '$2');
//         // eslint-disable-next-line
//         return MetadataStore.normalizeTypeName(typeName);
//     }

//     toQueryString(obj: Record<string, unknown>): string {
//         const parts: string[] = [];
//         for (const i in obj) {
//             if (Object.prototype.hasOwnProperty.call(obj, i)) {
//                 parts.push(
//                     encodeURIComponent(i) +
//                         '=' +
//                         encodeURIComponent(obj[i] as string)
//                 );
//             }
//         }
//         return parts.join('&');
//     }

//     unwrapResponseData(response: HttpResponse): unknown {
//         const responseData = response.data as Record<string, unknown>;
//         return responseData.results === undefined
//             ? responseData
//             : responseData.results;
//     }
// }
