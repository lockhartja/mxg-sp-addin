import { HttpHeaders } from '@angular/common/http';
import { KnownHttpHeaders, KnownHttpMethods } from '@atypes';
import { PossibleNameSpace } from './sharepoint-list';

export interface IBatchConfig {
    batchUriEndpoint: PossibleNameSpace;
    namespace: PossibleNameSpace;
    batchRequests: IBatchInternalRequest[];
}

export interface IBatchInternalRequest {
    internalUri: string;
    headers?: Record<KnownHttpHeaders, string | number>;
    contentId: string | number;
    method?: KnownHttpMethods;
    data?: unknown;
    etag?: string;
}

export interface IBatchParseResponse {
    contentId: string;
    headers: HttpHeaders;
    responseBatchGroup: string;
    status: number;
    statusText: string;
    data: unknown;
    error: unknown;
}
