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
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ScanPage from './pages/ScanPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import { useT } from '@/i18n/useT';
import { useEffect } from 'react';
import { useFinanceStore } from './store/finance.store';

export default function FinanceRoot() {
  const t = useT();
  const refreshAll = useFinanceStore((s) => s.refreshAll);
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/m/finance/dashboard" render={() => <DashboardPage />} />
        <Route exact path="/m/finance/transactions" render={() => <TransactionsPage />} />
        <Route exact path="/m/finance/scan" render={() => <ScanPage />} />
        <Route exact path="/m/finance/reports" render={() => <ReportsPage />} />
        <Route exact path="/m/finance/settings" render={() => <SettingsPage />} />
        <Route exact path="/m/finance/accounts" render={() => <AccountsPage />} />
        <Route exact path="/m/finance/categories" render={() => <CategoriesPage />} />
        <Route exact path="/m/finance/budgets" render={() => <BudgetsPage />} />
        <Route exact path="/m/finance" render={() => <Redirect to="/m/finance/dashboard" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/m/finance/dashboard">
          <IonIcon icon={homeOutline} />
          <IonLabel>{t('tab.dashboard')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="transactions" href="/m/finance/transactions">
          <IonIcon icon={listOutline} />
          <IonLabel>{t('tab.transactions')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="scan" href="/m/finance/scan">
          <IonIcon icon={scanOutline} />
          <IonLabel>{t('tab.scan')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/m/finance/reports">
          <IonIcon icon={pieChartOutline} />
          <IonLabel>{t('tab.reports')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/m/finance/settings">
          <IonIcon icon={settingsOutline} />
          <IonLabel>{t('tab.settings')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
