import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { useTheme } from '@material-ui/core';
import { Grid, Typography, useMediaQuery } from '@material-ui/core';
import Logo from './../../../../ui-component/Logo';
import RestLogin from './RestLogin';
import useComponentStyles from '../../../../themes/componentStyles';

//================================|| LOGIN MAIN ||================================//

const Login = () => {
    const theme = useTheme();
    const classes = useComponentStyles();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

    return (
    <Grid container spacing={2} alignItems="center" justifyContent="center" flexDirection="column">
        <Grid item sx={{ mb: 6 }}></Grid>
        <Grid item sx={{ mb: 3 }}>
            <RouterLink to="#">
                <Logo />
            </RouterLink>
        </Grid>
        <Grid item xs={12} width={'60%'} maxWidth={'100%'}>
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
                    Don't have an account? test
                </Typography>
            </Grid>
        </Grid>
    </Grid>

    );
};

export default Login;
