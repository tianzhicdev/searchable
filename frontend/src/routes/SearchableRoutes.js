import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import NavMotion from '../layout/NavMotion';
import AuthGuard from './../utils/route-guard/AuthGuard';
import PublishSearchables from '../views/searchables/PublishSearchables';
import Profile from '../views/profile/Profile';

// // login routing
// const AuthLogin = Loadable(lazy(() => import('../views/pages/authentication/login')));
// const AuthRegister = Loadable(lazy(() => import('../views/pages/authentication/register')));

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/publish-searchables', '/profile']}>
            <Switch location={location} key={location.pathname}>
                {/* Protected routes that require authentication */}
                <AuthGuard>
                    <Route exact path="/publish-searchables" component={PublishSearchables} />
                    <Route exact path="/profile" component={Profile} />
                </AuthGuard>
                
                {/* Public routes accessible to unregistered visitors */}
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
