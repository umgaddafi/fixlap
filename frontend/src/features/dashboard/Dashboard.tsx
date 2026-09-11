import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, CircleHelp, ClipboardList, Clock3, HelpCircle, LogOut, Menu, MessageSquare, Package, Plus, ShieldCheck, Sparkles, Wrench, X } from 'lucide-react';
import Sidebar from './Sidebar';
import StatCard from './StatCard';
import Modal from './Modal';
import { CustomersView, InventoryView, ReportsView, TechniciansView } from './AdminViews';
import { DeviceIcon, NewRepairForm, RepairDetails, RepairTable, ScheduleView } from './RepairViews';
import { currentTechnicianId, dateKey, displayDate, isOpen, isOverdue, readWorkspace, statuses, workspaceKey, type Job, type Workspace } from './dashboardData';
import type { Role } from '../../types';
import { api } from '../../api/client';
import './staff.css';

const pageCopy: Record<string, [string, string]> = {
  'My jobs': ['Your repairs, all in one place.', 'Keep every diagnosis, repair and handover moving forward.'],
  'Repair requests': ['Keep the workshop moving.', 'Review requests, assign technicians and follow every repair.'],
  Schedule: ['Make room for a productive day.', 'Your scheduled repairs and customer collections.'],
  Customers: ['Good repairs. Happy customers.', 'A customer directory built from your workshop’s repair records.'],
  Technicians: ['The people behind every fix.', 'Balance assignments and keep your team working smoothly.'],
  Inventory: ['The right part. Right on hand.', 'Monitor stock levels and record incoming parts.'],
  'Parts inventory': ['Know what’s on the shelf.', 'Check parts availability before you start your next repair.'],
  Reports: ['See how your workshop is doing.', 'A practical snapshot of your repairs, workload and estimates.'],
};

export default function Dashboard({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const admin = role === 'admin';
  const [active, setActive] = useState('Overview');
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>(readWorkspace);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All statuses');
  const [modal, setModal] = useState<'new' | 'help' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const relevantJobs = admin ? workspace.jobs : workspace.jobs.filter(job => job.technicianId === currentTechnicianId);
  const openJobs = relevantJobs.filter(isOpen);
  const overdue = relevantJobs.filter(isOverdue);
  const waiting = relevantJobs.filter(job => job.status === 'Awaiting parts');
  const unassigned = workspace.jobs.filter(job => !job.technicianId && isOpen(job));
  const [chatNotifications, setChatNotifications] = useState<
    { id: string; threadId: string; repairId: string | null; trackingNumber?: string; title: string; author: string; text: string; time: string }[]
  >([]);
  const lowStock = workspace.parts.filter(part => part.stock <= part.minimum);
  const ready = relevantJobs.filter(job => job.status === 'Ready for pickup');
  const selectedJob = relevantJobs.find(job => job.id === selectedId);
  const queuePage = admin ? 'Repair requests' : 'My jobs';
  const inventoryPage = admin ? 'Inventory' : 'Parts inventory';
  const attentionCount = overdue.length + (admin ? unassigned.length + lowStock.length : waiting.length) + chatNotifications.length;

  useEffect(() => {
    let mounted = true;
    const fetchLiveWorkspace = async () => {
      try {
        const [jobs, technicians, parts, notifs] = await Promise.all([
          api.repairs.list().catch(() => []),
          api.technicians.list().catch(() => []),
          api.inventory.list().catch(() => []),
          api.notifications.list().catch(() => null),
        ]);
        if (mounted) {
          setWorkspace({
            jobs: Array.isArray(jobs) ? jobs : [],
            technicians: Array.isArray(technicians) ? technicians : [],
            parts: Array.isArray(parts) ? parts : [],
          });
          if (notifs?.items && Array.isArray(notifs.items)) {
            setChatNotifications(notifs.items);
          }
        }
      } catch {
        // Failed to fetch live workspace
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLiveWorkspace();
    const interval = setInterval(async () => {
      if (!mounted) return;
      try {
        const notifs = await api.notifications.list().catch(() => null);
        if (mounted && notifs?.items) {
          setChatNotifications(notifs.items);
        }
      } catch {}
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(workspaceKey, JSON.stringify(workspace)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [workspace]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === workspaceKey) setWorkspace(readWorkspace()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') { setNotifications(false); setUserMenuOpen(false); if (open) { setOpen(false); menuRef.current?.focus(); } } };
    const outside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('mousedown', outside);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('mousedown', outside); };
  }, [open]);

  const selectPage = (page: string) => { setActive(page); setOpen(false); setNotifications(false); setUserMenuOpen(false); setSearch(''); setFilter('All statuses'); };
  const showQueue = (status = 'All statuses') => { selectPage(queuePage); setFilter(status); };
  const saveJob = async (job: Job) => {
    setWorkspace(state => ({ ...state, jobs: state.jobs.map(existing => existing.id === job.id ? job : existing) }));
    setSelectedId(null);
    setToast(`Repair #${job.id} updated.`);
    try {
      await api.repairs.update(job.id, {
        status: job.status,
        priority: job.priority,
        dueDate: job.dueDate,
        time: job.time,
        estimate: job.estimate,
        technicianId: job.technicianId,
      });
    } catch {
      // Local state already updated
    }
  };
  const addJob = async (job: Job) => {
    setWorkspace(state => ({ ...state, jobs: [job, ...state.jobs] }));
    setModal(null);
    selectPage(queuePage);
    setToast(`Repair #${job.id} created.`);
    try {
      await api.repairs.create({
        customer: job.customer,
        email: job.email,
        phone: job.phone,
        device: job.device,
        category: job.category,
        issue: job.issue,
        priority: job.priority,
        dueDate: job.dueDate,
        time: job.time,
        estimate: job.estimate,
        technicianId: job.technicianId,
      });
    } catch {
      // Local state already updated
    }
  };

  const handleAddTechnician = async (technician: Technician) => {
    setWorkspace(state => ({ ...state, technicians: [...state.technicians, technician] }));
    setToast(`Technician ${technician.name} added to the team.`);
    try {
      const res = await api.technicians.create({
        name: technician.name,
        email: technician.email,
        phone: technician.phone,
        specialty: technician.specialty,
        available: technician.available,
      });
      if (res?.technician) {
        setWorkspace(state => ({
          ...state,
          technicians: state.technicians.map(t => t.id === technician.id ? res.technician : t),
        }));
      }
    } catch {
      // Local state already updated
    }
  };

  const handleUpdateTechnician = async (technician: Technician) => {
    setWorkspace(state => ({
      ...state,
      technicians: state.technicians.map(t => t.id === technician.id ? technician : t),
    }));
    setToast(`Technician ${technician.name} updated.`);
    try {
      await api.technicians.update(technician.id, {
        name: technician.name,
        email: technician.email,
        phone: technician.phone,
        specialty: technician.specialty,
        available: technician.available,
      });
    } catch {
      // Local state already updated
    }
  };

  const handleDeleteTechnician = async (id: string) => {
    const tech = workspace.technicians.find(t => t.id === id);
    setWorkspace(state => ({
      ...state,
      technicians: state.technicians.filter(t => t.id !== id),
      jobs: state.jobs.map(job => (job.technicianId === id && isOpen(job) ? { ...job, technicianId: '' } : job)),
    }));
    setToast(`Technician ${tech?.name || 'team member'} deleted.`);
    try {
      await api.technicians.delete(id);
    } catch {
      // Local state already updated
    }
  };

  const handleToggleAvailability = async (id: string) => {
    setWorkspace(state => ({
      ...state,
      technicians: state.technicians.map(tech => (tech.id === id ? { ...tech, available: !tech.available } : tech)),
    }));
    setToast('Technician availability updated.');
    try {
      await api.technicians.toggleAvailability(id);
    } catch {
      // Local state already updated
    }
  };

  const handleUpdateCustomer = async (customer: { key: string; name: string; email: string; phone: string }) => {
    setWorkspace(state => ({
      ...state,
      jobs: state.jobs.map(job => {
        const jobKey = job.email.trim().toLowerCase() || job.phone || job.customer;
        if (jobKey === customer.key || job.customer === customer.key || job.email.toLowerCase() === customer.key) {
          return {
            ...job,
            customer: customer.name,
            email: customer.email,
            phone: customer.phone,
          };
        }
        return job;
      }),
    }));
    setToast(`Customer ${customer.name} updated.`);
    try {
      await api.customers.update(customer.key, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });
    } catch {
      // Local state already updated
    }
  };

  const handleDeleteCustomer = async (customerKey: string) => {
    setToast('Customer deleted.');
    try {
      await api.customers.delete(customerKey);
    } catch {
      // Local state already updated
    }
  };

  const title = active === 'Overview' ? (admin ? 'A clear view of your workshop.' : 'Let’s get things working.') : pageCopy[active][0];
  const description = active === 'Overview' ? (admin ? 'Your team, your repairs, and everything that needs a little attention.' : 'A fresh look at your repair queue. Every fix makes someone’s day.') : pageCopy[active][1];

  return <div className="staff-app">
    <a className="staff-skip-link" href="#staff-main">Skip to content</a>
    <Sidebar role={role} active={active} onSelect={selectPage} onLogout={onLogout} open={open} onClose={() => setOpen(false)} openJobs={openJobs.length} onHelp={() => setModal('help')}/>
    <div className="staff-workarea"><header className="staff-topbar"><button ref={menuRef} className="staff-icon-btn staff-menu-btn" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={22}/></button><div className="staff-breadcrumb"><span>{admin ? 'Operations' : 'My workspace'}</span><ChevronRight size={14}/><strong>{active}</strong></div><div className="staff-top-actions"><span className="staff-top-date"><CalendarDays size={16}/>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span><button className="staff-icon-btn staff-help-btn" aria-label="Open workspace guide" title="A little help, when you need it." onClick={() => setModal('help')}><CircleHelp size={20}/></button><div ref={notificationRef} className="staff-notification-wrap"><button className={`staff-icon-btn ${notifications ? 'is-active' : ''}`} aria-label="Notifications" aria-expanded={notifications} onClick={() => setNotifications(!notifications)}><Bell size={20}/>{attentionCount > 0 && <i/>}</button>{notifications && <div className="staff-notifications"><div><h3>Needs your attention</h3><button className="staff-icon-btn" aria-label="Close notifications" onClick={() => setNotifications(false)}><X size={17}/></button></div>{attentionCount === 0 ? <p className="staff-muted">You’re all caught up.</p> : <>{chatNotifications.length > 0 && chatNotifications.map(item => <button key={item.id} onClick={() => { setNotifications(false); if (item.repairId) setSelectedId(item.repairId); }}><MessageSquare size={18} color="#0b8279"/><span>{item.author} ({item.title})<small>"{item.text.slice(0, 48)}{item.text.length > 48 ? '...' : ''}" · {item.time}</small></span><ChevronRight size={16}/></button>)}{overdue.length > 0 && <button onClick={() => showQueue('Overdue')}><Clock3 size={18}/><span>{overdue.length} overdue repair{overdue.length !== 1 ? 's' : ''}<small>Review deadlines and next steps</small></span><ChevronRight size={16}/></button>}{admin && unassigned.length > 0 && <button onClick={() => showQueue('Unassigned')}><Wrench size={18}/><span>{unassigned.length} unassigned repair{unassigned.length !== 1 ? 's' : ''}<small>Match a technician to the job</small></span><ChevronRight size={16}/></button>}{admin && lowStock.length > 0 && <button onClick={() => selectPage(inventoryPage)}><Package size={18}/><span>{lowStock.length} parts low on stock<small>Review inventory levels</small></span><ChevronRight size={16}/></button>}{!admin && waiting.length > 0 && <button onClick={() => showQueue('Awaiting parts')}><Package size={18}/><span>{waiting.length} repairs awaiting parts<small>Check stock and add a work note</small></span><ChevronRight size={16}/></button>}</>}</div>}</div><span className="staff-top-divider"/><div ref={userMenuRef} className="staff-user-menu-wrap"><button className={`staff-user-trigger ${userMenuOpen ? 'is-active' : ''}`} aria-label="Staff user profile menu" aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen(!userMenuOpen)}><div className="staff-avatar">{admin ? 'AD' : 'JM'}</div><ChevronDown size={14} className={`staff-chevron ${userMenuOpen ? 'rotated' : ''}`} /></button>{userMenuOpen && <div className="staff-user-dropdown" role="menu"><div className="staff-dropdown-header"><div className="staff-avatar">{admin ? 'AD' : 'JM'}</div><div className="staff-dropdown-info"><strong>{admin ? 'Alex Doe' : 'Jordan Malik'}</strong><small>{admin ? 'admin@fixlab.com' : 'repairer@fixlab.com'}</small><span className="staff-role-pill">{admin ? 'Administrator' : 'Repair technician'}</span></div></div><div className="staff-dropdown-divider"/><div className="staff-dropdown-list">{admin ? <><button onClick={() => { selectPage('Technicians'); setUserMenuOpen(false); }}><Wrench size={16}/><span>Technicians directory</span></button><button onClick={() => { selectPage('Reports'); setUserMenuOpen(false); }}><ClipboardList size={16}/><span>Workshop reports</span></button></> : <><button onClick={() => { showQueue('Open'); setUserMenuOpen(false); }}><ClipboardList size={16}/><span>My repair queue</span></button><button onClick={() => { selectPage('Schedule'); setUserMenuOpen(false); }}><CalendarDays size={16}/><span>Today’s schedule</span></button></>}<button onClick={() => { setModal('help'); setUserMenuOpen(false); }}><HelpCircle size={16}/><span>Workspace guide</span></button></div><div className="staff-dropdown-divider"/><div className="staff-dropdown-list"><button className="staff-logout-item" onClick={() => { setUserMenuOpen(false); onLogout(); }}><LogOut size={16}/><span>Sign out</span></button></div></div>}</div></div></header>
      <main className="staff-content" id="staff-main"><div className="staff-page-heading"><div><p className="staff-eyebrow">{active === 'Overview' ? `WELCOME BACK, ${admin ? 'ALEX' : 'JORDAN'}` : `${admin ? 'WORKSHOP' : 'MY WORKSPACE'} / ${active.toUpperCase()}`}</p><h1>{title}</h1><p className="staff-muted">{description}</p></div><button className="staff-btn staff-btn-primary" onClick={() => setModal('new')}><Plus size={18}/>New repair</button></div>
        {storageError && <div className="staff-storage-warning" role="alert"><CircleAlert size={18}/>Browser storage is unavailable. Your changes will be lost when this page closes.</div>}
        {active === 'Overview' && <>
          <div className="staff-stats"><StatCard icon={ClipboardList} label={admin ? 'Open repair requests' : 'My open jobs'} value={String(openJobs.length).padStart(2, '0')} note={admin ? `${unassigned.length} waiting for assignment` : `${relevantJobs.filter(job => job.dueDate === dateKey() && isOpen(job)).length} scheduled for today`} tone="teal" onClick={() => showQueue('Open')}/><StatCard icon={Wrench} label={admin ? 'Available technicians' : 'Repairs in progress'} value={String(admin ? workspace.technicians.filter(tech => tech.available).length : relevantJobs.filter(job => job.status === 'In progress').length).padStart(2, '0')} note={admin ? `Across a team of ${workspace.technicians.length}` : 'Keep the momentum going'} tone="purple" onClick={() => admin ? selectPage('Technicians') : showQueue('In progress')}/><StatCard icon={CheckCircle2} label="Ready for pickup" value={String(ready.length).padStart(2, '0')} note="The final step to a happy customer" tone="green" onClick={() => showQueue('Ready for pickup')}/><StatCard icon={admin ? Package : Clock3} label={admin ? 'Low stock items' : 'Awaiting parts'} value={String(admin ? lowStock.length : waiting.length).padStart(2, '0')} note={admin ? 'At or below reorder level' : `${overdue.length} overdue · review your queue`} tone="orange" onClick={() => admin ? selectPage(inventoryPage) : showQueue('Awaiting parts')}/></div>
          <div className="staff-overview-grid"><section className="staff-focus-panel"><div className="staff-focus-heading"><span className="staff-focus-icon">{admin ? <ShieldCheck size={22}/> : <Sparkles size={22}/>}</span><span className="staff-focus-label">{admin ? 'WORKSHOP PULSE' : 'YOUR DAILY FOCUS'}</span><span className="staff-focus-tag">{admin ? 'Operations' : 'On the bench'}</span></div><h2>{admin ? `${openJobs.length} repairs. One connected team.` : overdue.length ? 'A little attention goes a long way.' : 'Your next great fix starts here.'}</h2><p>{admin ? `${workspace.technicians.filter(tech => tech.available).length} technicians available. ${unassigned.length ? `${unassigned.length} repair needs a technician to get started.` : 'Every open repair has a technician assigned.'}` : overdue.length ? `${overdue.length} repair is past its due date. Check the parts, update the job, and keep things moving.` : `${openJobs.length} jobs are in your queue. Pick a repair and make your next move.`}</p><button onClick={() => showQueue(admin && unassigned.length ? 'Unassigned' : !admin && overdue.length ? 'Overdue' : 'Open')}>{admin && unassigned.length ? 'Assign a technician' : admin ? 'Open repair requests' : 'Open my repair queue'}<ArrowRight size={17}/></button><div className="staff-focus-decoration" aria-hidden="true"><Wrench size={100} strokeWidth={1}/></div></section><section className="staff-panel staff-health-panel"><div className="staff-section-head"><h2>Repair pipeline</h2><span className="staff-muted">{relevantJobs.length} total</span></div><div className="staff-pipeline-bar" role="img" aria-label={statuses.map(status => `${status}: ${relevantJobs.filter(job => job.status === status).length}`).join(', ')}>{statuses.map(status => <span key={status} className={`pipeline-${status.toLowerCase().replace(/ /g, '-')}`} style={{ flex: relevantJobs.filter(job => job.status === status).length }}/>)}</div><div className="staff-pipeline-legend">{statuses.map(status => <button key={status} onClick={() => showQueue(status)}><i className={`pipeline-${status.toLowerCase().replace(/ /g, '-')}`}/><span>{status}</span><strong>{relevantJobs.filter(job => job.status === status).length}</strong></button>)}</div></section></div>
          <section className="staff-queue-section"><div className="staff-section-head"><div><h2>{admin ? 'Latest repair requests' : 'Your repair queue'}<span className="staff-count">{openJobs.length}</span></h2><p className="staff-muted">{admin ? 'A closer look at the work moving through your workshop.' : 'The details you need to take the next step.'}</p></div><button className="staff-link" onClick={() => showQueue('Open')}>View all repairs<ArrowRight size={16}/></button></div><RepairTable jobs={openJobs} technicians={workspace.technicians} admin={admin} onOpen={setSelectedId} search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} overview/></section>
          <div className="staff-bottom-grid"><section className="staff-panel"><div className="staff-section-head"><div><h2>{admin ? 'Team workload' : 'Today’s schedule'}</h2><p className="staff-muted">{admin ? 'Open repairs by technician' : 'Your next deadlines and collections'}</p></div><button className="staff-icon-btn" aria-label={admin ? 'View technicians' : 'View schedule'} onClick={() => selectPage(admin ? 'Technicians' : 'Schedule')}><ArrowRight size={18}/></button></div>{admin ? <div className="staff-team-preview">{workspace.technicians.slice(0, 3).map(tech => { const count = workspace.jobs.filter(job => job.technicianId === tech.id && isOpen(job)).length; return <button key={tech.id} onClick={() => selectPage('Technicians')}><span className="staff-avatar">{tech.name.split(' ').map(name => name[0]).slice(0, 2).join('')}</span><span><strong>{tech.name}</strong><small>{tech.specialty}</small></span><span className={`staff-availability ${tech.available ? '' : 'away'}`}><i/>{tech.available ? 'Available' : 'Away'}</span><b>{count} jobs</b></button>; })}</div> : <div className="staff-agenda-preview">{openJobs.filter(job => job.dueDate === dateKey()).sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3).map(job => <button key={job.id} onClick={() => setSelectedId(job.id)}><time>{job.time}</time><span className="staff-device-icon"><DeviceIcon category={job.category}/></span><span><strong>{job.device}</strong><small>{job.customer} · #{job.id}</small></span><ChevronRight size={16}/></button>)}{!openJobs.some(job => job.dueDate === dateKey()) && <p className="staff-empty">No appointments today. Check your schedule for upcoming repairs.</p>}</div>}</section><section className="staff-panel"><div className="staff-section-head"><div><h2>Needs attention<span className="staff-count warm">{attentionCount}</span></h2><p className="staff-muted">Small actions that make a difference</p></div><CircleAlert size={19}/></div><div className="staff-attention-list"><button onClick={() => showQueue('Overdue')}><span className="staff-attention-icon orange"><Clock3 size={18}/></span><span><strong>{overdue.length} overdue repair{overdue.length !== 1 ? 's' : ''}</strong><small>{overdue.length ? `Oldest deadline: ${displayDate([...overdue].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate)}` : 'All repair deadlines are on track'}</small></span><ChevronRight size={17}/></button><button onClick={() => admin ? showQueue('Unassigned') : showQueue('Awaiting parts')}><span className="staff-attention-icon purple"><Wrench size={18}/></span><span><strong>{admin ? `${unassigned.length} unassigned repairs` : `${waiting.length} repairs awaiting parts`}</strong><small>{admin ? 'Give each repair a person to own it' : 'Check availability and update your notes'}</small></span><ChevronRight size={17}/></button>{admin && <button onClick={() => selectPage(inventoryPage)}><span className="staff-attention-icon teal"><Package size={18}/></span><span><strong>{lowStock.length} items need restocking</strong><small>Keep the next repair moving</small></span><ChevronRight size={17}/></button>}</div></section></div>
        </>}
        {active === queuePage && <RepairTable jobs={relevantJobs} technicians={workspace.technicians} admin={admin} onOpen={setSelectedId} search={search} onSearch={setSearch} filter={filter} onFilter={setFilter}/>}
        {active === 'Schedule' && !admin && <ScheduleView jobs={relevantJobs} onOpen={setSelectedId}/>}
        {active === inventoryPage && <InventoryView parts={workspace.parts} admin={admin} onRestock={(id, quantity) => { if (!admin || !Number.isInteger(quantity) || quantity <= 0) return; setWorkspace(state => ({ ...state, parts: state.parts.map(part => part.id === id ? { ...part, stock: part.stock + quantity } : part) })); setToast('Stock updated successfully.'); }}/>}
        {active === 'Customers' && admin && <CustomersView jobs={workspace.jobs} onOpenJob={setSelectedId} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer}/>}
        {active === 'Technicians' && admin && <TechniciansView jobs={workspace.jobs} technicians={workspace.technicians} onAddTechnician={handleAddTechnician} onUpdateTechnician={handleUpdateTechnician} onDeleteTechnician={handleDeleteTechnician} onToggleAvailability={handleToggleAvailability}/>}
        {active === 'Reports' && admin && <ReportsView jobs={workspace.jobs} technicians={workspace.technicians}/>}
        <footer className="staff-footer"><span><Wrench size={14}/>A little care. A better repair.</span><span>Kendat FixLap · {admin ? 'Admin' : 'Technician'} workspace</span></footer>
      </main>
    </div>
    {modal === 'new' && <Modal title="Create a repair" subtitle="A few details now. A smoother repair from here." onClose={() => setModal(null)}><NewRepairForm technicians={workspace.technicians} admin={admin} onSave={addJob} onCancel={() => setModal(null)}/></Modal>}
    {selectedJob && <Modal title={`Repair #${selectedJob.id}`} subtitle="Review the details and keep the repair moving." onClose={() => setSelectedId(null)}><RepairDetails key={selectedJob.id} job={selectedJob} technicians={workspace.technicians} admin={admin} onSave={saveJob} onCancel={() => setSelectedId(null)}/></Modal>}
    {modal === 'help' && <Modal title="Your workspace guide" subtitle="Everything you need for the next good fix." onClose={() => setModal(null)}><div className="staff-guide"><article><span>01</span><div><h3>{admin ? 'Organize the workshop' : 'Find your next repair'}</h3><p>{admin ? 'Open Repair requests to search jobs, assign a technician, adjust estimates and set deadlines.' : 'My jobs shows repairs assigned to you. Search by device, customer or repair ID, then open a repair to see the details.'}</p></div></article><article><span>02</span><div><h3>Keep everyone up to date</h3><p>Update the status and add internal work notes for diagnostics, parts and handover details. Save changes when you are done.</p></div></article><article><span>03</span><div><h3>{admin ? 'Keep the team equipped' : 'Plan the day ahead'}</h3><p>{admin ? 'Use Technicians to manage availability and Inventory to record stock deliveries. Reports summarizes the current repair records.' : 'Use Schedule to see your appointments and Parts inventory to check stock. If a part is missing, set the job to Awaiting parts and leave a note.'}</p></div></article></div><div className="staff-modal-actions"><button className="staff-btn staff-btn-primary" onClick={() => setModal(null)}>Got it<Check size={16}/></button></div></Modal>}
    <div className="staff-toast-region" role="status" aria-live="polite">{toast && <div className="staff-toast"><CheckCircle2 size={19}/><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={17}/></button></div>}</div>
  </div>;
}
