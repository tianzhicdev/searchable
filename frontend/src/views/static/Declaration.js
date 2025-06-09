import React from 'react';

// material-ui
import { Typography, Paper, Box, Divider, Container } from '@material-ui/core';

// project imports
import useComponentStyles from '../../themes/componentStyles';
import config from '../../config';

//==============================|| ABOUT US PAGE ||==============================//

const Declaration = () => {
    const classes = useComponentStyles();

    return (
            <Paper elevation={1} sx={{ p: 3, marginTop: '24px' }}>
                {/* Header */}
                <Box className={classes.header}>
                    <Typography variant="h2" gutterBottom>
                        About Us
                    </Typography>
                </Box>

                {/* Introduction Section */}
                <Typography variant="h4" className={classes.staticText}>
                    Our Mission
                </Typography>
                <Typography variant="body1" paragraph>
                    {config.BRANDING_CONFIG.domain} is a marketplace that leverages the Lightning Network to provide 
                    fast, secure, and low-cost transactions for our users. We aim to create a platform where 
                    individuals and businesses can buy and sell goods and services with ease and confidence.
                </Typography>

                <Divider className={classes.divider} />

                {/* Vision Section */}
                <Typography variant="h4" className={classes.staticText}>
                    Our Vision
                </Typography>
                <Typography variant="body1" paragraph>
                    We envision a world where commerce is accessible to everyone, regardless of location or 
                    background. By utilizing Bitcoin's Lightning Network, we're building a marketplace that 
                    is global, efficient, and user-friendly.
                </Typography>
                
                <Typography variant="h4" className={classes.staticText}>
                    Core Values
                </Typography>
                <Typography variant="body1" paragraph>
                    Our platform is built on the principles of transparency, security, and user empowerment. 
                    We believe in providing a service that respects your privacy while offering the tools you 
                    need to succeed in the digital marketplace.
                </Typography>

                <Divider className={classes.divider} />

                {/* Team Section */}
                <Typography variant="h4" className={classes.staticText}>
                    Our Team
                </Typography>
                <Typography variant="body1" paragraph>
                    We are a dedicated group of professionals passionate about Bitcoin, the Lightning Network, 
                    and creating innovative solutions for e-commerce. Our team combines expertise in blockchain 
                    technology, web development, and user experience design.
                </Typography>
                
                <Typography variant="h4" className={classes.staticText}>
                    Join Our Community
                </Typography>
                <Typography variant="body1" paragraph>
                    We're building more than just a marketplace - we're creating a community of forward-thinking 
                    individuals who believe in the power of decentralized commerce. Whether you're a buyer, seller, 
                    or Bitcoin enthusiast, we welcome you to be part of our journey.
                </Typography>
            </Paper>
    );
};

export default Declaration;
