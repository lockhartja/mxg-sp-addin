import { SpTermStores } from '@atypes';
import { BzDataProp, BzEntity, BzNavProp, BzEntityKey } from '@models/decorator';
import { AutoGeneratedKeyType, DataType } from 'breeze-client';
import { SpEntityBase } from './sp-entity-base';
import { TermSet } from './term-set';

@BzEntity
@BzEntityKey(AutoGeneratedKeyType.None)
export class RootTermStore extends SpEntityBase {
    readonly namespace = 'Global';
    readonly shortName = 'RootTermStore';

    @BzDataProp({
        isPartOfKey: true,
        isNullable: false,
        dataType: DataType.Guid,
    })
    id: string;

    name: SpTermStores;

    @BzNavProp({ entityTypeName: 'TermSet' })
    termSets: TermSet[];
}
