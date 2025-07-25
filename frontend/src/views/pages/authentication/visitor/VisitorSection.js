import React, { useState } from 'react';
import { Link as RouterLink, useHistory, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

// material-ui
import { useTheme } from '@material-ui/core';
import { 
    Grid, 
    Typography, 
    Button, 
    Card, 
    CardContent, 
    Box,
    useMediaQuery,
    CircularProgress
} from '@material-ui/core';

// project imports
import Logo from './../../../../ui-component/Logo';
import useComponentStyles from '../../../../themes/componentStyles';
import { ACCOUNT_INITIALIZE } from '../../../../store/actions';
import { generateGuestCredentials } from '../../../../utils/guestUtils';
import configData from '../../../../config';
import axios from 'axios';

//================================|| VISITOR SECTION ||================================//

const VisitorSection = () => {
    const theme = useTheme();
    const classes = useComponentStyles();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
    const history = useHistory();
    const location = useLocation();
    const dispatch = useDispatch();
    const [isCreatingGuest, setIsCreatingGuest] = useState(false);

    // Get the intended destination from location state or default to home
    const intendedDestination = location.state?.from || '/search';

    /**
     * Creates a guest account and redirects to the intended destination
     */
    const handleVisitAsGuest = async () => {
        setIsCreatingGuest(true);
        console.log('VisitorSection: Creating guest account');
        
        try {
            // Request a guest user creation with special email
            const registerResponse = await axios.post(configData.API_SERVER + 'users/register', {
                username: 'temp_guest',
                email: 'GUEST_REGISTRATION_REQUEST',
                password: 'temp_password'
            });
            
            if (registerResponse.data.success && registerResponse.data.userID) {
                // Now login the guest user with the generated credentials
                const guestId = registerResponse.data.userID;
                const loginResponse = await axios.post(configData.API_SERVER + 'users/login', {
                    email: `guest_${guestId}@ec.com`,
                    password: `guest_${guestId}`
                });
                
                if (loginResponse.data.success) {
                    console.log('VisitorSection: Guest account created and logged in successfully', {
                        guestId: guestId,
                        email: `guest_${guestId}@ec.com`,
                        redirectTo: intendedDestination
                    });
                    
                    // Clear the logout flag since user is now logged in
                    sessionStorage.removeItem('userLoggedOut');
                    
                    dispatch({
                        type: ACCOUNT_INITIALIZE,
                        payload: { 
                            isLoggedIn: true, 
                            user: loginResponse.data.user, 
                            token: loginResponse.data.token 
                        }
                    });

                    // Redirect to the intended destination
                    history.push(intendedDestination);
                } else {
                    console.error('VisitorSection: Failed to login guest user', loginResponse.data);
                    setIsCreatingGuest(false);
                }
            } else {
                console.error('VisitorSection: Failed to register guest user', registerResponse.data);
                setIsCreatingGuest(false);
            }
        } catch (error) {
            console.error('VisitorSection: Error creating guest account', error);
            setIsCreatingGuest(false);
        }
    };

    const handleLogin = () => {
        // Pass the intended destination to login page
        history.push('/login', { from: intendedDestination });
    };

    const handleRegister = () => {
        // Pass the intended destination to register page
        history.push('/register', { from: intendedDestination });
    };

    return (
        <Grid container spacing={2} alignItems="center" justifyContent="center" flexDirection="column" style={{ minHeight: '100vh', padding: '20px' }}>
            <Grid item sx={{ mb: 3 }}>
                <RouterLink to="/">
                    <Logo />
                </RouterLink>
            </Grid>
            
            <Grid item xs={12} style={{ maxWidth: '500px', width: '100%' }}>
                <Card elevation={3}>
                    <CardContent style={{ padding: '32px' }}>
                        <Box textAlign="center" mb={4}>
                            <Typography variant="body1" color="textSecondary">
                                Choose how you'd like to continue
                            </Typography>
                        </Box>

                        <Grid container spacing={2} direction="column">
                            <Grid item>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleVisitAsGuest}
                                >
                                    {isCreatingGuest ? (
                                        <>
                                            <CircularProgress size={20} color="inherit" style={{ marginRight: '8px' }} />
                                            Creating Guest Session...
                                        </>
                                    ) : (
                                        'VISIT AS GUEST'
                                    )}
                                </Button>
                            </Grid>

                            <Grid item>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleLogin}
                                >
                                    LOG IN
                                </Button>
                            </Grid>

                            <Grid item>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleRegister}

                                >
                                    REGISTER
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default VisitorSection;