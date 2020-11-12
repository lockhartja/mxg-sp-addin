import { DataSource } from '@angular/cdk/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
    EntityShortNameByNamespace,
    EntityTypeByShortName,
    RawEntity,
    SpEntityNamespaces,
    XtendedEntityMgr,
} from '@atypes';
import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

export class EmDataSource<
    TNamespace extends SpEntityNamespaces,
    TEntityShortName extends EntityShortNameByNamespace<TNamespace>
> extends DataSource<EntityTypeByShortName<TEntityShortName>> {
    private filterValue: string;
    private disconnectSub: Subject<never>;

    constructor(
        private em: XtendedEntityMgr<TNamespace>,
        private eName: TEntityShortName,
        private matPaginator?: MatPaginator,
        private matSort?: MatSort,
        private dataFilter?: BehaviorSubject<
            [
                searchProps: Array<keyof RawEntity<EntityTypeByShortName<TEntityShortName>>>,
                searchValue: string
            ]
        >
    ) {
        super();
        this.disconnectSub = new Subject();
    }

    connect(): Observable<EntityTypeByShortName<TEntityShortName>[]> {
        const dataConditions = [
            this.matPaginator.page,
            this.matSort.sortChange,
            this.dataFilter,
            this.em.onEntityStateChanged([this.eName], this.disconnectSub),
        ];

        return merge(...dataConditions).pipe(
            map(() => {
                const allEntities = this.em.getEntities(this.eName) as EntityTypeByShortName<
                    TEntityShortName
                >[];

                const filteredEntities = allEntities.filter(this.searchInEntity);

                const sortedEntities = filteredEntities.sort(this.sortEntities);

                if (!this.matPaginator) {
                    return sortedEntities;
                }

                const startIndex = this.matPaginator.pageIndex * this.matPaginator.pageSize;
                return sortedEntities.splice(startIndex, this.matPaginator.pageSize);
            }, takeUntil(this.disconnectSub))
        );
    }

    disconnect(): void {
        this.disconnectSub.next();
        this.disconnectSub.complete();
    }

    private searchInEntity = (entity: EntityTypeByShortName<TEntityShortName>): boolean => {
        if (!this.dataFilter?.value) {
            return true;
        }

        const [searchProps, value] = this.dataFilter.value;

        const normalizedValue = value.toString().toLowerCase();

        for (const prop of searchProps) {
            const eValue = entity[prop] as unknown;

            //Will need to revisit for other datatype i.e. Dates, Children, etc.
            switch (typeof eValue) {
                case 'string':
                    return eValue.toLowerCase().includes(normalizedValue);
                case 'number':
                case 'bigint':
                    return eval.toString().includes(normalizedValue);
                case 'undefined':
                    return false;
                default:
                    return false;
            }
        }
    };

    private sortEntities = (
        a: EntityTypeByShortName<TEntityShortName>,
        b: EntityTypeByShortName<TEntityShortName>
    ): number => {
        const activeSorProp = this.matSort?.active;

        if (!activeSorProp || this.matSort.direction === '') {
            return 0;
        }

        const valueA = (isNaN(+a[activeSorProp]) ? a[activeSorProp] : +a[activeSorProp]) as number;
        const valueB = (isNaN(+b[activeSorProp]) ? b[activeSorProp] : +b[activeSorProp]) as number;

        return (valueA < valueB ? -1 : 1) * (this.matSort.direction === 'asc' ? 1 : -1);
    };
}
