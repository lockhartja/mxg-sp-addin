/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@angular/core';
import { SpEntityNamespaces } from '@atypes';
import { RepoFactory } from '@data';

@Injectable({
    providedIn: 'root',
})
export class CentralRepositoryService {
    centralRepoCollection = {} as any;

    registerRepo<TNamespace extends SpEntityNamespaces>(
        namespace: TNamespace,
        repoFactory: RepoFactory<TNamespace>
    ): void {
        if (this.centralRepoCollection[namespace]) {
            throw new Error('Attempting to rer');
        }

        this.centralRepoCollection[namespace] = repoFactory;
    }

    getFactory<TNamespace extends SpEntityNamespaces>(namespace: TNamespace): RepoFactory<TNamespace> {
        return this.centralRepoCollection[namespace];
    }
}
