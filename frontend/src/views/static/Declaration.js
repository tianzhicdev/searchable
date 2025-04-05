import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';

// project imports
import useComponentStyles from '../../themes/componentStyles';

//==============================|| DECLARATION PAGE ||==============================//

const Declaration = () => {
    const classes = useComponentStyles();

    return (
            <Paper elevation={1} sx={{ p: 3, marginTop: '24px' }}>
                {/* Header */}
                <Box className={classes.header}>
                    <Typography variant="h2" gutterBottom>
                        Declaration
                    </Typography>
                </Box>

                {/* Introduction Section */}
                <Typography variant="h4" className={classes.sectionTitle}>
                    Introduction
                </Typography>
                <Typography variant="body1" paragraph>
                    This declaration outlines the terms, conditions, and policies that govern the use of our platform. 
                    By accessing or using our services, you acknowledge that you have read, understood, and agree to 
                    be bound by the terms described in this document.
                </Typography>

                <Divider className={classes.divider} />

                {/* Terms Section */}
                <Typography variant="h4" className={classes.sectionTitle}>
                    Terms and Conditions
                </Typography>
                <Typography variant="body1" paragraph>
                    All users must adhere to the following terms while using our platform. These terms are designed 
                    to ensure a fair and safe environment for all participants.
                </Typography>
                
                <Typography variant="h6" className={classes.itemTitle}>
                    User Responsibilities
                </Typography>
                <Typography variant="body2" className={classes.itemDescription}>
                    Users are responsible for maintaining the confidentiality of their account information and for all 
                    activities that occur under their account. Users agree to notify us immediately of any unauthorized 
                    use of their account or any other breach of security.
                </Typography>

                <Divider className={classes.divider} />

                {/* Privacy Section */}
                <Typography variant="h4" className={classes.sectionTitle}>
                    Privacy Policy
                </Typography>
                <Typography variant="body1" paragraph>
                    We respect your privacy and are committed to protecting your personal data. This privacy policy will 
                    inform you how we look after your personal data when you visit our platform and tell you about your 
                    privacy rights.
                </Typography>
                
                <Typography variant="h6" className={classes.itemTitle}>
                    Data Collection
                </Typography>
                <Typography variant="body2" className={classes.itemDescription}>
                    We collect information you provide directly to us when you create an account, update your profile, 
                    or communicate with us. We may also collect certain information automatically when you use our platform, 
                    including log data, device information, and cookies.
                </Typography>
            </Paper>
    );
};

export default Declaration;
