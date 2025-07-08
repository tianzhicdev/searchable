import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import Declaration from '../views/static/Declaration';
import FAQ from '../views/static/FAQ';
import TermsAndConditions from '../views/static/TermsAndConditions';
import ContactInfo from '../views/static/ContactInfo';
import GettingStarted from '../views/static/GettingStarted';
import Invite from '../views/Invite';
import Landing from '../views/landing/Landing';
import Onboarding1 from '../views/onboarding/Onboarding1';
import Onboarding2 from '../views/onboarding/Onboarding2';
import Onboarding3 from '../views/onboarding/Onboarding3';
import Onboarding3_1 from '../views/onboarding/Onboarding3_1';
import Onboarding3_2 from '../views/onboarding/Onboarding3_2';
import Onboarding4 from '../views/onboarding/Onboarding4';
import Onboarding4_1 from '../views/onboarding/Onboarding4_1';
import Onboarding5 from '../views/onboarding/Onboarding5';
import Onboarding5_1 from '../views/onboarding/Onboarding5_1';
import OnboardingCongratsWrapper from '../views/onboarding/OnboardingCongratsWrapper';
//-----------------------|| VISITOR ROUTING ||-----------------------//
import VisitorSection from '../views/pages/authentication/visitor/VisitorSection';

const VisitorRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/landing', '/declaration', '/faq', '/terms-and-conditions', '/contact-info', '/getting-started', '/visitor', '/invite', '/onboarding-1', '/onboarding-2', '/onboarding-3', '/onboarding-3-1', '/onboarding-3-2', '/onboarding-4', '/onboarding-4-1', '/onboarding-5', '/onboarding-5-1', '/onboarding-congrats']}>
            <Switch location={location} key={location.pathname}>
                {/* Public routes accessible to unregistered visitors */}
                <Route exact path="/declaration" component={Declaration} />
                <Route exact path="/faq" component={FAQ} />
                <Route exact path="/terms-and-conditions" component={TermsAndConditions} />
                <Route exact path="/contact-info" component={ContactInfo} />
                <Route exact path="/getting-started" component={GettingStarted} />
                <Route exact path="/visitor" component={VisitorSection} />
                <Route exact path="/invite" component={Invite} />
                <Route exact path="/landing" component={Landing} />
                <Route exact path="/onboarding-1" component={Onboarding1} />
                <Route exact path="/onboarding-2" component={Onboarding2} />
                <Route exact path="/onboarding-3" component={Onboarding3} />
                <Route exact path="/onboarding-3-1" component={Onboarding3_1} />
                <Route exact path="/onboarding-3-2" component={Onboarding3_2} />
                <Route exact path="/onboarding-4" component={Onboarding4} />
                <Route exact path="/onboarding-4-1" component={Onboarding4_1} />
                <Route exact path="/onboarding-5" component={Onboarding5} />
                <Route exact path="/onboarding-5-1" component={Onboarding5_1} />
                <Route exact path="/onboarding-congrats" component={OnboardingCongratsWrapper} />
            </Switch>
        </Route>
    );
};

export default VisitorRoutes; 