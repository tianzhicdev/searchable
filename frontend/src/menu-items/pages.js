// assets
import { IconUser, IconFileText, IconStar } from '@tabler/icons';

// constant
const icons = {
    IconUser,
    IconFileText,
    IconStar
};

// ===========================|| PAGES MENU ITEMS ||=========================== //

const pages = {
    id: 'pages',
    title: 'Pages',
    type: 'group',
    children: [
        {
            id: 'publish-searchables',
            title: 'Publish Item',
            type: 'item',
            url: '/publish-searchables',
            icon: icons.IconFileText,
            breadcrumbs: false
        },
        {
            id: 'my-purchases',
            title: 'My Purchases',
            type: 'item',
            url: '/my-purchases',
            icon: icons.IconStar,
            breadcrumbs: false
        },
        {
            id: 'profile',
            title: 'Profile',
            type: 'item',
            url: '/profile',
            icon: icons.IconUser,
            breadcrumbs: false
        }
    ]
};

export default pages;