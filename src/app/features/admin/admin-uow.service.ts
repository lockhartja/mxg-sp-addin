import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { AdminServicesModule } from './admin-services.module';

@Injectable({ providedIn: AdminServicesModule })
export class AdminUowService implements Resolve<any> {
    private resolver: () => void;
    private rejector: () => void;
    private strikerPKeyList: string[];

    resolve(): void {
        return;
    }

    getSpKey(refresh = false): void {
        // if (this.strikerPKeyList && !refresh) {
        //     return this.strikerPKeyList;
        // }
        // const spCtx = this.appInitializer.spoCtx;
        // const listCollection = this.appInitializer.spoWeb
        //     .get_lists()
        //     .getByTitle('StrikerPKey')
        //     .getItems(undefined);
        // spCtx.load(
        //     listCollection,
        //     'Include(Id, DisplayName, HasUniqueRoleAssignments)'
        // );
        // this.strikerPKeyList = [];
        // await this.appInitializer.ctxLoadComponent(listCollection);
        // const listEnumerator = listCollection.getEnumerator();
        // while (listEnumerator.moveNext()) {
        //     console.log(listEnumerator.get_current());
        //     const newKey = {};
        // }
    }
}
