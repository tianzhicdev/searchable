import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import { Box, Drawer, useMediaQuery } from '@material-ui/core';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';
import { BrowserView, MobileView } from 'react-device-detect';

// project imports
import MenuList from './MenuList';
import LogoSection from '../LogoSection';
import MenuCard from './MenuCard';
import { drawerWidth } from './../../../store/constant';

// Import spacing utilities
import { spacing } from './../../../utils/spacing';

// style constant
const useStyles = makeStyles((theme) => ({
    drawer: {
        [theme.breakpoints.up('md')]: {
            width: drawerWidth,
            flexShrink: 0
        }
    },
    drawerPaper: {
        width: drawerWidth,
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderRight: 'none',
        [theme.breakpoints.up('md')]: {
            top: '88px'
        }
    },
    ScrollHeight: {
        height: 'calc(100vh - 88px)',
        paddingLeft: theme.spacing(spacing.container.md), // 24px on desktop
        paddingRight: theme.spacing(spacing.container.md),
        [theme.breakpoints.down('sm')]: {
            height: 'calc(100vh - 56px)',
            paddingLeft: theme.spacing(spacing.container.xs), // 16px on mobile
            paddingRight: theme.spacing(spacing.container.xs)
        }
    },
    boxContainer: {
        display: 'flex',
        padding: theme.spacing(spacing.container.md), // 24px on desktop
        marginLeft: 'auto',
        marginRight: 'auto',
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(spacing.container.xs) // 16px on mobile
        }
    }
}));

//-----------------------|| SIDEBAR DRAWER ||-----------------------//

const Sidebar = ({ drawerOpen, drawerToggle, window }) => {
    const classes = useStyles();
    const theme = useTheme();
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

    const drawer = (
        <React.Fragment>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <div className={classes.boxContainer}>
                    <LogoSection />
                </div>
            </Box>
            <BrowserView>
                <PerfectScrollbar component="div" className={classes.ScrollHeight}>
                    <MenuList />
                    {/* <MenuCard /> */}
                </PerfectScrollbar>
            </BrowserView>
            <MobileView>
                <Box sx={{ px: spacing.container.xs }}>
                    <MenuList />
                    {/* <MenuCard /> */}
                </Box>
            </MobileView>
        </React.Fragment>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <nav className={classes.drawer} aria-label="mailbox folders">
            <Drawer
                container={container}
                variant={matchUpMd ? 'persistent' : 'temporary'}
                anchor="left"
                open={drawerOpen}
                onClose={drawerToggle}
                classes={{
                    paper: classes.drawerPaper
                }}
                ModalProps={{ keepMounted: true }}
                color="inherit"
            >
                {drawer}
            </Drawer>
        </nav>
    );
};

Sidebar.propTypes = {
    drawerOpen: PropTypes.bool,
    drawerToggle: PropTypes.func,
    window: PropTypes.object
};

export default Sidebar;
