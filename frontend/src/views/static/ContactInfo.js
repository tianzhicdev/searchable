import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

const ContactInfo = () => {
    const classes = useComponentStyles();

    return (
            <Paper elevation={1} sx={{ p: 3, marginTop: '24px' }}>
                {/* Header */}
                <Box className={classes.header}>
                    <Typography variant="h2" gutterBottom>
                        Contact Information
                    </Typography>
                </Box>


                {/* Introduction Section */}
                <Typography variant="body1" paragraph>
                    If you have any questions or concerns, please contact us at:
                </Typography>
                <Typography variant="body1" paragraph>
                    Email: admin@bit-bid.com
                </Typography>
                <Typography variant="body1" paragraph>
                    Phone: +1 (412) 961-4793
                </Typography>

            </Paper>
    );
};

export default ContactInfo;
