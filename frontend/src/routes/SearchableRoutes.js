import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import NavMotion from '../layout/NavMotion';
import AuthGuard from './../utils/route-guard/AuthGuard';
import PublishDownloadableSearchable from '../views/searchables/PublishDownloadableSearchable';
import Profile from '../views/profile/Profile';
import PurchaseRatings from '../views/ratings/PurchaseRatings';

// // login routing
// const AuthLogin = Loadable(lazy(() => import('../views/pages/authentication/login')));
// const AuthRegister = Loadable(lazy(() => import('../views/pages/authentication/register')));

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/publish-searchables', '/profile', '/my-purchases']}>
            <Switch location={location} key={location.pathname}>
                {/* Protected routes that require authentication */}
                <AuthGuard>
                    <Route exact path="/publish-searchables" component={PublishDownloadableSearchable} />
                    <Route exact path="/profile" component={Profile} />
                    <Route exact path="/my-purchases" component={PurchaseRatings} />
                </AuthGuard>
                
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
