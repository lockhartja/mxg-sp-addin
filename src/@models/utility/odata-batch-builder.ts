import { HttpHeaders } from '@angular/common/http';
import { IBatchInternalRequest, IBatchParseResponse } from '@atypes';
import * as xmlJs from 'xml-js';
import _ from 'lodash';

export class ODataBatchBuilder {
    batchId = '';
    changeSetId = '';
    bodyText = '';
    changeText = '';

    batchResponses: IBatchParseResponse[] = [];

    private batchBlocksReg = /^(?:--batchresponse_[\w-]{36})([\s\S]*?)(?=--batchresponse)/gim;
    //private guidReg = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

    private currentBatchBlock: string;
    private currentResponse = {} as IBatchParseResponse;
    private currentContentId = 1;
    private hasPreamble = false;

    constructor(mode: 'read' | 'write') {
        if (mode === 'write') {
            this.batchId = this.uuid();
        }
    }

    addGet(requestConfig: IBatchInternalRequest): this {
        this.bodyText += `
--batch_${this.batchId}
Content-Type: application/http
Content-Transfer-Encoding: binary
Content-Id: ${this.currentContentId}

GET ${requestConfig.internalUri} HTTP/1.1
Accept: application/json;odata=minimalMetadata
`;

        requestConfig.contentId = `${this.currentContentId}--${this.batchId}`;
        this.currentContentId++;
        return this;
    }

    addCreate(requestConfig: IBatchInternalRequest): this {
        this.addChangePreamble();

        this.changeText += `
POST ${requestConfig.internalUri} HTTP/1.1
Content-Type: application/json;odata=minimalMetadata
Accept: application/json;odata=minimalMetadata

${requestConfig.data as string}
`;

        return this;
    }

    addDelete(requestConfig: IBatchInternalRequest): this {
        this.addChangePreamble();

        this.changeText += `
DELETE ${requestConfig.internalUri} HTTP/1.1
If-Match: *
`;

        requestConfig.contentId = `${this.currentContentId}--${this.batchId}`;
        this.currentContentId++;
        return this;
    }

    addUpdate(requestConfig: IBatchInternalRequest): this {
        this.addChangePreamble();

        this.changeText += `
PATCH ${requestConfig.internalUri} HTTP/1.1
Content-Type: application/json;odata=minimalMetadata
Accept: application/json;odata=minimalMetadata
If-Match: "${requestConfig.etag}"

${requestConfig.data as string}
`;

        requestConfig.contentId = `${this.currentContentId}--${this.batchId}`;
        this.currentContentId++;
        return this;
    }

    closeChangeSet(): this {
        this.changeText += `
--changeset_${this.changeSetId}--

`;

        this.bodyText += this.changeText;
        this.closeBatch();
        return this;
    }

    closeBatch(): this {
        this.bodyText += `
--batch_${this.batchId}--`;
        return this;
    }

    // https://stackoverflow.com/questions/9214754/what-is-the-difference-between-regexp-s-exec-function-and-string-s-match-fun
    readBatch(body: string): this {
        let batchBlocks: string[];
        /**
         * Each reg.exec call should provide array of two strings
         * [complete match, group1-batchTextWithoutBatchHeaders]
         */
        while ((batchBlocks = this.batchBlocksReg.exec(body)) !== null) {
            this.currentBatchBlock = batchBlocks[1];
            this.currentResponse.responseBatchGroup = batchBlocks[0];
            this.getStatusCode().getBlockHeaders().getPayload().stashResponse();
        }
        return this;
    }

    private addBatchPreamble(): this {
        if (this.hasPreamble) {
            return this;
        }

        this.changeSetId = this.uuid();

        this.bodyText += `
--batch_${this.batchId}
Content-Type: multipart/mixed; boundary="changeset_${this.changeSetId}"
Content-Length: ${this.changeText.length}
Content-Transfer-Encoding: binary

`;
        return this;
    }

    private addChangePreamble(): this {
        this.addBatchPreamble();
        this.bodyText += `
        
--changeset_${this.changeSetId}
Content-Type: application/http
Content-Transfer-Encoding: binary

`;

        return this;
    }

    private getBlockHeaders(): this {
        const batchBlockHeaderReg = /^([^()<>@,;:\\"/[\]?={}\t]+)\s?:\s?(.*)$/gim;
        let blockHeaders = new HttpHeaders();
        let headersMatches: string[];
        /**
         * Each reg.exec call should provide array of three strings
         * [complete match, group1-headerKey, group2-headerValue]
         */
        while ((headersMatches = batchBlockHeaderReg.exec(this.currentBatchBlock)) !== null) {
            const headerKey = _.kebabCase(headersMatches[1]);
            const headerValues = headersMatches[2];
            let newHeaderValues: string[];

            if (blockHeaders.has(headerKey)) {
                const existingHeaderValues = blockHeaders.getAll(headerKey);
                newHeaderValues = existingHeaderValues.concat(headerValues.split(';'));
            } else {
                newHeaderValues = headerValues.split(';');
            }

            blockHeaders = blockHeaders.set(headerKey, newHeaderValues);
        }

        this.currentResponse.headers = blockHeaders;
        return this;
    }

    private getPayload(): this {
        const contentTypes = this.currentResponse.headers.getAll('content-type');
        const isJson = contentTypes.includes('application/json');
        const isXml = contentTypes.includes('application/atom+xml');

        /**
         * SharePoint specifically only sends back a one payload per batchGroup;
         * so if there are multiple payloads we need to rework this logic.
         */
        let payloadFound = false;
        /**
         * Quick test to see if we have
         * at least xml or json response, both not both!
         */
        if ((isJson && isXml) || (!isJson && !isXml)) {
            throw new Error('Malformed Batch - response payload type is unknown or missing');
        }

        /**
         * While we always request SharePoint to send back
         * Json payloads, it seems that errors are reported in the
         */
        const parser = isJson ? /^({.*})$/gim : /^(<\?xml.*)$/gim;

        /**
         * Reg.exec should provide array of two strings
         * [complete match, group1-payload]
         * in this case the complete match and group1-payload should
         * be the same.
         */
        let payloadMatches: string[];

        /**
         * Ok if is null, as delete operations will not send any payload;
         */
        while ((payloadMatches = parser.exec(this.currentBatchBlock)) !== null) {
            if (payloadFound) {
                throw new Error('Malformed Batch - found multiple payloads in block');
            }

            this.currentResponse.data = isJson ? JSON.parse(payloadMatches[0]) : xmlJs.xml2json(payloadMatches[0]);

            payloadFound = true;
        }
        return this;
    }

    private getStatusCode(): this {
        const batchBlockStatusCodeReg = /^HTTP\/1\.\d\s*(\d{3})\s*(.*)$/gim;

        let statusCodeMatches: string[];
        let foundFlag = false;
        /**
         * Reg.exec should provide array of three strings
         * [complete match, group1-statusCode, group2-statusText]
         */
        while ((statusCodeMatches = batchBlockStatusCodeReg.exec(this.currentBatchBlock)) !== null) {
            if (foundFlag) {
                throw new Error('Malformed Batch - found multiple status codes in block');
            }

            this.currentResponse.status = +statusCodeMatches[1];
            this.currentResponse.statusText = statusCodeMatches[2];
            foundFlag = true;
        }

        if (!foundFlag) {
            throw new Error('Malformed Batch - found multiple status codes in block');
        }

        return this;
    }

    private stashResponse(): this {
        this.currentResponse.contentId = `${this.currentContentId}--${this.batchId}`;
        const finalResponse = Object.assign({}, this.currentResponse);

        this.currentContentId++;
        this.batchResponses.push(finalResponse);
        this.currentResponse = {} as IBatchParseResponse;
        return this;
    }

    private uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
