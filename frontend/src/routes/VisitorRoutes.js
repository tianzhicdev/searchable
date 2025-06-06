import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import Searchables from '../views/searchables/Searchables';
import DownloadableSearchableDetails from '../views/searchables/DownloadableSearchableDetails';
import Declaration from '../views/static/Declaration';
import FAQ from '../views/static/FAQ';
import TermsAndConditions from '../views/static/TermsAndConditions';
import ContactInfo from '../views/static/ContactInfo';
import GettingStarted from '../views/static/GettingStarted';
//-----------------------|| VISITOR ROUTING ||-----------------------//

const VisitorRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/searchables', '/searchable-item/:id', '/declaration', '/faq', '/terms-and-conditions', '/contact-info', '/getting-started']}>
            <Switch location={location} key={location.pathname}>
                {/* Public routes accessible to unregistered visitors */}
                <Route exact path="/searchables" component={Searchables} />
                <Route exact path="/searchable-item/:id" component={DownloadableSearchableDetails} />
                <Route exact path="/declaration" component={Declaration} />
                <Route exact path="/faq" component={FAQ} />
                <Route exact path="/terms-and-conditions" component={TermsAndConditions} />
                <Route exact path="/contact-info" component={ContactInfo} />
                <Route exact path="/getting-started" component={GettingStarted} />
            </Switch>
        </Route>
    );
};

export default VisitorRoutes; 