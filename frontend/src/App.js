import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline, StyledEngineProvider, Container, Box } from '@material-ui/core';
import config from './config';
// routing
import Routes from './routes';

// defaultTheme
import theme from './themes';

// project imports
import StateDebugger from './components/StateDebugger';
import Footer from './components/Footer';
import MockModeIndicator from './components/MockModeIndicator';
import FloatingBottomBar from './components/FloatingMenu/FloatingBottomBar';
import GuestUserBanner from './components/GuestUserBanner';
import './mocks/mockAuth'; // Setup mock auth if in mock mode
//-----------------------|| APP ||-----------------------//

const App = () => {
    const customization = useSelector((state) => state.customization);
    
    // Default theme to prevent undefined theme errors
    const defaultTheme = theme(customization || {});

    // Initialize Google Analytics based on branding
    useEffect(() => {
        const gaId = config.BRANDING_CONFIG.googleAnalyticsId;
        
        if (gaId) {
            // Create gtag script
            const gtagScript = document.createElement('script');
            gtagScript.async = true;
            gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(gtagScript);

            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', gaId);
        }
    }, []);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={defaultTheme}>
                <CssBaseline />
                {config.SHOW_DEBUG_INFO && <StateDebugger />}
                <MockModeIndicator />
                <GuestUserBanner />
                {/* <Box display="flex" justifyContent="center" width="100%"> */}
                    <Container id="outer-container" maxWidth="xl" style={{ 
                        margin: '0 auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        minHeight: '100vh',
                        position: 'relative'
                    }}>
                        <Box style={{ flex: 1, width: '100%', paddingBottom: '80px' }}>
                            <Routes />
                        </Box>
                        <Footer  />
                        <FloatingBottomBar />
                    </Container>
                {/* </Box> */}
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
