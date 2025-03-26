import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { useTheme } from '@material-ui/core';
import { Divider, Grid, Stack, Typography, useMediaQuery } from '@material-ui/core';

// project imports
import AuthWrapper1 from './../AuthWrapper1';
import Logo from './../../../../ui-component/Logo';
import AuthCardWrapper from './../AuthCardWrapper';
import RestLogin from './RestLogin';
import AuthFooter from './../../../../ui-component/cards/AuthFooter';
import useComponentStyles from '../../../../themes/componentStyles';

// assets

//================================|| LOGIN MAIN ||================================//

const Login = () => {
    const theme = useTheme();
    const classes = useComponentStyles();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

    return (
                <Grid item xs={12}>
                    <Grid container style={{ height: '100vh' }} alignItems="center" justifyContent="center">
                        <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
                            {/* <AuthCardWrapper className={classes.container}> */}
                                <Grid container spacing={2} alignItems="center" justifyContent="center">
                                    <Grid item sx={{ mb: 3 }}>
                                        <RouterLink to="#">
                                            <Logo />
                                        </RouterLink>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Grid
                                            container
                                            direction={matchDownSM ? 'column' : 'row'}
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <RestLogin />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Grid item container direction="column" alignItems="center" xs={12}>
                                            <Typography
                                                component={RouterLink}
                                                to="/register"
                                                variant="subtitle1"
                                                className={classes.textLink}
                                            >
                                                Don't have an account?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            {/* </AuthCardWrapper> */}
                        </Grid>
                    </Grid>
                </Grid>
    );
};

export default Login;
