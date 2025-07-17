import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { makeStyles } from '@material-ui/styles';
import { Avatar, Box, ButtonBase } from '@material-ui/core';

// project imports
import LogoSection from '../LogoSection';
import SearchSection from './SearchSection';
import ProfileSection from './ProfileSection';
import NotificationSection from './NotificationSection';
import { testIds } from '../../../utils/testIds';

// assets
import { IconMenu2 } from '@tabler/icons';

// Import spacing utilities
import { touchTargets, spacing } from '../../../utils/spacing';

// style constant
const useStyles = makeStyles((theme) => ({
    grow: {
        flexGrow: 1
    },
    headerAvatar: {
        ...theme.typography.commonAvatar,
        ...theme.typography.mediumAvatar,
        transition: 'all .2s ease-in-out',
        background: theme.palette.secondary.light,
        color: theme.palette.secondary.dark,
        // Ensure touch-friendly size on mobile
        width: touchTargets.minWidth,
        height: touchTargets.minHeight,
        [theme.breakpoints.up('md')]: {
            width: theme.spacing(4.5), // 36px on desktop
            height: theme.spacing(4.5)
        },
        '&:hover': {
            background: theme.palette.secondary.dark,
            color: theme.palette.secondary.light
        }
    },
    boxContainer: {
        width: '228px',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(spacing.element.md), // 16px gap
        [theme.breakpoints.down('md')]: {
            width: 'auto',
            gap: theme.spacing(spacing.element.xs) // 12px gap on mobile
        }
    }
}));

//-----------------------|| MAIN NAVBAR / HEADER ||-----------------------//

const Header = ({ handleLeftDrawerToggle }) => {
    const classes = useStyles();

    return (
        <React.Fragment>
            {/* logo & toggler button */}
            <div className={classes.boxContainer} data-testid={testIds.nav.menu('header-container')}>
                <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
                    <LogoSection />
                </Box>
                <ButtonBase 
                    sx={{ borderRadius: '12px', overflow: 'hidden' }}
                    data-testid={testIds.button.nav('menu-toggle')}
                >
                    <Avatar 
                        variant="rounded" 
                        className={classes.headerAvatar} 
                        onClick={handleLeftDrawerToggle} 
                        color="inherit"
                        data-testid="avatar-menu-toggle"
                    >
                        <IconMenu2 stroke={1.5} size="1.3rem" />
                    </Avatar>
                </ButtonBase>
            </div>

            {/* header search */}
            <SearchSection theme="light" />
            <div className={classes.grow} />
            <div className={classes.grow} />

            {/* notification & profile */}
            <NotificationSection />
            <ProfileSection />
        </React.Fragment>
    );
};

Header.propTypes = {
    handleLeftDrawerToggle: PropTypes.func
};

export default Header;
