import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

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
                    What is bit-bid.com?
                </Typography>
                <Typography variant="body1" paragraph>
                    Bit-bid.com empowers users to sell any legal item or service online using Bitcoin on the Lightning Network. Buyers have flexible payment options, including Bitcoin on the Lightning Network or US dollars via Stripe.
                </Typography>

                <Divider className={classes.divider} />

                {/* Terms Section */}
                <Typography variant="h4" className={classes.sectionTitle}>
                    How does it work?
                </Typography>
                <Typography variant="body1" paragraph>
                    The process is straightforward: Create an account, list your item or service, wait for a buyer to make a purchase, and receive payment. Our platform handles the transaction securely between parties.
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
                    Why should I use bit-bid.com?
                </Typography>
                <Typography variant="body1" className={classes.itemDescription}>
                  We offer a seamless user experience with no KYC (Know Your Customer) requirements for registration, withdrawals, or purchases. Our platform is designed to be more efficient, user-friendly, and cost-effective compared to alternatives in the market. At bit-bid.com, we are committed to upholding the principles of privacy and freedom for all our users.
                </Typography>
            </Paper>
    );
};

export default FAQ;
