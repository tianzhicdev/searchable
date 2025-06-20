import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import NavMotion from '../layout/NavMotion';
import AuthGuard from './../utils/route-guard/AuthGuard';
import PublishDownloadableSearchable from '../views/searchables/PublishDownloadableSearchable';
import PublishOfflineSearchable from '../views/searchables/PublishOfflineSearchable';
import Profile from '../views/profile/Profile';
import PurchaseRatings from '../views/ratings/PurchaseRatings';
import Searchables from '../views/searchables/Searchables';
import DownloadableSearchableDetails from '../views/searchables/DownloadableSearchableDetails';
import OfflineSearchableDetails from '../views/searchables/OfflineSearchableDetails';
import UserProfile from '../views/profile/UserProfile';

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/searchables', '/searchable-item/:id', '/offline-item/:id', '/profile/:identifier', '/publish-searchables', '/publish-offline-searchables', '/profile', '/my-purchases']}>
            <Switch location={location} key={location.pathname}>
                {/* Protected routes that require authentication */}
                <AuthGuard>
                    <Route exact path="/searchables" component={Searchables} />
                    <Route exact path="/searchable-item/:id" component={DownloadableSearchableDetails} />
                    <Route exact path="/offline-item/:id" component={OfflineSearchableDetails} />
                    <Route path="/profile/:identifier" component={UserProfile} />
                    <Route exact path="/publish-searchables" component={PublishDownloadableSearchable} />
                    <Route exact path="/publish-offline-searchables" component={PublishOfflineSearchable} />
                    <Route exact path="/profile" component={Profile} />
                    <Route exact path="/my-purchases" component={PurchaseRatings} />
                </AuthGuard>
                
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
