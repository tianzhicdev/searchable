import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container, useTheme } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';
import config from '../../config';
import { componentSpacing } from '../../utils/spacing';

const FAQ = () => {
    const classes = useComponentStyles();
    const theme = useTheme();

    return (
            <Paper elevation={1} sx={{ ...componentSpacing.card(theme), marginTop: '24px' }}>
                {/* Header */}
                <Box className={classes.header}>
                    <Typography variant="h2" gutterBottom>
                        FAQ
                    </Typography>
                </Box>
                <Divider />

                {/* Introduction Section */}
                <Typography variant="h4" className={classes.staticText}>
                    What is {config.BRANDING_CONFIG.domain}?
                </Typography>
                <Typography variant="body1" paragraph>
                    {config.BRANDING_CONFIG.domain} is a marketplace that facilitate the free exchange between money and information. 
                    We firmly believe that free trade is fundamental to human prosperity. In today's complex global landscape marked by political and economic challenges, we maintain that voluntary exchange between individuals represents a crucial pathway to economic growth and peaceful coexistence.
                    {config.BRANDING_CONFIG.domain} provides a secure platform for users to sell legal digital items and services using digital currency. We currently offer buyers traditional payments through US dollars using Stripe while offer sellers to receive payments in Tether (USDT).
                </Typography>

                <Divider className={classes.divider} />

                {/* Terms Section */}
                <Typography variant="h4" className={classes.staticText}>
                    How does it work?
                </Typography>
                <Typography variant="body1" paragraph>
                    Using our platform is simple: Register an account, post your item or service for sale, and when a buyer purchases it, you'll receive payment. We securely manage all transactions between buyers and sellers. Buyers pay using US dollars via Stripe, while sellers always receive payments in Tether (USDT.
                </Typography>
                
                <Divider className={classes.divider} />

                {/* Payment Section */}
                <Typography variant="h4" className={classes.staticText}>
                    How do I get paid?
                </Typography>
                <Typography variant="body1" className={classes.staticText}>
                    You can withdraw your funds by visiting your profile and clicking the "Withdraw" button. The system will prompt you to provide a Ethereum wallet address, which you can generate using any wallet that supports USDT. Withdrawals are processed immediately and typically complete within 10 seconds.
                </Typography>

                <Divider className={classes.divider} />

                {/* Privacy Section */}
                <Typography variant="h4" className={classes.staticText}>
                    Why should I use {config.BRANDING_CONFIG.domain}?
                </Typography>
                <Typography variant="body1" className={classes.staticText}>
                  We offer a seamless user experience with no KYC (Know Your Customer) requirements for registration, withdrawals, or purchases. Our platform is designed to be more efficient, user-friendly, and cost-effective compared to alternatives in the market. At {config.BRANDING_CONFIG.domain}, we are committed to upholding the principles of privacy and freedom for all our users.
                </Typography>
            </Paper>
    );
};

export default FAQ;
