import React from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline, StyledEngineProvider } from '@material-ui/core';
import config from './config';
// routing
import Routes from './routes';

// defaultTheme
import theme from './themes';

// project imports
import StateDebugger from './components/StateDebugger';
import Terminal from './views/utilities/Terminal';
//-----------------------|| APP ||-----------------------//

const App = () => {
    const customization = useSelector((state) => state.customization);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme(customization)}>
                <CssBaseline />
                {config.SHOW_DEBUG_INFO && <StateDebugger />}
                    <Terminal />
                    <Routes />
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
