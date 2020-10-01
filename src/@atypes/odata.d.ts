declare var OData: any;

export interface IODataRequest {
    method: 'POST';
    requestUri: string;
    headers: {
        Accept: string;
        MaxDataServiceVersion: string;
        DataServiceVersion: string;
        'CONTENT-TYPE'?: string;
        'X-REQUESTDIGEST': string;
    };
    data?: IODataBatchData;
}

export type HttpMethods = 'GET' | 'POST' | 'DELETE' | 'MERGE';

export interface IOdataaChangeSet {
    method: HttpMethods | string;
    requestUri: string;
    data: object;
    headers: {
        DataServiceVersion: string;
        'CONTENT-ID'?: number;
        Accept: string;
    };
}

export interface IODataBatchData {
    __batchRequests: Array<{
        __changeRequests: IOdataaChangeSet[];
    }>;
}

export interface IODataBatchResponse {
    body: string;
    data: { results: any[] };
    headers: { [index: string]: string };
    statusCode: number;
    statusText: string;
}

export interface IODataPayload {
    body: string;
    data: { __batchResponses: IODataBatchResponse[] };
    headers: Array<{ [index: string]: string }>;
    requestUri: string;
    statusCode: number;
    statusText: string;
}
