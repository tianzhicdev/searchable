// assets
import { IconDashboard, IconUsers } from '@tabler/icons';

// constant
const icons = { IconDashboard, IconUsers };

// ===========================|| DASHBOARD MENU ITEMS ||=========================== //

const dashboard = {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    children: [
        {
            id: 'searchables',
            title: 'Browse Content',
            type: 'item',
            url: '/searchables',
            icon: icons.IconDashboard,
            breadcrumbs: false
        },
        {
            id: 'search-by-user',
            title: 'Find Creators',
            type: 'item',
            url: '/search-by-user',
            icon: icons.IconUsers,
            breadcrumbs: false
        }
    ]
};

export default dashboard;