// import { Injectable } from '@angular/core';
// import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
// import { FuseNavigation } from '@fuse/types';

// @Injectable({ providedIn: 'root' })
// export class NavConfiguator {
//     currentMenuStructure: [string, FuseNavigation[]] = [] as any;

//     constructor(private navService: FuseNavigationService) {}

//     addFeatureMenu(featureName: string, featureNav: FuseNavigation): void {
//         const newMenuName = this.currentMenuStructure[0] + featureName;
//     }
// }

// export const basicNavStructure: FuseNavigation = {
//     id: 'global',
//     title: 'Global Applications',
//     type: 'group',
//     children: [
//         {
//             icon: 'person',
//             url: '/home',
//             title: 'Home',
//             type: 'item',
//             id: 'globalHomeDash',
//         },
//     ],
// };

// export const aagtNavStructure: FuseNavigation = {
//     id: 'aagt',
//     title: 'Aircraft/Armanent Generation',
//     type: 'group',
//     children: [
//         {
//             id: 'aagtGenList',
//             title: 'Generation Scheduler',
//             type: 'item',
//             icon: 'reciept',
//             url: 'aagt/generations',
//         },
//         {
//             id: 'aagtGenManager',
//             icon: 'web',
//             type: 'collapsable',
//             title: 'Generation Manager',
//             children: [
//                 {
//                     id: 'aagtGenMgrPlanner',
//                     title: 'Generation Planner',
//                     type: 'item',
//                     url: 'aagt/plan-generation/new',
//                 },
//                 {
//                     id: 'aagtGenMgrActionMgr',
//                     title: 'Action Item Manager',
//                     type: 'item',
//                     url: 'aagt/action-items',
//                     exactMatch: true,
//                 },
//                 {
//                     id: 'aagtGenMgrResourceMgr',
//                     title: 'Resource Manager',
//                     type: 'item',
//                     url: 'aagt/gen-manager/resource-management',
//                 },
//             ],
//         },
//     ],
// };
