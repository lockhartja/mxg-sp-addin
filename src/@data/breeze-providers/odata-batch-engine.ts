import { HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IBatchConfig, IBatchParseResponse, PossibleNameSpace } from '@atypes';
import { ODataBatchBuilder } from '@models/utility/odata-batch-builder';
import { SpJsonResultsAdapterService } from './sp-jra.service';

@Injectable({
    providedIn: 'root',
})
export class ODataBatchService {
    constructor(private spJra: SpJsonResultsAdapterService) {}

    createBatchRequest(config: IBatchConfig, isFetch = false): HttpRequest<unknown> {
        const batchBuilder = new ODataBatchBuilder('write');

        isFetch
            ? this.createBatchFetchRequest(config, batchBuilder)
            : this.createBatchActionRequest(config, batchBuilder);

        const headers = this.prepareHeaders(batchBuilder.batchId, config.namespace);

        const request = new HttpRequest('POST', config.batchUriEndpoint, batchBuilder.bodyText, {
            headers,
            responseType: 'text',
        });

        return request;
    }

    createBatchFetchRequest(config: IBatchConfig, batchBuilder: ODataBatchBuilder): void {
        config.batchRequests.forEach((internalConfig) => batchBuilder.addGet(internalConfig));

        batchBuilder.closeBatch();
    }

    createBatchActionRequest(config: IBatchConfig, batchBuilder: ODataBatchBuilder): void {
        config.batchRequests.forEach((internalConfig) => {
            switch (internalConfig.method) {
                case 'DELETE':
                    batchBuilder.addDelete(internalConfig);
                    break;
                case 'MERGE':
                    batchBuilder.addUpdate(internalConfig);
                    break;
                case 'POST':
                    batchBuilder.addCreate(internalConfig);
                    break;
                default:
                    throw new Error('Encountered an unknown HTTP method');
            }
        });

        batchBuilder.closeChangeSet();
    }

    readBatch(batchBody: string, batchId: string): IBatchParseResponse[] {
        const odataBuilder = new ODataBatchBuilder('read');
        odataBuilder.batchId = batchId;
        return odataBuilder.readBatch(batchBody).batchResponses;
    }

    private prepareHeaders(batchId: string, namespace: PossibleNameSpace): HttpHeaders {
        const defaultHeaders = Object.assign({}, this.spJra.defaultHeaders);

        defaultHeaders['Content-Id'] = batchId;

        defaultHeaders['Content-Type'] = `multipart/mixed; boundary="batch_${batchId}"`;

        defaultHeaders['X-RequestDigest'] = this.spJra.getDigestToken(namespace);

        return new HttpHeaders(defaultHeaders);
    }
}
