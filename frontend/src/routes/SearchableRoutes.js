import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import NavMotion from '../layout/NavMotion';
import Searchables from '../views/searchables/Searchables';
import AuthGuard from './../utils/route-guard/AuthGuard';
import PublishSearchables from '../views/publish-searchables/PublishSearchables';
import Profile from '../views/profile/Profile';
import SearchableDetails from '../views/searchable-details/SearchableDetails';

// // login routing
// const AuthLogin = Loadable(lazy(() => import('../views/pages/authentication/login')));
// const AuthRegister = Loadable(lazy(() => import('../views/pages/authentication/register')));

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/searchables', '/publish-searchables', '/profile', '/test-component', '/searchable-item/:id']}>
            <Switch location={location} key={location.pathname}>
                <AuthGuard>
                        <Route exact path="/searchables" component={Searchables} />
                        <Route exact path="/publish-searchables" component={PublishSearchables} />
                        <Route exact path="/profile" component={Profile} />
                        <Route exact path="/searchable-item/:id" component={SearchableDetails} />
                </AuthGuard>
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
