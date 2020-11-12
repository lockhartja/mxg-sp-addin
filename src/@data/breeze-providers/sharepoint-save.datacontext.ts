import { SaveResult } from 'breeze-client';
import { XtendedEntity, XtendedBreezeHttpResponse, IBatchConfig, PossibleNameSpace, XtendedEntityMgr } from '@atypes';
import { SaveBundleBuilder } from '@models';
import { Injectable } from '@angular/core';
import _ from 'lodash';
import Swal from 'sweetalert2';
import { HttpHeaders, HttpRequest } from '@angular/common/http';
import { ServerError } from 'breeze-client/src/entity-manager';
import { SpJsonResultsAdapterService } from './sp-jra.service';
import { ODataBatchService } from './odata-batch-engine';

@Injectable({ providedIn: 'root' })
export class SharePointSaveService {
    constructor(private spJra: SpJsonResultsAdapterService, private odataService: ODataBatchService) {}

    async processSave(builtBundle: SaveBundleBuilder): Promise<SaveResult> {
        try {
            if (builtBundle.isLargeBundle) {
                const cancelRequest = await this.warnOfLargeSave(builtBundle.saveBundle.entities.length);

                if (!cancelRequest) {
                    //need to reject the appropriate SaveResult item
                }
            }

            (builtBundle.saveContext.entityManager as XtendedEntityMgr<never>).isSaving.next(true);

            return builtBundle.mode === 'single'
                ? this.processIndividualSave(builtBundle)
                : this.processBatchSave(builtBundle);
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            (builtBundle.saveContext.entityManager as XtendedEntityMgr<never>).isSaving.next(false);
        }
    }

    private async processIndividualSave(builtBundle: SaveBundleBuilder): Promise<SaveResult> {
        const requestConfig = builtBundle.requestConfigs[0];

        requestConfig.headers['X-RequestDigest'] = this.spJra.getDigestToken(
            builtBundle.saveContext.dataService.xtendedOptions.serviceNameSpace
        );

        requestConfig.headers['X-Http-Method'] = requestConfig.method;

        const headers = new HttpHeaders(requestConfig.headers as Record<string, string>);

        try {
            const response = await this.spJra.processRequestData(
                'POST',
                requestConfig.internalUri,
                headers,
                requestConfig.data
            );

            const contentId = response.config.headers.get('content-id');

            builtBundle.resolveBundle([{ contentId: contentId, statusCode: response.status, data: response.data }]);

            return builtBundle.saveResult;
        } catch (error: unknown) {
            const httpResponse = error as XtendedBreezeHttpResponse;
            const serverError: ServerError = {
                body: JSON.parse(httpResponse.data) as XtendedEntity,
                httpResponse: httpResponse,
                message: httpResponse.statusText,
                statusText: httpResponse.statusText,
                status: httpResponse.status,
                url: httpResponse.config.url,
                name: 'error',
            };
            throw serverError;
        }
    }

    private async processBatchSave(builtBundle: SaveBundleBuilder): Promise<SaveResult> {
        const { serviceNameSpace, odataAppEndpoint } = builtBundle.saveContext.dataService.xtendedOptions;

        const internalConfigs = builtBundle.requestConfigs;

        // A batch request can have only a maximum of 1000 requests
        const internalConfigChucks = _.chunk(internalConfigs, 1000);

        const hRequests: HttpRequest<unknown>[] = [];

        for (const configChuck of internalConfigChucks) {
            const batchConfig: IBatchConfig = {
                batchRequests: configChuck,
                batchUriEndpoint: odataAppEndpoint as PossibleNameSpace,
                namespace: serviceNameSpace,
            };

            const hRequest = this.odataService.createBatchRequest(batchConfig);

            hRequests.push(hRequest[0]);
        }

        const results = await Promise.all(hRequests.map(this.spJra.executeHttpRequest));

        const responses = results.map((result) => {
            const batchId = result.config.headers.get('content-id').split('--')[0];

            return this.odataService.readBatch(result.data, batchId);
        });

        const parsedResults = _.flatMap(responses).map((response) => {
            return {
                contentId: response.contentId,
                statusCode: response.status,
                data: response.data,
            };
        });

        builtBundle.resolveBundle(parsedResults);

        return builtBundle.saveResult;
    }

    private async warnOfLargeSave(payloadSize: number): Promise<boolean> {
        const dialogResponse = await Swal.fire({
            title: 'Large Payload',
            icon: 'question',
            text: `You are saving ${payloadSize} changes at one time, 
                    this could take up to 5 minutes to process.

                    Would like to continue?`,
            confirmButtonText: 'Proceed...I will wait',
            showCancelButton: true,
            showDenyButton: true,
            showConfirmButton: true,
            closeButtonHtml: 'Not now, but keep my current changes',
            cancelButtonText: 'Cancel...reject all my unsaved changes.',
        });

        return dialogResponse.isDismissed || dialogResponse.isDenied;
    }

    // changeSet.requestUri = changeSet.requestUri.replace(
    //     _spPageContextInfo.webAbsoluteUrl,
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    //     (_spPageContextInfo as any).__webAbsoluteUrl
}
