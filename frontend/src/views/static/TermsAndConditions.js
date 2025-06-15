import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';
import useComponentStyles from '../../themes/componentStyles';

const TermsAndConditions = () => {
    const classes = useComponentStyles();

    return (
            <Paper elevation={1} sx={{ p: 3, marginTop: '24px' }}>
                {/* Header */}
                <Box className={classes.header}>
                    <Typography variant="h2" gutterBottom>
                        Terms and Conditions
                    </Typography>
                </Box>
                <Divider />


                {/* Introduction Section */}
                <Typography variant="body1" paragraph>
                    The user hereby acknowledges and expressly agrees that any and all activities, transactions, communications, and interactions conducted through or in connection with this platform are undertaken at the user's sole risk and discretion. The proprietors, operators, administrators, and affiliated parties of this digital platform (hereinafter referred to as "the Site") explicitly disclaim any and all liability, responsibility, or obligation for any financial, material, emotional, or other losses, damages, or detriments that may be incurred by the user. It is hereby established that the Site functions exclusively as an intermediary facilitating the exchange of information between parties, and does not assume any fiduciary duty or responsibility for the content, accuracy, or consequences of said information exchange. All transactions processed or initiated through this platform are deemed final and irrevocable upon completion, with no possibility of reversal, refund, or remediation by the Site under any circumstances whatsoever. The user bears complete and absolute responsibility for all consequences, intended or unintended, arising from their actions, decisions, and conduct while utilizing this platform, and hereby indemnifies and holds harmless the Site from any claims to the contrary.
                </Typography>

            </Paper>
    );
};

export default TermsAndConditions;
