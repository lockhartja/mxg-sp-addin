import {
    AjaxAdapter,
    HttpResponse as BreezeHttpResponse,
    AjaxConfig,
} from 'breeze-client';
import * as _l from 'lodash';
import {
    IHttpResultsData,
    IODataBatchResponse,
    IODataPayload,
    XtendedMappingCtx,
    XtendedSaveBundle,
} from '@atypes';
import { CustomDataServiceUtils } from './data-service-utils';

declare var OData: any;

export class SpQueryDataService {
    name: string;
    private ajaxImpl: AjaxAdapter;
    relativeUrl: boolean | ((ds: XtendedSaveBundle, url: string) => string);

    headers = {
        DataServiceVersion: '3.0',
        Accept: 'application/json;odata=minimalmetadata',
        'Content-Type': 'application/json;odata=verbose',
    };

    constructor(
        private utils: CustomDataServiceUtils,
        private mc?: XtendedMappingCtx[]
    ) {
        this.ajaxImpl = utils.ajaxAdapter;
    }

    async executeQuery(
        mc: XtendedMappingCtx[][]
    ): Promise<IHttpResultsData | IHttpResultsData[]> {
        const ctxs = _l.flatMap(mc, (x) => x);

        if (ctxs.length === 1) {
            return this.executeSingleQuery(ctxs[0]);
        }

        return this.executeBatchQuery(ctxs);
    }

    async executeBatchQuery(
        mc: XtendedMappingCtx[]
    ): Promise<IHttpResultsData[]> {
        const bRequests = mc.map((ctx) => {
            const headers = {};
            Object.assign(headers, this.headers);
            const internalBatchUrl = this.utils
                .getAbsoluteUrl(ctx.dataService, ctx.getUrl())
                .replace(/.*\/\/[^\/]*/, ''); //SpConfig.cfgSharepointMainAppSite);
            return {
                requestUri: internalBatchUrl,
                method: 'GET',
                headers,
            };
        });

        const response = (await new Promise(async (resolve, reject) => {
            const ds = mc[0].entityManager.dataService;

            OData.request(
                {
                    headers: {
                        MaxDataServiceVersion: '3.0',
                        DataServiceVersion: '3.0',
                        'X-RequestDigest': await ds.getRequestDigest(),
                    },
                    requestUri: ds.odataAppEndpoint,
                    method: 'POST',
                    data: {
                        __batchRequests: bRequests,
                    },
                },
                (
                    batches: { __batchResponses: IODataBatchResponse[] },
                    payload: IODataPayload
                ) => resolve({ batches, payload }),
                reject,
                OData.batchHandler
            );
        })) as {
            batches: { __batchResponses: IODataBatchResponse[] };
            payload: object;
        };

        const batchRepsonses = response.batches.__batchResponses.map(
            (batch: IODataBatchResponse): IHttpResultsData => {
                return {
                    results: batch.data.results,
                    inlineCount: undefined,
                    httpResponse: response.payload,
                };
            }
        );
        return batchRepsonses;
    }

    async executeSingleQuery(
        mc: XtendedMappingCtx
    ): Promise<IHttpResultsData[]> {
        const query = mc.query;

        const headers = this.headers;

        headers[
            'X-RequestDigest'
        ] = await mc.entityManager.dataService.getRequestDigest();

        if (typeof query === 'string') {
            const requestCfg: AjaxConfig = {
                type: 'GET',
                url: mc.getUrl(),
                success: undefined,
                error: undefined,
                headers,
            };

            const response = (this.ajaxImpl.ajax(
                requestCfg
            ) as any) as BreezeHttpResponse;

            const resultsData: IHttpResultsData = {
                results: response.data as any,
                inlineCount: response.data.__count
                    ? parseInt(response.data.__count, 10)
                    : undefined,
                httpResponse: response,
            };

            return [resultsData];
        }

        const odataResponse = (await new Promise(async (resolve, reject) => {
            OData.request(
                {
                    headers,
                    requestUri: mc.getUrl(),
                    method: 'GET',
                },
                (data, httpResponse) => resolve({ data, httpResponse }),
                reject
            );
        })) as any;

        const singleResponse: IHttpResultsData = {
            results: odataResponse.data.results,
            inlineCount: undefined,
            httpResponse: odataResponse.httpResponse,
        };
        return [singleResponse];
    }
}
