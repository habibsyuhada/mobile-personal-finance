import { IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ScanPage from './pages/ScanPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import { useFinanceStore } from './store/finance.store';
import { FINANCE_TABS } from './finance.tabs';

export { FINANCE_TABS };

export default function FinanceRoot() {
  const refreshAll = useFinanceStore((s) => s.refreshAll);
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
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
  );
}
