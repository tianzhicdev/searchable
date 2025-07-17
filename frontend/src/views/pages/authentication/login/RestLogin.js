import React, { useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { TextField } from '@material-ui/core';

// material-ui
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

// project imports
import useScriptRef from '../../../../hooks/useScriptRef';
import { performLogin } from '../../../../services/authService';
import { componentSpacing, touchTargets } from '../../../../utils/spacing';

// assets
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

//============================|| API JWT - LOGIN ||============================//

const useStyles = makeStyles((theme) => ({
    formContainer: componentSpacing.formContainer(theme),
    button: componentSpacing.button(theme)
}));

const RestLogin = (props, { ...others }) => {
    const classes = useStyles();
    const dispatcher = useDispatch();
    const history = useHistory();
    const location = useLocation();

    const scriptedRef = useScriptRef();
    const [checked, setChecked] = useState(true);
    const [formValues, setFormValues] = useState({
        email: '',
        password: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
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
        setFormValues(prev => ({ ...prev, [name]: value }));
        
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
        setTouched({ email: true, password: true });
        
        if (Object.keys(errors).length > 0) {
            setIsSubmitting(false);
            return;
        }
        
        try {
            await performLogin(dispatcher, formValues.email, formValues.password);
            
            console.log("Login successful");
            
            // Redirect to intended destination
            const intendedDestination = location.state?.from || '/';
            console.log('Login: Redirecting to', intendedDestination);
            history.push(intendedDestination);
            
            if (scriptedRef.current) {
                setIsSubmitting(false);
            }
        } catch (error) {
            // Set specific field errors based on errorType
            if (error.errorType === 'invalid_email') {
                setFormErrors(prev => ({ ...prev, email: error.message }));
                setTouched(prev => ({ ...prev, email: true }));
                setSubmitError(''); // Clear general error when showing field-specific error
            } else if (error.errorType === 'invalid_password') {
                setFormErrors(prev => ({ ...prev, password: error.message }));
                setTouched(prev => ({ ...prev, password: true }));
                setSubmitError(''); // Clear general error when showing field-specific error
            } else {
                // For other errors, show general error message
                setSubmitError(error.message || 'Login failed');
            }
            
            setIsSubmitting(false);
        }
    };

    return (
        <form noValidate onSubmit={handleSubmit} className={classes.formContainer} {...others}>
            <FormControl 
                fullWidth 
                error={Boolean(touched.email && formErrors.email)}
            >
                <TextField
                    id="login-input-email"
                    data-testid="login-input-email"
                    type="email"
                    value={formValues.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    error={touched.email && Boolean(formErrors.email)}
                    InputProps={{
                        style: { minHeight: touchTargets.input.mobileHeight }
                    }}
                />
                {touched.email && formErrors.email && (
                    <FormHelperText error id="standard-weight-helper-text-email-login">
                        {formErrors.email}
                    </FormHelperText>
                )}
            </FormControl>

            <FormControl 
                fullWidth 
                error={Boolean(touched.password && formErrors.password)}
            >
                <TextField
                    id="login-input-password"
                    data-testid="login-input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formValues.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    error={touched.password && Boolean(formErrors.password)}
                    InputProps={{
                        style: { minHeight: touchTargets.input.mobileHeight },
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    id="login-button-toggle-password"
                                    data-testid="login-button-toggle-password"
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
                    <FormHelperText error id="standard-weight-helper-text-password-login">
                        {formErrors.password}
                    </FormHelperText>
                )}
            </FormControl>
            {submitError && (
                <Box>
                    <FormHelperText error>{submitError}</FormHelperText>
                </Box>
            )}

            <Box display="flex" justifyContent="space-between">
                <Box></Box>
                <Button
                    id="login-button-submit"
                    data-testid="login-button-submit"
                    variant="contained"
                    disabled={isSubmitting}
                    fullWidth
                    type="submit"
                    className={classes.button}
                >
                    Sign In
                </Button>
            </Box>
        </form>
    );
};

export default RestLogin;
