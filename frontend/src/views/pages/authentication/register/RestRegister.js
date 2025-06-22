import React, { useEffect, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

import configData from '../../../../config';

// material-ui
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@material-ui/core';

// third party
import axios from 'axios';

// project imports
import useScriptRef from '../../../../hooks/useScriptRef';
import { strengthColor, strengthIndicator } from '../../../../utils/password-strength';

// assets
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

//===========================|| API JWT - REGISTER ||===========================//

const RestRegister = ({ ...others }) => {
    let history = useHistory();
    const location = useLocation();
    const scriptedRef = useScriptRef();
    const [showPassword, setShowPassword] = useState(false);
    const [checked, setChecked] = useState(true);
    const [formValues, setFormValues] = useState({
        username: '',
        email: '',
        password: '',
        invite_code: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [strength, setStrength] = useState(0);
    const [level, setLevel] = useState('');
    const [inviteCodeValid, setInviteCodeValid] = useState(null); // null, true, or false
    const [checkingInviteCode, setCheckingInviteCode] = useState(false);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const changePassword = (value) => {
        const temp = strengthIndicator(value);
        setStrength(temp);
        setLevel(strengthColor(temp));
    };

    const checkInviteCode = async (code) => {
        if (!code || code.length !== 6) {
            setInviteCodeValid(null);
            return;
        }
        
        setCheckingInviteCode(true);
        try {
            const response = await axios.get(configData.API_SERVER + `v1/is_active/${code.toUpperCase()}`);
            setInviteCodeValid(response.data.active);
        } catch (error) {
            console.error('Error checking invite code:', error);
            setInviteCodeValid(false);
        } finally {
            setCheckingInviteCode(false);
        }
    };

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'email':
                if (!value) {
                    error = 'Email is required';
                } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                    error = 'Must be a valid email';
                }
                break;
            case 'username':
                if (!value) {
                    error = 'Username is required';
                }
                break;
            case 'password':
                if (!value) {
                    error = 'Password is required';
                }
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        
        // For invite code, convert to uppercase and limit to 6 chars
        let processedValue = value;
        if (name === 'invite_code') {
            processedValue = value.toUpperCase().slice(0, 6);
        }
        
        setFormValues(prev => ({ ...prev, [name]: processedValue }));
        
        if (name === 'password') {
            changePassword(value);
        }
        
        if (name === 'invite_code' && processedValue.length === 6) {
            checkInviteCode(processedValue);
        } else if (name === 'invite_code') {
            setInviteCodeValid(null);
        }
        
        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError('');
        
        // Validate all fields
        const errors = {};
        Object.keys(formValues).forEach(key => {
            const error = validateField(key, formValues[key]);
            if (error) errors[key] = error;
        });
        
        setFormErrors(errors);
        setTouched({ username: true, email: true, password: true });
        
        if (Object.keys(errors).length > 0) {
            setIsSubmitting(false);
            return;
        }
        
        try {
            const response = await axios.post(configData.API_SERVER + 'users/register', {
                username: formValues.username,
                password: formValues.password,
                email: formValues.email,
                invite_code: formValues.invite_code
            });
            
            if (response.data.success) {
                // Clear the logout flag in case it was set
                sessionStorage.removeItem('userLoggedOut');
                
                // Pass the intended destination to login page
                const intendedDestination = location.state?.from || '/';
                history.push('/login', { from: intendedDestination });
            } else {
                setSubmitError(response.data.msg);
                setIsSubmitting(false);
            }
        } catch (error) {
            setSubmitError(error.response?.data?.msg || error.message);
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // Initialize password strength to 0 for empty password
        changePassword('');
    }, []);

    return (
        <form noValidate onSubmit={handleSubmit} {...others}>
                        
            <FormControl 
                fullWidth 
                error={Boolean(touched.email && formErrors.email)}
                sx={{ mb: 2 }}
            >
                <TextField
                    id="outlined-adornment-email-register"
                    type="email"
                    value={formValues.email}
                    name="email"
                    placeholder="Enter your email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    error={touched.email && Boolean(formErrors.email)}
                />
                {touched.email && formErrors.email && (
                    <FormHelperText error id="standard-weight-helper-text--register">
                        {formErrors.email}
                    </FormHelperText>
                )}
            </FormControl>
            <FormControl 
                fullWidth 
                error={Boolean(touched.username && formErrors.username)}
                sx={{ mb: 2 }}
            >
                <TextField
                    name="username"
                    id="username"
                    type="text"
                    value={formValues.username}
                    onBlur={handleBlur}
                    placeholder="Enter your username"
                    onChange={handleChange}
                    error={touched.username && Boolean(formErrors.username)}
                />
                {touched.username && formErrors.username && (
                    <FormHelperText error id="standard-weight-helper-text--register">
                        {formErrors.username}
                    </FormHelperText>
                )}
            </FormControl>
            
            <FormControl 
                fullWidth 
                sx={{ mb: 2 }}
            >
                <TextField
                    name="invite_code"
                    id="invite_code"
                    type="text"
                    value={formValues.invite_code}
                    onBlur={handleBlur}
                    placeholder="Invite Code (optional)"
                    onChange={handleChange}
                    inputProps={{ maxLength: 6 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                {checkingInviteCode && <CircularProgress size={20} />}
                                {!checkingInviteCode && inviteCodeValid === true && (
                                    <Typography variant="body2" color="success.main">✓ Valid</Typography>
                                )}
                                {!checkingInviteCode && inviteCodeValid === false && (
                                    <Typography variant="body2" color="error">✗ Invalid</Typography>
                                )}
                            </InputAdornment>
                        )
                    }}
                />
                <FormHelperText>
                    {formValues.invite_code.length === 0 && "Enter a 6-letter invite code for a $5 reward"}
                    {formValues.invite_code.length > 0 && formValues.invite_code.length < 6 && 
                        `${6 - formValues.invite_code.length} more letters needed`}
                    {inviteCodeValid === true && "You'll receive $5 after registration!"}
                </FormHelperText>
            </FormControl>
            
            <FormControl fullWidth error={Boolean(touched.password && formErrors.password)}>
                <TextField
                    id="outlined-adornment-password-register"
                    type={showPassword ? 'text' : 'password'}
                    value={formValues.password}
                    name="password"
                    placeholder="Enter your password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    error={touched.password && Boolean(formErrors.password)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                >
                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
                {touched.password && formErrors.password && (
                    <FormHelperText error id="standard-weight-helper-text-password-register">
                        {formErrors.password}
                    </FormHelperText>
                )}
            </FormControl>

            {strength !== 0 && (
                <FormControl fullWidth>
                    <Box>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item>
                                <Box
                                    backgroundColor={level.color}
                                    sx={{
                                        width: 85,
                                        height: 8,
                                        borderRadius: '7px'
                                    }}
                                ></Box>
                            </Grid>
                            <Grid item>
                                <Typography variant="subtitle1" fontSize="0.75rem">
                                    {level.label}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </FormControl>
            )}

            <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={checked}
                                onChange={(event) => setChecked(event.target.checked)}
                                name="checked"
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="subtitle1" component={Link} to="/terms-and-conditions">
                                Agree with Terms & Condition.
                            </Typography>
                        }   
                    />
                </Grid>
            </Grid>
            {submitError && (
                <Box>
                    <FormHelperText error>{submitError}</FormHelperText>
                </Box>
            )}

            {strength > 0 && strength <= 2 && formValues.password && (
                <Box mb={2}>
                    <FormHelperText>
                        Use a stronger password. It should be at least 8 characters long and include a mix of letters, numbers, and special characters.
                    </FormHelperText>
                </Box>
            )}

            <Box>
                <Button
                    disabled={isSubmitting || strength <= 2}
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                >
                    Sign Up
                </Button>
            </Box>
        </form>
    );
};

export default RestRegister;
