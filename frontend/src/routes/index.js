import React from 'react';
import { Redirect, Switch } from 'react-router-dom';

// routes
import LoginRoutes from './LoginRoutes';
import SearchableRoutes from './SearchableRoutes';
import VisitorRoutes from './VisitorRoutes';
// project imports
import config from './../config';

//-----------------------|| ROUTING RENDER ||-----------------------//

const Routes = () => {
    return (
        <Switch>
            <Redirect exact from="/" to={config.loginPath} />
            {/* <React.Fragment> */}
                <LoginRoutes />
                <SearchableRoutes />
                <VisitorRoutes />
        </Switch>
    );
};

export default Routes;
