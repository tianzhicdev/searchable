import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
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
import WithdrawalUSDT from '../views/profile/WithdrawalUSDT';
import EditProfile from '../views/profile/EditProfile';
import ChangePassword from '../views/profile/ChangePassword';
import ThemeTestPage from '../views/theme-test-page';
import CyberpunkDemo from '../views/cyberpunk-demo';
import ThemeSelector from '../views/theme-selector';
import ThemeGallery from '../views/theme-gallery';
import SpacingDemo from '../views/spacing-demo';
import SpacingTest from '../views/spacing-test/SpacingTest';
import TextSpacingDemo from '../views/spacing-test/TextSpacingDemo';
import ThemeInfo from '../views/theme-info/ThemeInfo';
import ThemeGalleryCartoon from '../views/theme-gallery-cartoon';
import ThemeGalleryCategories from '../views/theme-gallery-categories';
import ThemeQuickTest from '../views/theme-quick-test';
import RefillUSDT from '../views/payments/RefillUSDT';

//-----------------------|| AUTH ROUTING ||-----------------------//

const SearchableRoutes = () => {
    const location = useLocation();

    return (
        <Route path={['/search', '/searchable-item/:id', '/offline-item/:id', '/direct-item/:id', '/profile/:identifier', '/publish-searchables', '/publish-offline-searchables', '/publish-direct-searchables', '/publish/ai-content', '/dashboard', '/my-purchases', '/my-downloads', '/credit-card-refill', '/refill-usdt', '/withdrawal-usdt', '/edit-profile', '/change-password', '/theme-test', '/cyberpunk-demo', '/theme-selector', '/theme-gallery', '/spacing-demo', '/spacing-test', '/text-spacing-demo', '/theme-info', '/theme-gallery-cartoon', '/theme-gallery-categories', '/theme-quick-test']}>
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
                    <Route exact path="/refill-usdt" component={RefillUSDT} />
                    <Route exact path="/withdrawal-usdt" component={WithdrawalUSDT} />
                    <Route exact path="/edit-profile" component={EditProfile} />
                    <Route exact path="/change-password" component={ChangePassword} />
                    <Route exact path="/theme-test" component={ThemeTestPage} />
                    <Route exact path="/cyberpunk-demo" component={CyberpunkDemo} />
                    <Route exact path="/theme-selector" component={ThemeSelector} />
                    <Route exact path="/theme-gallery" component={ThemeGallery} />
                    <Route exact path="/spacing-demo" component={SpacingDemo} />
                    <Route exact path="/spacing-test" component={SpacingTest} />
                    <Route exact path="/text-spacing-demo" component={TextSpacingDemo} />
                    <Route exact path="/theme-info" component={ThemeInfo} />
                    <Route exact path="/theme-gallery-cartoon" component={ThemeGalleryCartoon} />
                    <Route exact path="/theme-gallery-categories" component={ThemeGalleryCategories} />
                    <Route exact path="/theme-quick-test" component={ThemeQuickTest} />
                </AuthGuard>
                
            </Switch>
        </Route>
    );
};

export default SearchableRoutes;
