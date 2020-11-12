import { Injectable } from '@angular/core';
import { IBatchConfig, IDeffer, XtendedBreezeHttpResponse, XtendedMappingCtx, XtendedQueryResult } from '@atypes';
import { QueryResult } from 'breeze-client';
import { HttpHeaders, HttpRequest } from '@angular/common/http';
import { ODataBatchService } from './odata-batch-engine';
import _ from 'lodash';
import { SpJsonResultsAdapterService } from './sp-jra.service';

@Injectable({ providedIn: 'root' })
export class SharePointQueryService {
    executeTimer: number;

    queryCache = new Map<XtendedMappingCtx, IDeffer>();

    constructor(private spJra: SpJsonResultsAdapterService, private odataService: ODataBatchService) {}

    processQuery(mappingContext: XtendedMappingCtx): Promise<QueryResult> {
        if (mappingContext.query.xtendedOptions.isCamlQuery) {
            return this.executeCamlQuery(mappingContext);
        }

        if (this.executeTimer) {
            clearTimeout(this.executeTimer);
        }

        this.executeTimer = window.setTimeout(this.drainQueryCache, 2000);

        const defer = {} as IDeffer;

        defer.promise = new Promise((resolve, reject) => {
            defer.resolve = resolve;
            defer.reject = reject;
        });

        this.queryCache.set(mappingContext, defer);

        return defer.promise;
    }

    private drainQueryCache = (): void => {
        this.executeTimer = undefined;

        if (this.queryCache.size === 1) {
            const deferCache = this.queryCache.entries().next().value as [XtendedMappingCtx, IDeffer];

            this.queryCache.clear();

            void this.executeSingleQuery(deferCache);

            return;
        }

        const drainedQueries = new Map(this.queryCache);

        this.queryCache.clear();

        void this.executeBatchQuery(drainedQueries);
    };

    private async executeSingleQuery(deferCache: [XtendedMappingCtx, IDeffer]): Promise<void> {
        const context = deferCache[0];

        const query = context.query;

        const digestTokenFromCache = this.spJra.getDigestToken(context.dataService.xtendedOptions.serviceNameSpace);

        const headers = new HttpHeaders(this.spJra.defaultHeaders);

        headers.set('X-RequestDigest', digestTokenFromCache);

        const uri = typeof query === 'string' ? query : context.getUrl();

        try {
            const response = await this.spJra.processRequestData('GET', uri, headers);

            const result: QueryResult = {
                entityManager: context.entityManager,
                httpResponse: response,
                inlineCount: undefined,
                results: response.data as unknown[],
                query: context.query,
            };

            deferCache[1].resolve(result);
        } catch (e) {
            deferCache[1].reject(e);
        }
    }

    private async executeBatchQuery(deferCaches: Map<XtendedMappingCtx, IDeffer>): Promise<void> {
        const contexts = [] as XtendedMappingCtx[];
        /**
         * Add headers for each call, using the CONTENT-ID as a method to keep
         * the orders right as we rearrange by namespaces.
         */
        for (const context of deferCaches.keys()) {
            context.internalBatchRequest = {
                contentId: undefined,
                internalUri: context
                    .getUrl()
                    .replace(
                        _spPageContextInfo.webAbsoluteUrl,
                        (_spPageContextInfo as Record<string, any>).__webAbsoluteUrl
                    ),
            };
            contexts.push(context);
        }

        const contextsInNamespace = _.groupBy(contexts, (x) => x.dataService.xtendedOptions.serviceNameSpace);

        const hRequests = [] as HttpRequest<unknown>[];

        for (const namespace in contextsInNamespace) {
            const modelContext = contextsInNamespace[namespace][0];

            const odataEndpoint = modelContext.dataService.xtendedOptions.odataAppEndpoint;

            // A batch request can have only a maximum of 1000 requests
            const contextChucks = _.chunk(contextsInNamespace[namespace], 100);

            for (const contextChuck of contextChucks) {
                const batchConfig = {
                    batchUriEndpoint: odataEndpoint,
                    namespace: namespace,
                    batchRequests: contextChuck.map((chuck) => chuck.internalBatchRequest),
                } as IBatchConfig;

                const requestConfig = this.odataService.createBatchRequest(batchConfig, true);

                hRequests.push(requestConfig);
            }
        }

        const results = await Promise.allSettled(hRequests.map(this.spJra.executeHttpRequest));

        const mappingContexts = Array.from(deferCaches.keys());

        results.forEach((result) => {
            /**
             * Any failures here would be from making the batch call itself,
             * not for any failed internal batch calls
             */
            if (result.status === 'fulfilled') {
                const batchId = result.value.config.headers.get('content-id').split('--')[0];

                const responses = this.odataService.readBatch(result.value.data, batchId);

                responses.forEach((response) => {
                    const matchingContext = mappingContexts.find(
                        (mc) => mc.internalBatchRequest.contentId === response.contentId
                    );

                    const queryResult: XtendedQueryResult = {
                        entityManager: matchingContext.entityManager,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        httpResponse: response as any,
                        inlineCount: undefined,
                        results: response.data as unknown[],
                        error: response.error,
                        query: matchingContext.query,
                    };

                    const promiseForContext = deferCaches.get(matchingContext);

                    if (queryResult.error) {
                        promiseForContext.reject(queryResult);
                    } else {
                        promiseForContext.resolve(queryResult);
                    }

                    deferCaches.delete(matchingContext);
                });
            } else {
                const errorResponse = result.reason as XtendedBreezeHttpResponse;

                const contentType = errorResponse.config.headers.get('Content-Id');

                const batchPart = contentType.split('--')[1];

                const allContextsInFailedBatch = mappingContexts.filter((mc) =>
                    (mc.internalBatchRequest.contentId as string).includes(batchPart)
                );

                allContextsInFailedBatch.forEach((context) => {
                    const promisesForContext = deferCaches.get(context);

                    //We will automatically reject all promises that failed the batch call
                    promisesForContext.reject(errorResponse);
                    deferCaches.delete(context);
                });
            }
        });

        if (deferCaches.size) {
            throw Error('Critical Error!...processed all requests but the cache is not empty.');
        }
    }

    private async executeCamlQuery(context: XtendedMappingCtx): Promise<QueryResult> {
        const uri = context.getUrl().replace('?', '');

        const postData = {
            query: { __metadata: { type: 'SP.CamlQuery' }, ViewXml: context.query.xtendedOptions.postData },
        };

        const digestTokenFromCache = this.spJra.getDigestToken(context.dataService.xtendedOptions.serviceNameSpace);

        const defaultHeaders = Object.assign({}, this.spJra.defaultHeaders);

        defaultHeaders['Accept'] = 'application/json;odata=verbose;charset=utf-8';

        defaultHeaders['Content-Type'] = 'application/json;odata=verbose;charset=utf-8';

        defaultHeaders['X-RequestDigest'] = digestTokenFromCache;

        const headers = new HttpHeaders(defaultHeaders);

        const response = await this.spJra.processRequestData('POST', uri, headers, postData);

        const result: QueryResult = {
            entityManager: context.entityManager,
            httpResponse: response,
            inlineCount: undefined,
            results: response.data as unknown[],
            query: context.query,
        };

        return result;
    }
}
