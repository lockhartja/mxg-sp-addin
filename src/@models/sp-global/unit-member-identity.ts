import { SpListEntityBase } from '@models/abstract';
import { BzDataProp, BzEntity, BzSpInternalName } from '@models/decorator';

@BzEntity
export class UnitMemberIdentity extends SpListEntityBase {
    readonly namespace = 'SP.Global';
    readonly shortName = 'UnitMemberIdentity';

    @BzDataProp()
    publicId: string;

    @BzDataProp()
    @BzSpInternalName('Title')
    privateId: string;

    static encodeOneId(id: string, salter: number): string {
        const saltedId = +id * salter;
        return btoa(`${saltedId}`);
    }

    getClearedKey(salter: number): [publicId: string, privateId: string] {
        const clearPrivateId = atob(this.privateId);
        const clearPublicId = atob(this.publicId);

        const unsaltedPrivateId = +clearPrivateId / salter;
        const unsaltedPublicId = +clearPublicId / salter;

        return [`${unsaltedPublicId}`, `${unsaltedPrivateId}`];
    }

    updateKey(keys: [publicId: string, privateId: string], salter: number): void {
        const saltedPrivateId = +keys[1] * salter;
        const saltedPublicId = +keys[0] * salter;

        this.publicId = btoa(`${saltedPublicId}`);
        this.privateId = btoa(`${saltedPrivateId}`);
    }
}
