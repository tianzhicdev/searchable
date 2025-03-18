import React, { lazy } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import Questions from '../views/questions/Questions';

// // project imports
import GuestGuard from '../utils/route-guard/GuestGuard';
import MinimalLayout from '../layout/MinimalLayout';
import NavMotion from '../layout/NavMotion';
import Searchables from '../views/searchables/Searchables';
// import Loadable from '../ui-component/Loadable';

// // login routing
// const AuthLogin = Loadable(lazy(() => import('../views/pages/authentication/login')));
// const AuthRegister = Loadable(lazy(() => import('../views/pages/authentication/register')));

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/searchables']}>
            {/* <MinimalLayout> */}
                <Switch location={location} key={location.pathname}>
                    <NavMotion>
                        {/* <GuestGuard> */}
                            <Route path="/searchables" component={Searchables} />
                        {/* </GuestGuard> */}
                    </NavMotion>
                </Switch>
            {/* </MinimalLayout> */}
        </Route>
    );
};

export default SearchableRoutes;
