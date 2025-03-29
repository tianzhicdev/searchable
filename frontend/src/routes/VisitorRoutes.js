import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import Searchables from '../views/searchables/Searchables';
import SearchableDetails from '../views/searchables/SearchableDetails';

//-----------------------|| VISITOR ROUTING ||-----------------------//

const VisitorRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/searchables', '/searchable-item/:id']}>
            <Switch location={location} key={location.pathname}>
                {/* Public routes accessible to unregistered visitors */}
                <Route exact path="/searchables" component={Searchables} />
                <Route exact path="/searchable-item/:id" component={SearchableDetails} />
            </Switch>
        </Route>
    );
};

export default VisitorRoutes; 