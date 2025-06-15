import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';
// project imports
import config from '../../config';

const ContactInfo = () => {
    const classes = useComponentStyles();

    return (
            <Paper elevation={1} sx={{ p: 3, marginTop: '24px' }}>
                {/* Header */}
                <Box>
                    <Typography variant="h2" gutterBottom>
                        Contact Information
                    </Typography>
                </Box>
                <Divider />


                {/* Introduction Section */}
                <Typography variant="body1" paragraph>
                    If you have any questions or concerns, please contact us at:
                </Typography>
                <Typography variant="body1" paragraph>
                    Email: admin@{config.BRANDING_CONFIG.domain}
                </Typography>

            </Paper>
    );
};

export default ContactInfo;
