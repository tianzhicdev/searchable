import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import NavMotion from '../layout/NavMotion';
import AuthGuard from './../utils/route-guard/AuthGuard';
import PublishDownloadableSearchable from '../views/searchables/PublishDownloadableSearchable';
import PublishOfflineSearchable from '../views/searchables/PublishOfflineSearchable';
import PublishDirectSearchable from '../views/searchables/PublishDirectSearchable';
import PublishAIContent from '../views/publish/PublishAIContent';
import Dashboard from '../views/profile/Dashboard';
import PurchaseRatings from '../views/ratings/PurchaseRatings';
import Search from '../views/search/Search';
import DownloadableSearchableDetails from '../views/searchables/DownloadableSearchableDetails';
import OfflineSearchableDetails from '../views/searchables/OfflineSearchableDetails';
import DirectSearchableDetails from '../views/searchables/DirectSearchableDetails';
import UserProfile from '../views/profile/UserProfile';
import MyDownloads from '../views/profile/MyDownloads';
import CreditCardRefill from '../views/payments/CreditCardRefill';
import ThemeTestPage from '../views/theme-test-page';
import CyberpunkDemo from '../views/cyberpunk-demo';
import ThemeSelector from '../views/theme-selector';
import ThemeGallery from '../views/theme-gallery';

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/search', '/searchable-item/:id', '/offline-item/:id', '/direct-item/:id', '/profile/:identifier', '/publish-searchables', '/publish-offline-searchables', '/publish-direct-searchables', '/publish/ai-content', '/dashboard', '/my-purchases', '/my-downloads', '/credit-card-refill', '/theme-test', '/cyberpunk-demo', '/theme-selector', '/theme-gallery']}>
            <Switch location={location} key={location.pathname}>
                {/* Protected routes that require authentication */}
                <AuthGuard>
                    <Route exact path="/search" component={Search} />
                    <Route exact path="/searchable-item/:id" component={DownloadableSearchableDetails} />
                    <Route exact path="/offline-item/:id" component={OfflineSearchableDetails} />
                    <Route exact path="/direct-item/:id" component={DirectSearchableDetails} />
                    <Route path="/profile/:identifier" component={UserProfile} />
                    <Route exact path="/publish-searchables" component={PublishDownloadableSearchable} />
                    <Route exact path="/publish-offline-searchables" component={PublishOfflineSearchable} />
                    <Route exact path="/publish-direct-searchables" component={PublishDirectSearchable} />
                    <Route exact path="/publish/ai-content" component={PublishAIContent} />
                    <Route exact path="/dashboard" component={Dashboard} />
                    <Route exact path="/my-purchases" component={PurchaseRatings} />
                    <Route exact path="/my-downloads" component={MyDownloads} />
                    <Route exact path="/credit-card-refill" component={CreditCardRefill} />
                    <Route exact path="/theme-test" component={ThemeTestPage} />
                    <Route exact path="/cyberpunk-demo" component={CyberpunkDemo} />
                    <Route exact path="/theme-selector" component={ThemeSelector} />
                    <Route exact path="/theme-gallery" component={ThemeGallery} />
                </AuthGuard>
                
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
