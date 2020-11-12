import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigationItem } from '@fuse/types';
import { matIcon } from './icon-valid';
import { SpUserPermissionGroup } from './sharepoint-entity';
import { AppEndpoints } from './utility';

export type XtendedFuseMatColor =
    | 'red'
    | 'fuse-black'
    | 'fuse-white'
    | 'fuse-navy'
    | 'blue-grey'
    | 'grey'
    | 'brown'
    | 'deep-orange'
    | 'orange'
    | 'amber'
    | 'yellow'
    | 'lime'
    | 'light-green'
    | 'green'
    | 'teal'
    | 'cyan'
    | 'light-blue'
    | 'blue'
    | 'indigo'
    | 'deep-purple'
    | 'purple'
    | 'pink';

export type XtendedFuseContrastColor =
    | '50'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | 'A100'
    | 'A200'
    | 'A400'
    | 'A700';

export type XtendedFuseColor = [XtendedFuseMatColor, XtendedFuseContrastColor];

export type XtendedFuseColorComponent = 'navbar' | '';

export interface XtendedFuseNavbarComponent {
    kind: 'navbar';
    availableSubProps: ['primaryBackground' | 'secondaryBackground'];
}

export interface XtendedFuseToolbarComponent {
    kind: 'toolbar';
    availableSubProps: ['background', 'customBackgroundColor'];
}

export interface XtendedFuseFooterComponent {
    kind: 'toolbar';
    availableSubProps: ['background', 'customBackgroundColor'];
}

export interface XtendedFuseConfig {
    colorTheme: 'theme-default' | 'theme-yellow-light' | 'theme-blue-gray-dark' | 'theme-pink-dark';

    customScrollbars: boolean;

    layout: {
        style:
            | 'vertical-layout-1'
            | 'vertical-layout-2'
            | 'vertical-layout-3'
            | 'horizontal-layout-1';

        showThemePanel: boolean;

        showChatPanel: boolean;

        width: 'fullwidth' | 'boxed';

        navbar: {
            primaryBackground: string;
            secondaryBackground: string;
            hidden: boolean;
            folded: boolean;
            position: 'left' | 'right' | 'top';
            variant: 'vertical-style-1' | 'horizontal-style-1' | 'vertical-style-2';
        };

        toolbar: {
            customBackgroundColor: boolean;
            background: string;
            hidden: boolean;
            position:
                | 'above'
                | 'above-static'
                | 'above-fixed'
                | 'below'
                | 'below-static'
                | 'below-fixed';
        };

        footer: {
            customBackgroundColor: boolean;
            background: string;
            hidden: boolean;
            position:
                | 'above'
                | 'above-static'
                | 'above-fixed'
                | 'below'
                | 'below-static'
                | 'below-fixed';
        };

        sidepanel: {
            hidden: boolean;
            position: 'left' | 'right';
        };
    };
}

export type AppNavStubs =
    | 'global_nav_config'
    | 'msm_nav_config'
    | 'admin_nav_config'
    | 'css-nav-config'
    | 'css-nav-config-about'
    | 'css-nav-config-rosters'
    | 'exec_nav_config'
    | 'sec_nav_config';

export interface XtendedFuseNavItem extends FuseNavigationItem {
    id: AppNavStubs;
    icon?: matIcon;
    url?: AppEndpoints;
    spGroupId: SpUserPermissionGroup;
    children?: XtendedFuseNavItem[];
}

export interface XtendedFuseNavigation extends XtendedFuseNavItem {
    children?: XtendedFuseNavItem[];
}

export interface XtendedFuseNavService extends FuseNavigationService {
    updateNavigationItem(
        id: AppNavStubs,
        properties: { children: [Partial<XtendedFuseNavItem>] }
    ): void;

    removeNavigationItem(id: AppNavStubs): void;

    getCurrentNavigation(): XtendedFuseNavigation[];
}
