import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import NavMotion from '../layout/NavMotion';
import Searchables from '../views/searchables/Searchables';
import AuthGuard from './../utils/route-guard/AuthGuard';
import PublishSearchables from '../views/publish-searchables/PublishSearchables';
import TestComponent from '../views/publish-searchables/TestComponent';
import Profile from '../views/profile/Profile';
import SearchableItem from '../views/searchable-item/SearchableItem';
import MainLayout from '../layout/MainLayout';
// // project imports
// import GuestGuard from '../utils/route-guard/GuestGuard';
// import MinimalLayout from '../layout/MinimalLayout';

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
                        <Route exact path="/test-component" component={TestComponent} />
                        <Route exact path="/searchable-item/:id" component={SearchableItem} />
                </AuthGuard>
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
