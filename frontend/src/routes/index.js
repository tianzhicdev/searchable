import React from 'react';
import { Redirect, Switch } from 'react-router-dom';

// routes
import MainRoutes from './MainRoutes';
import LoginRoutes from './LoginRoutes';
import AuthenticationRoutes from './AuthenticationRoutes';
import SearchableRoutes from './SearchableRoutes';
import VisitorRoutes from './VisitorRoutes';
// project imports
import config from './../config';

//-----------------------|| ROUTING RENDER ||-----------------------//

const Routes = () => {
    return (
        <Switch>
            <Redirect exact from="/" to={config.defaultPath} />
            <React.Fragment>
                <LoginRoutes />
                <SearchableRoutes />
                <VisitorRoutes />
                <MainRoutes />
            </React.Fragment>
        </Switch>
    );
};

export default Routes;
