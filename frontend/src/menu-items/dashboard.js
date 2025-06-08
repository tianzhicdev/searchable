// assets
import { IconDashboard } from '@tabler/icons';

// constant
const icons = { IconDashboard };

// ===========================|| DASHBOARD MENU ITEMS ||=========================== //

const dashboard = {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    children: [
        {
            id: 'searchables',
            title: 'Searchables',
            type: 'item',
            url: '/searchables',
            icon: icons.IconDashboard,
            breadcrumbs: false
        }
    ]
};

export default dashboard;