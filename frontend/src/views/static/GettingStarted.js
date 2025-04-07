import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

const GettingStarted = () => {
    const classes = useComponentStyles();

    return (
            <Paper elevation={1} sx={{ p: 3, marginTop: '24px' }}>
                {/* Header */}

                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <img src={require('../../assets/images/camel_logo.gif')} alt="Getting Started" style={{ maxWidth: '100%', height: 'auto' }} />
                </Box>
                <Box className={classes.header} textAlign="center">
                    <Typography variant="h2" gutterBottom>
                        Getting Started
                    </Typography>
                </Box>

                {/* Introduction Section */}
                <Typography variant="h4" className={classes.sectionTitle}>
                    How do I sell on silkroadonlightning.com?
                </Typography>

                <Typography variant="body1" paragraph>
                    After you have registered an account, you can start selling your items or services by clicking the "+" button on the top right of the screen.
                </Typography>

                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <img 
                        src={require('../../assets/images/how_to_publish.jpg')} 
                        alt="How to publish" 
                        style={{ maxWidth: '100%', height: 'auto' }} 
                    />
                </Box>
                <Typography variant="body1" paragraph>
                  After clicking the "+" button, you will be directed to a page where you can categorize your listing by business type. You may choose from three options:
                  <ul>
                    <li>Personal</li>
                    <li>Online Business</li>
                    <li>Local Business</li>
                  </ul>
                </Typography>

                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <img 
                        src={require('../../assets/images/business_type.jpg')} 
                        alt="How to publish" 
                        style={{ maxWidth: '100%', height: 'auto' }} 
                    />
                </Box>
                <Box sx={{ height: '20px' }} />

                <Typography variant="body1" paragraph>
                  For "Personal" or "Local Business" listings, you have the option to specify your location. Customers purchasing from these categories will not need to create an account to complete their transaction.
                  For "Online Business" listings, location information is not required. However, customers will need to register an account and provide their shipping address to complete their purchase.
                </Typography>
                <Typography variant="h4" className={classes.itemTitle}>
                    How do I get paid?
                </Typography>

                <Typography variant="body1" paragraph>
                    You can withdraw your funds by visiting your profile and clicking the "Withdraw" button.
                </Typography>

                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <img 
                        src={require('../../assets/images/withdraw_button.png')} 
                        alt="withdraw button" 
                        style={{ maxWidth: '100%', height: 'auto' }} 
                    />
                </Box>

                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                    <img 
                        src={require('../../assets/images/withdraw_invoice.png')} 
                        alt="withdraw invoice" 
                        style={{ maxWidth: '100%', height: 'auto' }} 
                    />
                </Box>
                <Typography variant="body1" className={classes.itemDescription}>
                    You can withdraw your funds by visiting your profile and clicking the "Withdraw" button. The system will prompt you to provide a Lightning Network invoice, which you can generate using services like CashApp, Strike, or any wallet that supports Lightning Network. Withdrawals are processed immediately and typically complete immediately.
                </Typography>

            </Paper>
    );
};

export default GettingStarted;
