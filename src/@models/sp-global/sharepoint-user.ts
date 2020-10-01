import { AppSpUserPermission } from '@atypes';

export class SharePointUser {
    // i:0|membership ...
    accountName: string;
    // Lockhart, Johnny A MSgt USAF AFGSC ...
    _preferredName: string;
    // MAJCOM
    department: string;
    // Group Security Manager
    title: string;
    // johnny.lockhart@us.af.mil
    userName: string;
    // MXOP
    office: string;
    manager: string;
    firstName: string;
    lastName: string;
    // 453-1850
    workPhone: string;
    rank: string;
    profilePicture: string;
    groups: AppSpUserPermission[];

    get preferredName(): string {
        return this._preferredName;
    }

    set preferredName(name: string) {}
}
