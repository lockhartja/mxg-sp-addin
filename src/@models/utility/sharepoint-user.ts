import { SpUserPermissionGroup } from '@atypes';
import { camelCase } from 'lodash';

export class SharePointUser {
    constructor(spUserProps: Record<string, unknown>) {
        Object.entries(spUserProps)
            .filter((prop) => prop[0] !== 'UserProfileProperties')
            .forEach((prop) => {
                this[camelCase(prop[0])] = prop[1];
            });

        const profileProps = spUserProps['UserProfileProperties'] as Array<{
            Key: string;
            Value: string;
        }>;

        if (profileProps) {
            profileProps
                .filter((prop) => !!prop.Value)
                .forEach((prop) => (this[camelCase(prop.Key)] = prop.Value));
        }
    }
    // i:0|membership ...
    accountName: string;

    // Lockhart, Johnny A MSgt USAF AFGSC ...
    preferredName: string;

    displayName: string;

    directReports: string[];
    // MAJCOM
    department: string;

    // johnny.lockhart@us.af.mil
    email: string;

    /**
     * i:0#.f|membership|bradley.cochran@us.af.mil"
     * i:0#.f|membership|aaron.cowley@us.af.mil"
     * "i:0#.f|membership|brian.anderson.56@us.af.mil"
     * "i:0#.f|membership|joseph.miles.1@us.af.mil"
     */
    extendedManagers: string[];

    extendedReports: string[];

    isFollowed: boolean;

    latestPost: string;

    peers: string[];

    personalSiteHostUrl: string;

    personalUrl: string;

    pictureUrl: string;

    // Group Security Manager
    title: string;

    userName: string;
    // MXOP
    office: string;

    userUrl: string;

    manager: string;

    firstName: string;

    lastName: string;
    // 453-1850
    workPhone: string;

    rank: string;

    profilePicture: string;

    groups: SpUserPermissionGroup[];
}
