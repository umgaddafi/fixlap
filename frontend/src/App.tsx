import { useEffect, useState } from 'react';
import Landing from './Landing';
import Login from './features/auth/Login';
import { clearStaffSession, readStaffSession, saveStaffSession } from './features/auth/session';
import Dashboard from './features/dashboard/Dashboard';
import type { Role } from './types';
import { api } from './api/client';
import ClientLogin from './features/client/ClientLogin';
import ClientDashboard from './features/client/ClientDashboard';
import LandingExtras from './features/landing/LandingExtras';
import LandingTrust from './features/landing/LandingTrust';

const routes = {
  home: '/',
  login: '/staff/login',
  'client-login': '/client/login',
  'client-dashboard': '/client/dashboard',
  repairer: '/staff/repairer',
  admin: '/staff/admin',
} as const;

type Page = keyof typeof routes;

function pageFromPath(path: string): Page {
  if (path.startsWith('/referral/')) return 'client-login';
  return (Object.keys(routes) as Page[]).find(page => routes[page] === path) ?? 'home';
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [staffSession, setStaffSession] = useState(readStaffSession);
  const [loginRole, setLoginRole] = useState<Role>(path === routes.admin ? 'admin' : 'repairer');
  const page = pageFromPath(path);
  const staffPage = page === 'repairer' || page === 'admin';
  const canOpenStaffPage = staffPage && staffSession?.role === page;
  const referralCode = path.startsWith('/referral/') ? path.split('/')[2] : undefined;

  useEffect(() => {
    const onPopState = () => {
      setStaffSession(readStaffSession());
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (staffPage && !canOpenStaffPage) {
      setLoginRole(page);
      window.history.replaceState({}, '', routes.login);
      setPath(routes.login);
    }
  }, [page, staffPage, canOpenStaffPage]);

  const navigate = (next: Page) => {
    window.history.pushState({}, '', routes[next]);
    setPath(routes[next]);
    window.scrollTo(0, 0);
  };

  const login = (role: Role, remember: boolean) => {
    setStaffSession(saveStaffSession(role, remember));
    navigate(role);
  };

  const logout = () => {
    api.auth.logout().catch(() => null);
    clearStaffSession();
    setStaffSession(null);
    navigate('home');
  };

  if (page === 'home') return <><Landing onStaffLogin={() => navigate('login')} onClientLogin={() => navigate('client-login')} /><LandingTrust /><LandingExtras onClientLogin={() => navigate('client-login')} /></>;
  if (page === 'login' || (staffPage && !canOpenStaffPage)) return <Login key={staffPage ? page : loginRole} initialRole={staffPage ? page : loginRole} onLogin={login} onBack={() => navigate('home')} />;
  if (page === 'client-login') return <ClientLogin referredBy={referralCode} onLogin={() => navigate('client-dashboard')} onBack={() => navigate('home')} />;
  if (page === 'client-dashboard') return <ClientDashboard onLogout={() => navigate('home')} />;
  return <Dashboard key={page} role={page} onLogout={logout} />;
}
