import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { useTheme } from '@material-ui/core';
import { Divider, Grid, Stack, Typography, useMediaQuery } from '@material-ui/core';

// project imports
import AuthWrapper1 from './../AuthWrapper1';
import AuthCardWrapper from './../AuthCardWrapper';
import Logo from './../../../../ui-component/Logo';
import RestRegister from './RestRegister';
import AuthFooter from './../../../../ui-component/cards/AuthFooter';
import useComponentStyles from '../../../../themes/componentStyles';

// assets

//===============================|| AUTH3 - REGISTER ||===============================//

const Register = () => {
    const theme = useTheme();
    const classes = useComponentStyles();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Grid spacing={2} alignItems="center" justifyContent="center" flexDirection="column">
            <Grid item sx={{ mb: 2 }}></Grid>
            <Grid item sx={{ mb: 3 }}>
                <RouterLink to="#">
                    <Logo />
                </RouterLink>
            </Grid>
            <Grid item xs={12} width={'60%'} maxWidth={'100%'}>
                <RestRegister />
            </Grid>
            <Grid item xs={12}>
                <Grid item container direction="column" alignItems="center" xs={12}>
                    <Typography
                        component={RouterLink}
                        to="/login"
                        variant="subtitle1"
                        className={classes.textLink}
                    >
                        Login with an account?
                    </Typography>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Register;
