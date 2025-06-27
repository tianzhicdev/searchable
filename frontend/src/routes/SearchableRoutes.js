import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import NavMotion from '../layout/NavMotion';
import AuthGuard from './../utils/route-guard/AuthGuard';
import PublishDownloadableSearchable from '../views/searchables/PublishDownloadableSearchable';
import PublishOfflineSearchable from '../views/searchables/PublishOfflineSearchable';
import PublishDirectSearchable from '../views/searchables/PublishDirectSearchable';
import Dashboard from '../views/profile/Dashboard';
import PurchaseRatings from '../views/ratings/PurchaseRatings';
import Landing from '../views/landing/Landing';
import DownloadableSearchableDetails from '../views/searchables/DownloadableSearchableDetails';
import OfflineSearchableDetails from '../views/searchables/OfflineSearchableDetails';
import DirectSearchableDetails from '../views/searchables/DirectSearchableDetails';
import UserProfile from '../views/profile/UserProfile';
import MyDownloads from '../views/profile/MyDownloads';

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/landing', '/searchable-item/:id', '/offline-item/:id', '/direct-item/:id', '/profile/:identifier', '/publish-searchables', '/publish-offline-searchables', '/publish-direct-searchables', '/dashboard', '/my-purchases', '/my-downloads']}>
            <Switch location={location} key={location.pathname}>
                {/* Protected routes that require authentication */}
                <AuthGuard>
                    <Route exact path="/landing" component={Landing} />
                    <Route exact path="/searchable-item/:id" component={DownloadableSearchableDetails} />
                    <Route exact path="/offline-item/:id" component={OfflineSearchableDetails} />
                    <Route exact path="/direct-item/:id" component={DirectSearchableDetails} />
                    <Route path="/profile/:identifier" component={UserProfile} />
                    <Route exact path="/publish-searchables" component={PublishDownloadableSearchable} />
                    <Route exact path="/publish-offline-searchables" component={PublishOfflineSearchable} />
                    <Route exact path="/publish-direct-searchables" component={PublishDirectSearchable} />
                    <Route exact path="/dashboard" component={Dashboard} />
                    <Route exact path="/my-purchases" component={PurchaseRatings} />
                    <Route exact path="/my-downloads" component={MyDownloads} />
                </AuthGuard>
                
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
