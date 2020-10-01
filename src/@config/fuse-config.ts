import { XtendedFuseConfig } from '@atypes/fuse-extended';

export const DEFAULT_FUSE_CONFIG: XtendedFuseConfig = {
    colorTheme: 'theme-default',
    customScrollbars: true,
    layout: {
        style: 'vertical-layout-1',

        width: 'fullwidth',

        showThemePanel: true,

        showChatPanel: false,

        navbar: {
            primaryBackground: 'fuse-navy-700',
            secondaryBackground: 'fuse-navy-900',
            folded: false,
            hidden: false,
            position: 'left',
            variant: 'vertical-style-2',
        },
        toolbar: {
            customBackgroundColor: false,
            background: 'fuse-white-500',
            hidden: false,
            position: 'below-fixed',
        },
        footer: {
            customBackgroundColor: true,
            background: 'fuse-navy-900',
            hidden: false,
            position: 'below-fixed',
        },
        sidepanel: {
            hidden: false,
            position: 'right',
        },
    },
};
