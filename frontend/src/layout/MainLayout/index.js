import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

// material-ui
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import { AppBar, CssBaseline, Toolbar, useMediaQuery } from '@material-ui/core';

// third-party
import clsx from 'clsx';

// project imports
import Breadcrumbs from './../../ui-component/extended/Breadcrumbs';
import Header from './Header';
import Sidebar from './Sidebar';
import Customization from './../Customization';
import navigation from './../../menu-items';
import { drawerWidth } from '../../store/constant';
import { SET_MENU } from './../../store/actions';
import ThemeDebug from '../../components/ThemeDebug';

// assets
import { IconChevronRight } from '@tabler/icons';

// Import spacing utilities
import { componentSpacing, spacing } from '../../utils/spacing';

// style constant
const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex'
    },
    appBar: {
        backgroundColor: theme.palette.background.default
    },
    appBarWidth: {
        transition: theme.transitions.create('width'),
        backgroundColor: theme.palette.background.default
    },
    content: {
        ...theme.typography.mainContent,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        // Desktop styles
        [theme.breakpoints.up('md')]: {
            marginLeft: -(drawerWidth - theme.spacing(2.5)), // 20px
            width: `calc(100% - ${drawerWidth}px)`,
            padding: theme.spacing(spacing.container.md), // 24px
        },
        // Tablet styles
        [theme.breakpoints.down('md')]: {
            marginLeft: theme.spacing(spacing.container.sm), // ~20px
            width: `calc(100% - ${theme.spacing(spacing.container.sm * 2)})`, // Account for margins
            padding: theme.spacing(spacing.container.sm), // 20px
        },
        // Mobile styles
        [theme.breakpoints.down('sm')]: {
            marginLeft: theme.spacing(spacing.container.xs), // 16px
            marginRight: theme.spacing(spacing.container.xs), // 16px
            width: `calc(100% - ${theme.spacing(spacing.container.xs * 2)})`, // Account for margins
            padding: theme.spacing(spacing.container.xs), // 16px
        }
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginLeft: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        [theme.breakpoints.down('md')]: {
            marginLeft: theme.spacing(spacing.container.sm) // 20px
        },
        [theme.breakpoints.down('sm')]: {
            marginLeft: theme.spacing(spacing.container.xs) // 16px
        }
    }
}));

//-----------------------|| MAIN LAYOUT ||-----------------------//

const MainLayout = ({ children }) => {
    const classes = useStyles();
    const theme = useTheme();
    const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

    // Handle left drawer
    const leftDrawerOpened = useSelector((state) => state.customization.opened);
    const dispatch = useDispatch();
    const handleLeftDrawerToggle = () => {
        dispatch({ type: SET_MENU, opened: !leftDrawerOpened });
    };

    React.useEffect(() => {
        dispatch({ type: SET_MENU, opened: !matchDownMd });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchDownMd]);

    return (
        <div className={classes.root}>
            <CssBaseline />
            {/* header */}
            <AppBar
                enableColorOnDark
                position="fixed"
                color="inherit"
                elevation={0}
                className={leftDrawerOpened ? classes.appBarWidth : classes.appBar}
            >
                <Toolbar>
                    <Header handleLeftDrawerToggle={handleLeftDrawerToggle} />
                </Toolbar>
            </AppBar>

            {/* drawer */}
            <Sidebar drawerOpen={leftDrawerOpened} drawerToggle={handleLeftDrawerToggle} />

            {/* main content */}
            <main
                className={clsx([
                    classes.content,
                    {
                        [classes.contentShift]: leftDrawerOpened
                    }
                ])}
            >
                {/* <Main open={leftDrawerOpened}> */}
                {/* breadcrumb */}
                <Breadcrumbs separator={IconChevronRight} navigation={navigation} icon title rightAlign />
                <div>{children}</div>
                {/* </Main> */}
            </main>
            {/* <Customization /> */}
            <ThemeDebug />
        </div>
    );
};

MainLayout.propTypes = {
    children: PropTypes.node
};

export default MainLayout;
