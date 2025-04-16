import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import Searchables from '../views/searchables/Searchables';
import SearchableDetails from '../views/searchables/SearchableDetails';
import Declaration from '../views/static/Declaration';
import FAQ from '../views/static/FAQ';
import TermsAndConditions from '../views/static/TermsAndConditions';
import ContactInfo from '../views/static/ContactInfo';
import GettingStarted from '../views/static/GettingStarted';
import FigyuaPage from '../views/figyua/index';
import FigyuaRenderer from '../views/figyua/FigyuaRenderer';
//-----------------------|| VISITOR ROUTING ||-----------------------//

const VisitorRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/searchables', '/searchable-item/:id', '/declaration', '/faq', '/terms-and-conditions', '/contact-info', '/getting-started', '/figyua', '/figyua-renderer']}>
            <Switch location={location} key={location.pathname}>
                {/* Public routes accessible to unregistered visitors */}
                <Route exact path="/searchables" component={Searchables} />
                <Route exact path="/searchable-item/:id" component={SearchableDetails} />
                <Route exact path="/declaration" component={Declaration} />
                <Route exact path="/faq" component={FAQ} />
                <Route exact path="/terms-and-conditions" component={TermsAndConditions} />
                <Route exact path="/contact-info" component={ContactInfo} />
                <Route exact path="/getting-started" component={GettingStarted} />
                <Route exact path="/figyua" component={FigyuaPage} />
                <Route exact path="/figyua-renderer" component={FigyuaRenderer} />
            </Switch>
        </Route>
    );
};

export default VisitorRoutes; 