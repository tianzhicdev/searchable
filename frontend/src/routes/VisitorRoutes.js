import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import Declaration from '../views/static/Declaration';
import FAQ from '../views/static/FAQ';
import TermsAndConditions from '../views/static/TermsAndConditions';
import ContactInfo from '../views/static/ContactInfo';
import GettingStarted from '../views/static/GettingStarted';
import Invite from '../views/Invite';
//-----------------------|| VISITOR ROUTING ||-----------------------//
import VisitorSection from '../views/pages/authentication/visitor/VisitorSection';

const VisitorRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/declaration', '/faq', '/terms-and-conditions', '/contact-info', '/getting-started', '/visitor', '/invite']}>
            <Switch location={location} key={location.pathname}>
                {/* Public routes accessible to unregistered visitors */}
                <Route exact path="/declaration" component={Declaration} />
                <Route exact path="/faq" component={FAQ} />
                <Route exact path="/terms-and-conditions" component={TermsAndConditions} />
                <Route exact path="/contact-info" component={ContactInfo} />
                <Route exact path="/getting-started" component={GettingStarted} />
                <Route exact path="/visitor" component={VisitorSection} />
                <Route exact path="/invite" component={Invite} />
            </Switch>
        </Route>
    );
};

export default VisitorRoutes; 