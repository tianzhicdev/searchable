import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';
import config from '../../config';

const FAQ = () => {
    const classes = useComponentStyles();

    return (
            <Paper elevation={1} sx={{ p: 3, marginTop: '24px' }}>
                {/* Header */}
                <Box className={classes.header}>
                    <Typography variant="h2" gutterBottom>
                        FAQ
                    </Typography>
                </Box>


                {/* Introduction Section */}
                <Typography variant="h4" className={classes.sectionTitle}>
                    What is {config.BRANDING_CONFIG.domain}?
                </Typography>
                <Typography variant="body1" paragraph>
                    {config.BRANDING_CONFIG.displayName} is a modern marketplace inspired by the principles of free trade that guided the original Silk Road platform. 
                    We firmly believe that free trade is fundamental to human prosperity. In today's complex global landscape marked by political and economic challenges, we maintain that voluntary exchange between individuals represents a crucial pathway to economic growth and peaceful coexistence.
                    {config.BRANDING_CONFIG.domain} provides a secure platform for users to sell legal items and services using Bitcoin on the Lightning Network. We offer buyers multiple payment options, including Bitcoin transactions via the Lightning Network or traditional payments through US dollars using Stripe.
                </Typography>

                <Divider className={classes.divider} />

                {/* Terms Section */}
                <Typography variant="h4" className={classes.sectionTitle}>
                    How does it work?
                </Typography>
                <Typography variant="body1" paragraph>
                    Using our platform is simple: Register an account, post your item or service for sale, and when a buyer purchases it, you'll receive payment. We securely manage all transactions between buyers and sellers. Buyers can pay using either Bitcoin through the Lightning Network or US dollars via Stripe, while sellers always receive Bitcoin payments on the Lightning Network. If a buyer pays in US dollars, our system automatically converts it to Bitcoin for the seller.
                </Typography>
                
                <Divider className={classes.divider} />

                {/* Privacy Section */}
                <Typography variant="h4" className={classes.itemTitle}>
                    How do I get paid?
                </Typography>
                <Typography variant="body1" className={classes.itemDescription}>
                    You can withdraw your funds by visiting your profile and clicking the "Withdraw" button. The system will prompt you to provide a Lightning Network invoice, which you can generate using services like CashApp, Strike, or any wallet that supports Lightning Network. Withdrawals are processed immediately and typically complete within 2 minutes.
                </Typography>

                <Divider className={classes.divider} />

                {/* Privacy Section */}
                <Typography variant="h4" className={classes.itemTitle}>
                    Why should I use {config.BRANDING_CONFIG.domain}?
                </Typography>
                <Typography variant="body1" className={classes.itemDescription}>
                  We offer a seamless user experience with no KYC (Know Your Customer) requirements for registration, withdrawals, or purchases. Our platform is designed to be more efficient, user-friendly, and cost-effective compared to alternatives in the market. At {config.BRANDING_CONFIG.domain}, we are committed to upholding the principles of privacy and freedom for all our users.
                </Typography>
            </Paper>
    );
};

export default FAQ;
