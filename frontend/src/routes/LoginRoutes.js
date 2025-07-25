import React, { lazy } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

// project imports
import GuestGuard from './../utils/route-guard/GuestGuard';
import NavMotion from './../layout/NavMotion';
import Loadable from '../ui-component/Loadable';

// login routing
const AuthLogin = Loadable(lazy(() => import('../views/pages/authentication/login')));
const AuthRegister = Loadable(lazy(() => import('../views/pages/authentication/register')));
const VisitorSection = Loadable(lazy(() => import('../views/pages/authentication/visitor/VisitorSection')));

//-----------------------|| AUTH ROUTING ||-----------------------//

const LoginRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/login', '/register', '/visitor']}>
                <Switch location={location} key={location.pathname}>
                        <GuestGuard>
                            <Route path="/login" component={AuthLogin} />
                            <Route path="/register" component={AuthRegister} />
                        </GuestGuard>
                        <Route path="/visitor" component={VisitorSection} />
                </Switch>
        </Route>
    );
};

export default LoginRoutes;
