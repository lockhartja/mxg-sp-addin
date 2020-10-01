import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { DoNotCare } from '@atypes';
import { AppSpCtxService } from 'app/app-sp-context.service';
import { listenerCount } from 'process';
import { AdminServicesModule } from './admin-services.module';

@Injectable({ providedIn: AdminServicesModule })
export class AdminUowService implements Resolve<DoNotCare> {
    private resolver: Function;
    private rejector: Function;
    private strikerPKeyList: any[];

    constructor(private appInitializer: AppSpCtxService) {}

    async resolve(): Promise<unknown> {
        return;
    }

    async getSpKey(refresh = false): Promise<any[]> {
        if (this.strikerPKeyList && !refresh) {
            return this.strikerPKeyList;
        }
        const spCtx = this.appInitializer.spoCtx;

        const listCollection = this.appInitializer.spoWeb
            .get_lists()
            .getByTitle('StrikerPKey')
            .getItems(undefined);

        spCtx.load(
            listCollection,
            'Include(Id, DisplayName, HasUniqueRoleAssignments)'
        );

        this.strikerPKeyList = [];

        await this.appInitializer.ctxLoadComponent(listCollection);

        const listEnumerator = listCollection.getEnumerator();

        while (listEnumerator.moveNext()) {
            console.log(listEnumerator.get_current());
            const newKey = {};
        }
    }
}
