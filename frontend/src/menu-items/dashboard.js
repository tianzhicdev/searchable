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
            id: 'landing',
            title: 'Search & Browse',
            type: 'item',
            url: '/landing',
            icon: icons.IconDashboard,
            breadcrumbs: false
        }
    ]
};

export default dashboard;