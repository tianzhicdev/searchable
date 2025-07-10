import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Container
} from '@material-ui/core';
import { gradients, gradientText } from '../themes/gradients';

const CyberpunkDemo = () => {
    const theme = useTheme();

    return (
        <Box style={{ 
            minHeight: '100vh',
            background: gradients.dark,
            paddingTop: 40
        }}>
            <Container maxWidth="lg">
                {/* Hero Section */}
                <Box textAlign="center" mb={6}>
                    <Typography 
                        variant="h1" 
                        style={{
                            ...gradientText(gradients.neonPulse),
                            marginBottom: 20,
                            textShadow: `0 0 30px ${theme.palette.primary.main}`,
                        }}
                    >
                        CYBERPUNK 2077
                    </Typography>
                    <Typography 
                        variant="h4" 
                        style={{ 
                            color: theme.palette.secondary.main,
                            textShadow: `0 0 20px ${theme.palette.secondary.main}`,
                        }}
                    >
                        Welcome to the Digital Frontier
                    </Typography>
                </Box>

                {/* Neon Grid */}
                <Grid container spacing={3} style={{ marginBottom: 40 }}>
                    {['HACK', 'BREACH', 'DECODE', 'ENCRYPT'].map((text, index) => (
                        <Grid item xs={3} key={index}>
                            <Paper style={{
                                padding: 30,
                                textAlign: 'center',
                                background: gradients.dark,
                                animation: `pulse ${2 + index * 0.5}s infinite`,
                            }}>
                                <Typography 
                                    variant="h5"
                                    style={{
                                        color: index % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main,
                                        textShadow: `0 0 15px currentColor`,
                                    }}
                                >
                                    {text}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Action Buttons */}
                <Box textAlign="center" mb={4}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        style={{ 
                            marginRight: 20,
                            fontSize: 18,
                            padding: '15px 40px',
                        }}
                    >
                        JACK IN
                    </Button>
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        size="large"
                        style={{ 
                            fontSize: 18,
                            padding: '15px 40px',
                        }}
                    >
                        RUN PROTOCOL
                    </Button>
                </Box>

                {/* Data Stream */}
                <Paper style={{
                    padding: 40,
                    background: gradients.dark,
                }}>
                    <Typography variant="h6" style={{ 
                        color: theme.palette.success.main,
                        fontFamily: 'monospace',
                        marginBottom: 20,
                        textShadow: `0 0 10px ${theme.palette.success.main}`,
                    }}>
                        SYSTEM STATUS: ONLINE
                    </Typography>
                    <Box style={{ fontFamily: 'monospace' }}>
                        {[
                            'NEURAL INTERFACE: CONNECTED',
                            'CYBERWARE: ACTIVE',
                            'ICE BREAKER: LOADED',
                            'STEALTH MODE: ENGAGED'
                        ].map((status, i) => (
                            <Typography 
                                key={i}
                                style={{ 
                                    color: theme.palette.text.secondary,
                                    marginBottom: 10,
                                    opacity: 0.8 - (i * 0.1)
                                }}
                            >
                                &gt; {status}
                            </Typography>
                        ))}
                    </Box>
                </Paper>

                {/* CSS Animation */}
                <style>{`
                    @keyframes pulse {
                        0% { 
                            transform: scale(1);
                            box-shadow: 0 0 20px ${theme.palette.primary.main}40;
                        }
                        50% { 
                            transform: scale(1.05);
                            box-shadow: 0 0 40px ${theme.palette.secondary.main}60;
                        }
                        100% { 
                            transform: scale(1);
                            box-shadow: 0 0 20px ${theme.palette.primary.main}40;
                        }
                    }
                `}</style>
            </Container>
        </Box>
    );
};

export default CyberpunkDemo;