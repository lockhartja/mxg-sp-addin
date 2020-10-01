export class MetadataLookup {
    public termSetMetadataList: MetadataLookup[];

    constructor(
        public spGuild: string,
        public defaultLabel: string,
        public isRoot: boolean,
        public parentId?: string
    ) {}

    get children(): MetadataLookup[] {
        return this.termSetMetadataList.filter(
            (term) => !term.isRoot && term.parentId === this.spGuild
        );
    }
}
