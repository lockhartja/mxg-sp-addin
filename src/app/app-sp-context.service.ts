// import { Injectable } from '@angular/core';
// import {
//     CompatibilityFix,
//     DoNotCare,
//     ISPUserProfileProperties,
//     ObjectInitializer,
//     SpMetadataMap,
//     XtendedFuseNavItem,
// } from '@atypes';
// import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
// import { MetadataLookup, SharePointUser } from '@models';
// import { environment } from 'environments/environment';
// import { loadPageContext } from 'sp-rest-proxy/dist/utils/env';
// import * as globalNavConfigs from './app-global.navigation';

// @Injectable({
//     providedIn: 'root',
// })
// export class AppSpCtxService {
//     userContext: SharePointUser = {} as ObjectInitializer;
//     spUserProps: ISPUserProfileProperties;
//     spUserGroups: SP.GroupCollection;
//     spoCtx: SP.ClientContext;
//     spoPeopleMgr: SP.UserProfiles.PeopleManager;
//     spoUser: SP.User;
//     spoWeb: SP.Web;
//     spoWebUrl: string;
//     metadataLookups: SpMetadataMap = new Map();
//     private rankMetadataLookup: MetadataLookup[];
//     private afscMetadataLookup: MetadataLookup[];
//     private leaderRoleMetadataLookup: MetadataLookup[] = [];
//     private orgMetadataLookup: MetadataLookup[];
//     private resolver: Function;
//     private rejecter: Function;

//     private termSetAfscGuid = new SP.Guid(
//         '8475d539-3081-4eed-bdd5-780cedf88e80'
//     );

//     private termSetLeadershipRoleGuid = new SP.Guid(
//         '461d68c5-d0d4-4443-9364-5a47d595cb20'
//     );

//     private termSetOrgStructureGuid = new SP.Guid(
//         'c18067ae-5678-4d20-a24f-2839369ed78c'
//     );

//     private termSetRankStructureGuid = new SP.Guid(
//         '3c34d697-ceb3-46b5-bc01-79b0146e2a22'
//     );

//     constructor(private navService: FuseNavigationService) {}

//     ctxLoadComponent<T>(component: T): Promise<T> {
//         return new Promise<T>((resolve, reject) => {
//             this.spoCtx.executeQueryAsync(
//                 this.ctxLoadSuccess(resolve),
//                 this.ctxLoadFailure(reject)
//             );
//         });
//     }

//     initializeSPContext() {
//         const spCtxInitializer = new Promise(async (resolve, reject) => {
//             this.resolver = resolve;
//             this.rejecter = reject;

//             if (!SP) {
//                 throw new Error('No Global SP Context found!');
//             }

//             try {
//                 // Will load the global _spPageContextInfo object;
//                 await loadPageContext();

//                 this.spoCtx = SP.ClientContext.get_current();

//                 this.spoWeb = this.spoCtx.get_web();

//                 this.spoCtx.load(this.spoWeb);

//                 this.spoCtx.executeQueryAsync(
//                     this.spoWebCtxSuccess,
//                     this.spoFailedQuery
//                 );
//             } catch (error) {
//                 throw new Error(error);
//             }
//         });

//         return () => spCtxInitializer;
//     }

//     /**
//      * https://docs.microsoft.com/en-us/previous-versions/office/sharepoint-visio/dn312531(v=office.15)
//      */
//     getManagedMetadata() {
//         const taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(
//             this.spoCtx
//         );

//         const termStore = taxonomySession.getDefaultSiteCollectionTermStore();

//         const afscTermSet = termStore.getTermSet(this.termSetAfscGuid);

//         const leadershipTermSet = termStore.getTermSet(
//             this.termSetLeadershipRoleGuid
//         );

//         const orgStructureTermSet = termStore.getTermSet(
//             this.termSetOrgStructureGuid
//         );

//         const rankStructureTermSet = termStore.getTermSet(
//             this.termSetRankStructureGuid
//         );

//         const afscTerms = afscTermSet.getAllTerms();
//         const leadershipTerms = leadershipTermSet.getAllTerms();
//         const orgStructureTerms = orgStructureTermSet.getAllTerms();
//         const rankStructureTerms = rankStructureTermSet.getAllTerms();

//         this.spoCtx.load(afscTermSet);
//         this.spoCtx.load(leadershipTermSet);
//         this.spoCtx.load(orgStructureTermSet);
//         this.spoCtx.load(rankStructureTermSet);
//         this.spoCtx.load(
//             afscTerms,
//             'Include(Id, IsRoot, Name, TermsCount, IsAvailableForTagging, Parent, Parent.Id, Parent.Name, PathOfTerm)'
//         );
//         this.spoCtx.load(
//             leadershipTerms,
//             'Include(Id, IsRoot, Name, TermsCount, IsAvailableForTagging, Parent, Parent.Id, Parent.Name, PathOfTerm)'
//         );
//         this.spoCtx.load(
//             orgStructureTerms,
//             'Include(Id, IsRoot, Name, TermsCount, IsAvailableForTagging, Parent, Parent.Id, Parent.Name, PathOfTerm)'
//         );
//         this.spoCtx.load(
//             rankStructureTerms,
//             'Include(Id, IsRoot, Name, TermsCount, IsAvailableForTagging, Parent, Parent.Id, Parent.Name, PathOfTerm)'
//         );

//         this.spoCtx.executeQueryAsync(() => {
//             this.orgMetadataLookup = this.buildMetadataLookup(
//                 orgStructureTerms
//             );

//             this.afscMetadataLookup = this.buildMetadataLookup(afscTerms);

//             this.rankMetadataLookup = this.buildMetadataLookup(
//                 rankStructureTerms
//             );

//             this.leaderRoleMetadataLookup = this.buildMetadataLookup(
//                 leadershipTerms
//             );

//             this.afscMetadataLookup.forEach(
//                 (aml) => (aml.termSetMetadataList = this.afscMetadataLookup)
//             );

//             this.rankMetadataLookup.forEach(
//                 (rml) => (rml.termSetMetadataList = this.rankMetadataLookup)
//             );

//             this.leaderRoleMetadataLookup.forEach(
//                 (lrml) =>
//                     (lrml.termSetMetadataList = this.leaderRoleMetadataLookup)
//             );

//             this.orgMetadataLookup.forEach(
//                 (org) => (org.termSetMetadataList = this.orgMetadataLookup)
//             );

//             this.metadataLookups.set('org', this.orgMetadataLookup);
//             this.metadataLookups.set('afsc', this.afscMetadataLookup);
//             this.metadataLookups.set(
//                 'leaderRole',
//                 this.leaderRoleMetadataLookup
//             );
//             this.metadataLookups.set('rank', this.rankMetadataLookup);
//         }, this.spoFailedQuery);
//     }

//     private buildMetadataLookup(
//         tc: SP.Taxonomy.TermCollection
//     ): MetadataLookup[] {
//         const terms = tc.get_data();
//         return terms.map(
//             (term) =>
//                 new MetadataLookup(
//                     term.get_id().toString(),
//                     term.get_name(),
//                     term.get_isRoot(),
//                     !term.get_isRoot() && term.get_parent().get_id().toString()
//                 )
//         );
//     }

//     private ctxLoadSuccess(resolver: Function) {
//         return (
//             sender: DoNotCare,
//             args: SP.ClientRequestSucceededEventArgs
//         ) => {
//             resolver(args);
//         };
//     }

//     private ctxLoadFailure(reject: Function) {
//         return (sender: DoNotCare, args: SP.ClientRequestFailedEventArgs) =>
//             this.spoFailedQuery(sender, args, reject);
//     }

//     private fetchUserSpoProfileProps = () => {
//         if (!environment.production) {
//             this.spoPeopleMgrSuccess({}, {} as DoNotCare);
//             return;
//         }
//         this.spoPeopleMgr = new SP.UserProfiles.PeopleManager(this.spoCtx);
//         this.spoUser = this.spoWeb.get_currentUser();
//         this.spUserGroups = this.spoUser.get_groups();
//         this.spoUser.retrieve();
//         this.spoCtx.load(this.spoUser);
//         this.spoCtx.load(this.spUserGroups);
//         this.spoCtx.load(this.spoPeopleMgr.getMyProperties());

//         this.spoCtx.executeQueryAsync(
//             this.spoPeopleMgrSuccess,
//             this.spoFailedQuery
//         );
//     };

//     private loadNavMenu(): void {
//         const authorizedNavItems: XtendedFuseNavItem[] = [];

//         const allNavConfigs = Object.keys(globalNavConfigs).map(
//             (key) => globalNavConfigs[key]
//         ) as XtendedFuseNavItem[];

//         if (!environment.production) {
//             this.navService.register('main', allNavConfigs);
//             this.navService.setCurrentNavigation('main');
//             return;
//         }

//         this.userContext.groups = [];

//         const iterator = this.spUserGroups.getEnumerator();

//         while (iterator.moveNext()) {
//             const currentGrp = iterator.get_current();

//             const relatedNavCfg = allNavConfigs.find(
//                 (nav) => nav.spGroupId === iterator.get_current().get_title()
//             );

//             if (!!relatedNavCfg) {
//                 authorizedNavItems.push(relatedNavCfg);
//             }

//             this.userContext.groups.push(
//                 currentGrp.get_title() as CompatibilityFix
//             );
//         }

//         this.navService.register('main', authorizedNavItems);
//         this.navService.setCurrentNavigation('main');
//     }

//     private spoFailedQuery = (
//         sender: DoNotCare,
//         args: SP.ClientRequestFailedEventArgs,
//         reject?: Function
//     ) => {
//         console.log(args.get_errorDetails());
//         console.log(args.get_errorValue());
//         console.log(args.get_message());
//         console.log(args.get_request());
//         console.log(args.get_stackTrace());
//         reject ? reject(args) : this.rejecter(args);
//     };

//     private spoWebCtxSuccess = (
//         sender: DoNotCare,
//         args: SP.ClientRequestSucceededEventArgs
//     ) => {
//         this.spoWebUrl = this.spoWeb.get_url();
//         this.getManagedMetadata();
//         this.fetchUserSpoProfileProps();
//     };

//     private spoPeopleMgrSuccess = (
//         sender: DoNotCare,
//         args: SP.ClientRequestSucceededEventArgs
//     ) => {
//         if (!!environment.production) {
//             this.spUserProps = this.spoPeopleMgr
//                 .getMyProperties()
//                 .get_userProfileProperties();

//             this.userContext.accountName = this.spUserProps.AccountName;
//             this.userContext.preferredName = this.spUserProps.PreferredName;
//             this.userContext.department = this.spUserProps.Department;
//             this.userContext.title = this.spUserProps.Title;
//             this.userContext.userName = this.spUserProps.UserName;
//             this.userContext.office = this.spUserProps.Office;
//             this.userContext.firstName = this.spUserProps.FirstName;
//             this.userContext.lastName = this.spUserProps.LastName;
//             this.userContext.workPhone = this.spUserProps.WorkEmail;
//         } else {
//             this.userContext.accountName =
//                 'i:0#.f|membership|johnny.lockhart@us.af.mil';
//             this.userContext.preferredName =
//                 'LOCKHART, JOHNNY A MSgt USAF AFGSC 5 MXG/MXOP';
//             this.userContext.department = 'AFGSC';
//             this.userContext.title = 'Group Security Manager';
//             this.userContext.profilePicture =
//                 'https://usaf-my.dps.mil:443/User%20Photos/Profile%20Pictures/johnny_lockhart_us_af_mil_MThumb.jpg';
//             this.userContext.userName = 'johnny.lockhart@us.af.mil';
//             this.userContext.office = 'MXOP';
//             this.userContext.firstName = 'JOHNNY';
//             this.userContext.lastName = 'LOCKHART';
//             this.userContext.workPhone = '453-1850';
//             this.userContext['SPS-StatusNotes'] = 'dodId placeholder';
//             this.userContext.groups = ['sm-global-admin'];
//         }
//         this.loadNavMenu();
//         this.resolver(args);
//     };
// }
