import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    ISharePointUserResponse,
    ISpContextResponse,
    SpDigestTokenCache,
    SpEntityNamespaces,
    SpTermStores,
    _spPageContextInfoXtended,
} from '@atypes';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { RootTermStore, SharePointUser, TermSet } from '@models';
import { interval, Subject } from 'rxjs';
import { switchMap, retry, takeUntil } from 'rxjs/operators';
import * as globalNavConfigs from '../../app/app-global.navigation';
import * as defaultData from './default-profile.json';
import { CentralRepositoryService } from 'app/app-central-repository.service';
import _ from 'lodash';
import { EntityState } from 'breeze-client';
import Swal from 'sweetalert2';

interface WebContextInit {
    ServerRelativeUrl: string;
    Language: string;
    Url: string;
    Title: string;
    CurrentUser: {
        Id: string;
        Title: string;
        Email: string;
        IsSiteAdmin: boolean;
        LoginName: string;
    };
}

interface SiteContextInit {
    ServerRelativeUrl: string;
    Url: string;
}

@Injectable({
    providedIn: 'root',
})
export class SpCtxRepoService {
    digestTokenCache: Partial<SpDigestTokenCache> = {};

    my: SharePointUser;

    /**
     * This is important not to change this variable as it is
     * meant to prevent the decoding of keys outside
     * of the application. Not meant to be any kind of secure
     * just as a small precaution and easily decoded.
     */
    salter: number;

    private digestCount = 0; //Will autoLog out after 60 runs;
    private resolver: (value?: unknown) => void;
    private rejector: (reason?: unknown) => void;
    private unsubscribe = new Subject();

    private cxtInfoHeaders = new HttpHeaders({
        'Content-Type': 'application/json;odata=minimalMetadata',
        Accept: 'application/json;odata=minimalMetadata',
        'X-ProxyStrict': 'false',
    });

    constructor(
        private http: HttpClient,
        private navService: FuseNavigationService,
        private centralRepo: CentralRepositoryService
    ) {}

    initializeApp(): () => Promise<Promise<void>> {
        return () =>
            new Promise((resolve, reject): void => {
                this.resolver = resolve;
                this.rejector = reject;

                void this.getMyProperties();
            });
    }

    async getMyProperties(): Promise<void> {
        try {
            const webContext = await this.http
                .get<WebContextInit>(
                    `/_api/web?$select=Title,Language,ServerRelativeUrl,Url,
                CurrentUser/Id,CurrentUser/LoginName,CurrentUser/Email,
                CurrentUser/Title,CurrentUser/IsSiteAdmin&$expand=CurrentUser`,
                    { headers: this.cxtInfoHeaders }
                )
                .toPromise();

            const siteContext = await this.http
                .get<SiteContextInit>(`/_api/site?$select=ServerRelativeUrl,Url`, {
                    headers: this.cxtInfoHeaders,
                })
                .toPromise();

            const _spPageContextInfoFake = {
                webTitle: webContext.Title,
                webAbsoluteUrl: window.location.origin + webContext.ServerRelativeUrl,
                webServerRelativeUrl: webContext.ServerRelativeUrl,
                currentLanguage: webContext.Language,
                siteAbsoluteUrl: window.location.origin + siteContext.ServerRelativeUrl,
                siteServerRelativeUrl: siteContext.ServerRelativeUrl,
                userId: webContext.CurrentUser.Id,
                userLoginName: webContext.CurrentUser.LoginName,
                userDisplayName: webContext.CurrentUser.Title,
                userEmail: webContext.CurrentUser.Email,
                isSiteAdmin: webContext.CurrentUser.IsSiteAdmin,
                __webAbsoluteUrl: webContext.Url,
                __siteAbsoluteUrl: siteContext.Url,
            };

            window._spPageContextInfo = (_spPageContextInfoFake as unknown) as _spPageContextInfoXtended;

            const response = await this.http
                .get<Record<string, unknown>>(
                    './_api/sp.userProfiles.peopleManager/getMyProperties'
                )
                .toPromise();

            this.my = new SharePointUser(response);

            const grpResponse = await this.http
                .get<ISharePointUserResponse>('_api/web/currentUser/?$expand=groups', {
                    headers: this.cxtInfoHeaders,
                })
                .toPromise();

            this.my.groups = grpResponse.Groups.map((grp) => grp.Title);
        } catch (e) {
            console.error('Unable to load a User Context, setting a default', e);

            const localData = (defaultData as unknown) as {
                default: typeof defaultData;
            };

            this.my = new SharePointUser(localData.default);

            this.my.groups = ['sma-global-admin', 'sma-css-group', 'sma-css-unit', 'sma-user'];

            this.loadNavMenu();
        }

        return this.getManagedMetadata();
    }

    getManagedMetadata(): void {
        const termStoreGroup: {
            termStore: SpTermStores;
            id: SP.Guid;
            rootTermSet?: SP.Taxonomy.TermSet;
            termCollection?: SP.Taxonomy.TermCollection;
            terms?: SP.Taxonomy.Term[];
        }[] = [
            {
                termStore: 'afsc-structure',
                id: new SP.Guid('8475d539-3081-4eed-bdd5-780cedf88e80'),
            },
            {
                termStore: 'leadership-structure',
                id: new SP.Guid('461d68c5-d0d4-4443-9364-5a47d595cb20'),
            },
            {
                termStore: 'org-structure',
                id: new SP.Guid('c18067ae-5678-4d20-a24f-2839369ed78c'),
            },
            {
                termStore: 'rank-structure',
                id: new SP.Guid('3c34d697-ceb3-46b5-bc01-79b0146e2a22'),
            },
        ];

        const spoCtx = SP.ClientContext.get_current();

        const taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(spoCtx);

        const termStore = taxonomySession.getDefaultSiteCollectionTermStore();

        termStoreGroup.forEach((group) => {
            group.rootTermSet = termStore.getTermSet(group.id);

            spoCtx.load(group.rootTermSet, 'Id', 'Name', 'CustomProperties');

            group.termCollection = group.rootTermSet.getAllTerms();

            spoCtx.load(
                group.termCollection,
                'Include(Id, IsRoot, Name, TermsCount, ' +
                    'IsAvailableForTagging, Parent, Parent.Id, ' +
                    'Parent.Name, PathOfTerm, Labels)'
            );
        });

        spoCtx.executeQueryAsync(
            () => {
                const repoFactory = this.centralRepo.getFactory('Global');
                const rootStoreRepoFactory = repoFactory.getRepo('RootTermStore');

                termStoreGroup.forEach((tsg) => {
                    const rootTermStoreInit: Partial<RootTermStore> = {
                        id: tsg.id.toString(),
                    };

                    const rootTermStore = rootStoreRepoFactory.createEntity(
                        rootTermStoreInit,
                        EntityState.Unchanged
                    );

                    rootTermStore.name = tsg.rootTermSet.get_name() as SpTermStores;

                    if (rootTermStore.name === 'rank-structure') {
                        const sideProps = tsg.rootTermSet.get_customProperties();
                        this.salter = +sideProps.salter;
                    }

                    _.flatMap(tsg.termCollection.get_data()).forEach((term: SP.Taxonomy.Term) => {
                        const termSetInit: Partial<TermSet> = {
                            id: term.get_id().toString(),
                            isRoot: term.get_isRoot(),
                            defaultLabel: term.get_name(),
                        };

                        termSetInit.parentId = term.get_isRoot()
                            ? undefined
                            : term.get_parent().get_id().toString();

                        rootTermStore
                            .createChild('TermSet', termSetInit)
                            .entityAspect.setUnchanged();
                    });
                });

                void this.setGlobalDigestToken();
            },
            (sender, args) => {
                console.error(args.get_message());
                this.rejector();
            }
        );
    }

    setDigestTokenForSite(
        namespace: SpEntityNamespaces,
        countRenewals = false
    ): () => Promise<boolean> {
        this.digestTokenCache[namespace] = {
            token: '',
            expires: 0,
        };

        return async () => {
            let path: string;

            if (namespace && namespace !== 'Global') {
                path = `./${namespace.toLowerCase()}/_api/contextInfo`;
            } else {
                path = './_api/contextInfo';
            }

            const query = this.http.post(path, undefined, {
                headers: this.cxtInfoHeaders,
            });

            try {
                const response = <ISpContextResponse>await query.toPromise();

                this.digestTokenCache[namespace] = {
                    expires: +response.FormDigestTimeoutSeconds,
                    token: response.FormDigestValue,
                };

                //Make a call 10 minutes before the expiration timeout
                interval((this.digestTokenCache[namespace].expires - 500) * 1000)
                    .pipe(
                        switchMap(() => query),
                        retry(3),
                        takeUntil(this.unsubscribe)
                    )
                    .subscribe((response: ISpContextResponse) => {
                        this.digestTokenCache[namespace].token = response.FormDigestValue;
                        this.digestTokenCache[
                            namespace
                        ].expires = +response.FormDigestTimeoutSeconds;

                        if (countRenewals) {
                            this.digestCount += 1;

                            if (this.digestCount > 3) {
                                void Swal.fire({
                                    text: 'Are you still there?',
                                    backdrop: true,
                                    showConfirmButton: true,
                                    timer: 15000,
                                }).then((response) => {
                                    if (response.isConfirmed) {
                                        this.digestCount = 1;
                                    } else {
                                        this.unsubscribe.next();
                                        this.unsubscribe.complete();
                                        window.location.href = (_spPageContextInfo as _spPageContextInfoXtended).__webAbsoluteUrl;
                                    }
                                });
                            }
                        }
                    });
                return true;
            } catch (e) {
                console.error(`Error Getting Digest Token for ${namespace}`, e);
                return false;
            }
        };
    }

    private loadNavMenu(): void {
        const authorizedNavItems = Object.entries(globalNavConfigs)
            .filter((navCfg) => this.my.groups.some((myGrp) => navCfg[1].spGroupId === myGrp))
            .map((navCfg) => navCfg[1]);

        this.navService.register('main', authorizedNavItems);
        this.navService.setCurrentNavigation('main');
    }

    private async setGlobalDigestToken(): Promise<void> {
        try {
            const globalObs = this.setDigestTokenForSite('Global', true);
            await globalObs();
            const globalSiteObs = this.setDigestTokenForSite('SP.Global');
            await globalSiteObs();
            this.resolver();
        } catch (e) {
            console.error(e);
        }
    }
}
