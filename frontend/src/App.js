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
import NavigationScroll from './layout/NavigationScroll';
import StateDebugger from './components/StateDebugger';

//-----------------------|| APP ||-----------------------//

const App = () => {
    const customization = useSelector((state) => state.customization);

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme(customization)}>
                <CssBaseline />
                {config.SHOW_DEBUG_INFO && <StateDebugger />}
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
