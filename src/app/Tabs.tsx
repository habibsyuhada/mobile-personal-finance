import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import {
  homeOutline,
  listOutline,
  scanOutline,
  pieChartOutline,
  settingsOutline,
} from 'ionicons/icons';
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import ScanPage from '@/pages/ScanPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import AccountsPage from '@/pages/AccountsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import BudgetsPage from '@/pages/BudgetsPage';
import { useT } from '@/i18n/useT';

export function Tabs() {
  const t = useT();
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/dashboard" render={() => <DashboardPage />} />
        <Route exact path="/tabs/transactions" render={() => <TransactionsPage />} />
        <Route exact path="/tabs/scan" render={() => <ScanPage />} />
        <Route exact path="/tabs/reports" render={() => <ReportsPage />} />
        <Route exact path="/tabs/settings" render={() => <SettingsPage />} />
        <Route exact path="/tabs/accounts" render={() => <AccountsPage />} />
        <Route exact path="/tabs/categories" render={() => <CategoriesPage />} />
        <Route exact path="/tabs/budgets" render={() => <BudgetsPage />} />
        <Route exact path="/tabs" render={() => <Redirect to="/tabs/dashboard" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/tabs/dashboard">
          <IonIcon icon={homeOutline} />
          <IonLabel>{t('tab.dashboard')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="transactions" href="/tabs/transactions">
          <IonIcon icon={listOutline} />
          <IonLabel>{t('tab.transactions')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="scan" href="/tabs/scan">
          <IonIcon icon={scanOutline} />
          <IonLabel>{t('tab.scan')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/tabs/reports">
          <IonIcon icon={pieChartOutline} />
          <IonLabel>{t('tab.reports')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/tabs/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>{t('tab.settings')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
