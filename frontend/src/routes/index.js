import React, { useEffect, useState } from 'react';
import { Redirect, Switch, Route, useHistory } from 'react-router-dom';

// routes
import LoginRoutes from './LoginRoutes';
import SearchableRoutes from './SearchableRoutes';
import VisitorRoutes from './VisitorRoutes';
// project imports
import config from './../config';
import SubdomainRedirect from '../components/SubdomainRedirect';

//-----------------------|| ROUTING RENDER ||-----------------------//

const Routes = () => {
    const [isSubdomain, setIsSubdomain] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Check if we're on a subdomain
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        // Check if we have a subdomain (more than 2 parts)
        // e.g., test10.eccentricprotocol.com = ['test10', 'eccentricprotocol', 'com']
        if (parts.length >= 3) {
            const subdomain = parts[0];
            const skipSubdomains = ['www', 'api', 'admin', 'app', 'staging', 'dev'];

            if (!skipSubdomains.includes(subdomain)) {
                setIsSubdomain(true);
            }
        }
        setChecking(false);
    }, []);

    // Show subdomain redirect if we detected a subdomain
    if (checking) {
        return null; // or a loader
    }

    if (isSubdomain) {
        return (
            <Switch>
                <Route exact path="/" component={SubdomainRedirect} />
                <React.Fragment>
                    <LoginRoutes />
                    <SearchableRoutes />
                    <VisitorRoutes />
                </React.Fragment>
            </Switch>
        );
    }

    return (
        <Switch>
            <Redirect exact from="/" to={config.defaultPath} />
            <React.Fragment>
                <LoginRoutes />
                <SearchableRoutes />
                <VisitorRoutes />
            </React.Fragment>
        </Switch>
    );
};

export default Routes;
