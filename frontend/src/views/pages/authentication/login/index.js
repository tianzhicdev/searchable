import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { useTheme } from '@material-ui/core';
import { Grid, Typography, useMediaQuery } from '@material-ui/core';
import Logo from './../../../../ui-component/Logo';
import RestLogin from './RestLogin';
import useComponentStyles from '../../../../themes/componentStyles';
import { testIdProps } from '../../../../utils/testIds';

//================================|| LOGIN MAIN ||================================//

const Login = () => {
    const theme = useTheme();
    const classes = useComponentStyles();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));

    return (
    <Grid container spacing={2} alignItems="center" justifyContent="center" flexDirection="column" {...testIdProps('page', 'login', 'container')}>
        <Grid item sx={{ mb: 2 }}></Grid>
        <Grid item sx={{ mb: 3 }} {...testIdProps('section', 'login', 'logo')}>
            <RouterLink to="#" {...testIdProps('link', 'login', 'logo-link')}>
                <Logo />
            </RouterLink>
        </Grid>
        <Grid item xs={12} width={'60%'} maxWidth={'100%'} {...testIdProps('section', 'login', 'form')}>
            <RestLogin />
        </Grid>
        <Grid item xs={12} {...testIdProps('section', 'login', 'register-link')}>
            <Grid item container direction="column" alignItems="center" xs={12}>
                <Typography
                    component={RouterLink}
                    to="/register"
                    variant="subtitle1"
                    className={classes.textLink}
                    {...testIdProps('link', 'login', 'register')}
                >
                    Don't have an account?
                </Typography>
            </Grid>
        </Grid>
    </Grid>

    );
};

export default Login;
