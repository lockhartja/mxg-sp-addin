import { Instantiable, SpEntities, SpEntityNamespaces } from '@atypes';

export class EmServiceProviderConfig<TNamespace extends SpEntityNamespaces> {
    readonly adapterName = 'spDataService';
    readonly serviceEnd: string;
    readonly ctxEnd: string;
    readonly odataAppEnd: string;

    constructor(
        public namespace: TNamespace,
        public featureEntities: Instantiable<SpEntities>[],
        public sharepointSiteUrl = `${window.location.protocol}//${window.location.host}/teams/5MXG-WM/striker-app`
    ) {
        if (namespace === 'Global') {
            this.serviceEnd = `${sharepointSiteUrl}/`;
            this.ctxEnd = `${sharepointSiteUrl}/_api/contextInfo`;
            this.odataAppEnd = `${sharepointSiteUrl}/_api/$batch`;
        } else {
            this.serviceEnd = `${sharepointSiteUrl}/${namespace}`;
            this.ctxEnd = `${sharepointSiteUrl}/${namespace}/_api/contextInfo`;
            this.odataAppEnd = `${sharepointSiteUrl}/${namespace}/_api/$batch`;
        }
    }
}
