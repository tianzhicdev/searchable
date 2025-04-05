import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import Searchables from '../views/searchables/Searchables';
import SearchableDetails from '../views/searchables/SearchableDetails';
import Declaration from '../views/static/Declaration';
import FAQ from '../views/static/FAQ';
import TermsAndConditions from '../views/static/TermsAndConditions';
//-----------------------|| VISITOR ROUTING ||-----------------------//

const VisitorRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/searchables', '/searchable-item/:id', '/declaration', '/faq', '/terms-and-conditions']}>
            <Switch location={location} key={location.pathname}>
                {/* Public routes accessible to unregistered visitors */}
                <Route exact path="/searchables" component={Searchables} />
                <Route exact path="/searchable-item/:id" component={SearchableDetails} />
                <Route exact path="/declaration" component={Declaration} />
                <Route exact path="/faq" component={FAQ} />
                <Route exact path="/terms-and-conditions" component={TermsAndConditions} />
            </Switch>
        </Route>
    );
};

export default VisitorRoutes; 