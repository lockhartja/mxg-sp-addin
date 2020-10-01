import {
    SharepointNamespace,
    GetEntityInNamespace,
    ReturnType,
    Instantiable,
} from '@atypes';

export class EmServiceProviderConfig<TNamespace extends SharepointNamespace> {
    readonly adapterName = 'spDataService';
    readonly serviceEnd: string;
    readonly ctxEnd: string;
    readonly odataAppEnd: string;

    constructor(
        public namespace: TNamespace,
        public featureEntities: Instantiable<
            GetEntityInNamespace<TNamespace, ReturnType>
        >[],
        public sharepointSiteUrl = `${window.location.protocol}//${window.location.host}/teams/5MXG-WM/striker-app`
    ) {
        this.serviceEnd = `${sharepointSiteUrl}/${namespace}`;
        this.ctxEnd = `${sharepointSiteUrl}/${namespace}/_api/contextinfo`;
        this.odataAppEnd = `${sharepointSiteUrl}/${namespace}/_api/$batch`;
    }
}
