import { XtendedFuseNavItem } from '@atypes';

export const DEFAULT_NAV_STUB: XtendedFuseNavItem = {
    id: 'global_nav_config',
    title: 'Global Applications',
    type: 'group',
    spGroupId: 'sm-user',
    children: [],
};

export const ADMIN_NAV_STUB: XtendedFuseNavItem = {
    id: 'admin_nav_config',
    title: 'Global Administrator',
    type: 'item',
    url: 'admin',
    spGroupId: 'sm-global-admin',
    children: [],
};

export const METRIC_NAV_STUB: XtendedFuseNavItem = {
    id: 'msm_nav_config',
    title: 'MXG Strategic Menu',
    type: 'item',
    url: 'msm',
    spGroupId: 'sm-metric-user',
    children: [],
};

export const SECMGR_NAV_STUB: XtendedFuseNavItem = {
    id: 'sec_nav_config',
    title: 'Security Management',
    type: 'group',
    spGroupId: 'sm-secmgr-user',
    children: [],
};
