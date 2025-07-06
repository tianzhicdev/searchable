import React from 'react';
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
import './mocks/mockAuth'; // Setup mock auth if in mock mode
//-----------------------|| APP ||-----------------------//

const App = () => {
    const customization = useSelector((state) => state.customization);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme(customization)}>
                <CssBaseline />
                {config.SHOW_DEBUG_INFO && <StateDebugger />}
                <MockModeIndicator />
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
                    </Container>
                {/* </Box> */}
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
