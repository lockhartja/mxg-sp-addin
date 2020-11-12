import { XtendedFuseNavItem } from '@atypes';

export const DEFAULT_NAV_STUB: XtendedFuseNavItem = {
    id: 'global_nav_config',
    title: 'Global Applications',
    type: 'group',
    spGroupId: 'sma-user',
    children: [
        {
            id: 'css-nav-config',
            title: 'Commander Support',
            spGroupId: 'sma-css-unit',
            icon: 'gavel',
            type: 'collapsable',
            children: [
                {
                    title: 'About',
                    id: 'css-nav-config-about',
                    spGroupId: 'sma-css-unit',
                    icon: 'info',
                    type: 'item',
                    url: 'css/css-about',
                },
                {
                    title: 'Unit Rosters',
                    id: 'css-nav-config-rosters',
                    spGroupId: 'sma-css-unit',
                    icon: 'list',
                    type: 'item',
                    url: 'css/css-rosters',
                },
            ],
        },
    ],
};

export const ADMIN_NAV_STUB: XtendedFuseNavItem = {
    id: 'admin_nav_config',
    title: 'Global Administrator',
    type: 'item',
    url: 'admin',
    spGroupId: 'sma-global-admin',
    children: [],
};

export const METRIC_NAV_STUB: XtendedFuseNavItem = {
    id: 'msm_nav_config',
    title: 'MXG Strategic Menu',
    type: 'item',
    url: 'msm',
    spGroupId: 'sma-metric-user',
    children: [],
};

export const SECMGR_NAV_STUB: XtendedFuseNavItem = {
    id: 'sec_nav_config',
    title: 'Security Management',
    type: 'group',
    spGroupId: 'sma-secmgr-user',
    children: [],
};
