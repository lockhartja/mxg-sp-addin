import {
    HttpClient,
    HttpErrorResponse,
    HttpEvent,
    HttpHeaders,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    IBreezeVisitNodeResult,
    KnownHttpHeaders,
    KnownHttpMethods,
    PossibleNameSpace,
    XtendedBreezeHttpResponse,
    XtendedEntityType,
    XtendedMappingCtx,
    XtendedQueryResult,
} from '@atypes';
import { SpCtxRepoService } from '@data/repo-managers/sp-ctx-repo.service';
import { SpMetadata } from '@models';
import {
    DataProperty,
    DataType,
    JsonResultsAdapter,
    KeyMapping,
    MetadataStore,
    NodeContext,
    NodeMeta,
} from 'breeze-client';
import _ from 'lodash';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class SpJsonResultsAdapterService implements JsonResultsAdapter {
    readonly _$typeName: string;
    defaultHeaders = {} as { [index in KnownHttpHeaders]: string };
    name: 'SpJra';

    constructor(private httpClient: HttpClient, private spContextRepo: SpCtxRepoService) {
        this.defaultHeaders['Accept'] = 'application/json;odata=minimalMetadata;charset=utf-8';
        this.defaultHeaders['Content-Type'] =
            'application/json;odata=minimalMetadata;charset=utf-8';
        this.defaultHeaders['DataServiceVersion'] = '3.0';
        this.defaultHeaders['X-ProxyStrict'] = 'false';
    }

    clientTypeNameToServer(clientTypeName: string): string {
        return `SP.Data.${clientTypeName}ListItem`;
    }

    executeHttpRequest = async (
        request: HttpRequest<unknown>
    ): Promise<XtendedBreezeHttpResponse> => {
        try {
            const filterHttpResponses = filter(
                (response: HttpEvent<unknown>) => response instanceof HttpResponse
            );

            const response = (await filterHttpResponses(
                this.httpClient.request(request)
            ).toPromise()) as HttpResponse<unknown>;

            const isBatch = request.headers.get('content-type').includes('multipart/mixed');

            const bzResponse: XtendedBreezeHttpResponse = {
                config: request,
                data: isBatch ? response.body : (JSON.parse(response.body as string) as unknown),
                headers: response.headers,
                getHeaders: undefined,
                statusText: response.statusText,
                status: response.status,
                response: response,
            };

            return bzResponse;
        } catch (error: unknown) {
            const httpError = error as HttpErrorResponse;

            if (httpError.error instanceof ErrorEvent) {
                // A client-side or network error occurred. Handle it accordingly.
                console.error('An error occurred:', httpError.error.message);
                void Swal.fire({
                    title: 'Network Error',
                    icon: 'error',
                    text: `SMA encountered an error attempting to contact the server. 
                    Please retry, if the problem persists contact support.`,
                    timer: 6000,
                    timerProgressBar: true,
                });
            } else {
                // The backend returned an unsuccessful response code.
                // The response body may contain clues as to what went wrong.
                console.error(
                    `Backend returned code ${httpError.status}, ` +
                        `body was: ${httpError.error as string}`
                );

                let data: unknown;

                if (httpError.error instanceof HttpResponse) {
                    data = httpError.error.body;
                } else if (httpError.error instanceof Error) {
                    data = httpError.error.message;
                } else {
                    data = httpError.error;
                }

                if (httpError.status === 0 && data == null) {
                    data = 'timeout';
                }

                const errorMessage = `${httpError.status}:${httpError.statusText}`;

                if (data && typeof data === 'object') {
                    data['message'] = (data['message'] as string) || errorMessage; // breeze looks at the message property
                }

                if (!data) {
                    data = errorMessage; // Return the error message as data
                }

                const httpResponse: XtendedBreezeHttpResponse = {
                    config: request,
                    data: data,
                    headers: httpError.headers,
                    statusText: httpError.statusText,
                    response: httpError.error as HttpResponse<unknown>,
                    getHeaders(headerName?: string) {
                        return (this as XtendedBreezeHttpResponse).headers
                            .getAll(headerName)
                            .join('\r\n');
                    },
                    status: httpError.status,
                };

                throw httpResponse;
            }
        }
    };

    /** A Function that is called once per query operation to extract the 'payload'
     * from any json received over the wire. This method has a default implementation
     * which simply returns the "results" property from any json returned as a result
     * of executing the query.
     */
    extractResults = (response: XtendedQueryResult): unknown[] => {
        let data: unknown[] = [];

        if (Array.isArray(response)) {
            response.forEach((r) => {
                const dataResult = this.unwrapResults(r);
                data = data.concat(dataResult);
            });
            return data;
        }

        data = this.unwrapResults(response);

        return data;
    };

    /**
     * A function that is called once per save operation to extract the entities from
     * any json received over the wire.  Must return an array. This method has a default
     * implementation which simply returns the "entities" property from any json
     * returned as a result of executing the save.
     */
    extractSaveResults = (serializedData: string): unknown => {
        let jsonData: Record<string, unknown>;

        // Sharepoint deletes sends back an empty string
        if (!serializedData) {
            return serializedData;
        }

        if (typeof serializedData === 'string') {
            jsonData = JSON.parse(serializedData) as Record<string, unknown>;
        }

        const data = (jsonData.d || jsonData) as Record<string, unknown>;

        return data.results === undefined ? data : data.results;
    };

    /**
     * A function that is called once per save operation to extract the key mappings from
     *  any json received over the wire.  Must return an array.
     * This method has a default implementation which simply returns the
     * "keyMappings" property from any json returned as a result of executing the save.
     */
    extractKeyMappings(data: unknown): KeyMapping[] {
        throw new Error('Not Implemented');
    }

    /**
     * A function that is called once per save operation to extract any deleted keys from any
     * json received over the wire.  Must return an array. This method has a default
     * implementation which is to simply returns the "deletedKeys" property from any json
     * returned as a result of executing the save.
     */
    extractDeletedKeys(data: unknown): unknown[] {
        throw new Error('Not Implemented');
    }

    getDigestToken(serviceName: PossibleNameSpace): string {
        const digestCache = this.spContextRepo.digestTokenCache[serviceName];
        return digestCache.token;
    }

    normalizeSaveValue = (prop: DataProperty, val: unknown): unknown => {
        if (prop.isUnmapped) {
            return undefined;
        }
        const propDataType = prop.dataType;

        if (propDataType === DataType.DateTimeOffset || propDataType === DataType.DateTime) {
            return this.transformValue(prop, val);
        } else if (prop.dataType) {
            // quoteJsonOData
            val = val != null ? val.toString() : val;
        }
        return val;
    };

    processRequestData(
        method: KnownHttpMethods,
        uri: string,
        headers: HttpHeaders,
        body?: unknown
    ): Promise<XtendedBreezeHttpResponse> {
        const httpRequest = new HttpRequest(method, uri, body, {
            headers,
            responseType: 'text',
        });

        return this.executeHttpRequest(httpRequest);
    }

    serverTypeNameToClient(serverTypeName: string): string {
        const re = /^(SP\.Data.)(.*)(ListItem)$/;
        const typeName = serverTypeName.replace(re, '$2');
        // eslint-disable-next-line
        return MetadataStore.normalizeTypeName(typeName);
    }

    transformValue = (prop: DataProperty, val: unknown): unknown => {
        if (val instanceof Date) {
            if (prop.dataType === DataType.DateTimeOffset) {
                val = new Date(val.getTime() - val.getTimezoneOffset() * 60000);
                return val;
            }
            if (prop.dataType === DataType.DateTimeOffset) {
                return val.toString();
            }
        }
        return val;
    };

    unwrapResults(hResponse: XtendedQueryResult): unknown[] {
        let responseData = Array.isArray(hResponse.results)
            ? ((_.flatMap(hResponse.results) as unknown) as Record<string, unknown>)
            : hResponse.results;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        responseData = responseData.d ? responseData.d : (responseData as any);

        return (responseData.value || responseData.results) as unknown[];
    }

    /** A visitor method that will be called on each node of the returned payload. */
    visitNode = (
        node: Record<string, any>,
        mappingContext: XtendedMappingCtx,
        nodeContext: NodeContext
    ): NodeMeta => {
        // TODO: maybe a problem when using expand relative objects...see sharepoint bz example
        const result: IBreezeVisitNodeResult = {} as IBreezeVisitNodeResult;

        if (node == null) {
            return result;
        }

        let isStringCollection = false;

        if (node['odata.id']) {
            // Assumption that we are using minimal OData format
            node.__metadata = {
                etag: node['odata.etag'] as string,
                type: node['odata.type'] as string,
                id: node['odata.id'] as string,
                edit: node['odata.editLink'] as string,
            };

            delete node['odata.etag'];
            delete node['odata.type'];
            delete node['odata.id'];
            delete node['odata.editLink'];
        }

        const metadata = node.__metadata as Partial<SpMetadata>;

        if (metadata != null) {
            // TODO: may be able to make this more efficient by caching of the previous value.
            // const entityTypeName = MetadataStore.normalizeTypeName(metadata.type);

            const entityTypeName = this.serverTypeNameToClient(metadata.type);

            // breeze expects metadata names to be Pascal Case, but sharepoint sends all lowercase;

            const et =
                entityTypeName &&
                mappingContext.entityManager.metadataStore.getAsEntityType(entityTypeName, true);

            /**
             * OData response doesn't distinguish a projection from a whole entity.
             * We'll assume that whole-entity data would have at least as many properties  (<=)
             * as the EntityType has mapped properties on the basis that
             * most projections remove properties rather than add them.
             * If not, assume it's a projection and do NOT treat as an entity
             * IMPORTANT: For SP OData endpoints to subtract out the nav properties
             * that breezejs counts as mapped properties but are never sent by the
             * server.
             */
            if (
                et &&
                et._mappedPropertiesCount - et.navigationProperties.length <=
                    Object.keys(node).length - 1
            ) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
                result.entityType = et as XtendedEntityType;
                const uriKey = metadata.uri || metadata.id;

                if (uriKey) {
                    metadata.uri = uriKey;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                // result.entityType.__metadata = {
                //     etag: metadata.etag,
                //     uri: metadata.uri,
                //     id: metadata.id,
                //     type: metadata.type,
                // } as any;
                // result.extraMetadata = {
                //   uriKey,
                //   etag: metadata.etag
                // };
            }
            isStringCollection = metadata.type === 'SP.FieldChoice';
        }

        if (isStringCollection) {
            result.passThru = true;
        }
        // OData v3 - projection arrays will be enclosed in a results array
        if (node.results) {
            result.node = node.results;
        }

        const propertyName = nodeContext.propertyName;

        const nodeType = node.$type as string;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result.ignore =
            node.__deferred != null ||
            propertyName === '__metadata' ||
            // EntityKey properties can be produced by EDMX models
            (propertyName === 'EntityKey' && nodeType && nodeType.startsWith('System.Data'));
        return result;
    };
}
