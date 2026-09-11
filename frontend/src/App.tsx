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

const getBasePath = (): string => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/fixlap')) {
    return '/fixlap';
  }
  return '';
};

function normalizePath(rawPath: string): string {
  const base = getBasePath();
  if (base && rawPath.startsWith(base)) {
    const stripped = rawPath.slice(base.length);
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
  return rawPath || '/';
}

function pageFromPath(path: string): Page {
  const normalized = normalizePath(path);
  if (normalized.startsWith('/referral/')) return 'client-login';
  return (Object.keys(routes) as Page[]).find(page => routes[page] === normalized) ?? 'home';
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [staffSession, setStaffSession] = useState(readStaffSession);
  const normalizedPath = normalizePath(path);
  const page = pageFromPath(path);
  const [loginRole, setLoginRole] = useState<Role>(normalizedPath === routes.admin ? 'admin' : 'repairer');
  const staffPage = page === 'repairer' || page === 'admin';
  const canOpenStaffPage = staffPage && staffSession?.role === page;
  const referralCode = normalizedPath.startsWith('/referral/') ? normalizedPath.split('/')[2] : undefined;

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
      const base = getBasePath();
      const target = `${base}${routes.login}`;
      window.history.replaceState({}, '', target);
      setPath(target);
    }
  }, [page, staffPage, canOpenStaffPage]);

  const navigate = (next: Page) => {
    const base = getBasePath();
    const target = `${base}${routes[next]}`;
    window.history.pushState({}, '', target);
    setPath(target);
    window.scrollTo(0, 0);
  };

  const login = (role: Role, remember: boolean, email?: string) => {
    setStaffSession(saveStaffSession(role, remember, email));
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
