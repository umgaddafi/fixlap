import { LogOut, X } from 'lucide-react';
import { navigation } from './dashboardData';
import type { Role } from '../../types';
import BrandLogo from '../../components/BrandLogo';

export default function Sidebar({ role, active, onSelect, onLogout, open, onClose, openJobs, onHelp }: {
  role: Role; active: string; onSelect: (value: string) => void; onLogout: () => void;
  open: boolean; onClose: () => void; openJobs: number; onHelp?: () => void;
}) {
  const admin = role === 'admin';
  return <>
    {open && <button className="staff-sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`staff-sidebar ${open ? 'is-open' : ''}`} aria-label="Staff navigation">
      <div className="staff-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BrandLogo dark size="sm" />
        <button className="staff-icon-btn staff-close-nav" aria-label="Close navigation" onClick={onClose}><X size={20}/></button>
      </div>
      <nav>{navigation[role].map(([label, Icon]) => <button key={label} className={active === label ? 'active' : ''} aria-current={active === label ? 'page' : undefined} onClick={() => { onSelect(label); onClose(); }}><Icon size={19}/><span>{label}</span>{(label === 'My jobs' || label === 'Repair requests') && <b>{openJobs}</b>}</button>)}</nav>
      <div className="staff-sidebar-bottom">
        <button className="staff-signout" onClick={onLogout}><LogOut size={18}/>Sign out</button>
        <div className="staff-side-profile"><div className="staff-avatar">{admin ? 'AD' : 'JM'}</div><div><strong>{admin ? 'Alex Doe' : 'Jordan Malik'}</strong><small>{admin ? 'Administrator' : 'Repair technician'}</small></div><span className="staff-online-dot"/></div>
      </div>
    </aside>
  </>;
}
