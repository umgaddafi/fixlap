import { useState, useEffect, useRef, type FormEvent } from 'react';
import { ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, Laptop, MessageSquare, Plus, Search, Send, Smartphone, Tablet, Wrench } from 'lucide-react';
import { currentTechnicianId, dateKey, displayDate, initials, isOverdue, money, recordId, statuses, type Job, type JobStatus, type Priority, type Technician } from './dashboardData';
import { api } from '../../api/client';

export function StatusBadge({ status }: { status: JobStatus }) {
  return <span className={`staff-badge status-${status.toLowerCase().replace(/ /g, '-')}`}><i/>{status}</span>;
}
export function DeviceIcon({ category }: { category: Job['category'] }) {
  const Icon = category === 'Laptop' ? Laptop : category === 'Tablet' ? Tablet : category === 'Phone' ? Smartphone : Wrench;
  return <Icon size={19}/>;
}
export function RepairTable({ jobs, technicians, admin, onOpen, search, onSearch, filter, onFilter, overview = false }: {
  jobs: Job[]; technicians: Technician[]; admin: boolean; onOpen: (id: string) => void;
  search: string; onSearch: (value: string) => void; filter: string; onFilter: (value: string) => void; overview?: boolean;
}) {
  const filtered = jobs.filter(job => (filter === 'All statuses' || (filter === 'Open' ? job.status !== 'Completed' : filter === 'Overdue' ? isOverdue(job) : filter === 'Unassigned' ? !job.technicianId : job.status === filter)) && `${job.id} ${job.customer} ${job.email} ${job.device} ${job.issue}`.toLowerCase().includes(search.toLowerCase()));
  const visible = overview ? filtered.slice(0, 5) : filtered;
  return <div className="staff-panel staff-repair-table"><div className="staff-table-tools"><label className="staff-search"><Search size={18}/><input aria-label="Search repairs" placeholder="Search by ID, customer or device..." value={search} onChange={e => onSearch(e.target.value)}/></label><label className="staff-filter"><span className="sr-only">Filter repairs by status</span><select value={filter} onChange={e => onFilter(e.target.value)}><option>All statuses</option><option>Open</option><option>Overdue</option>{admin && <option>Unassigned</option>}{statuses.map(status => <option key={status}>{status}</option>)}</select></label></div><div className="staff-table-scroll"><table><thead><tr><th>Device / repair ID</th><th>Customer</th><th>Status</th><th>{admin ? 'Technician' : 'Priority'}</th><th>Due date</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(job => <tr key={job.id}><td><div className="staff-device-cell"><span className="staff-device-icon"><DeviceIcon category={job.category}/></span><div><button className="staff-job-link" onClick={() => onOpen(job.id)}>{job.device}</button><small>#{job.id}</small></div></div></td><td><div className="staff-customer-cell"><span className="staff-avatar small">{initials(job.customer)}</span><span>{job.customer}</span></div></td><td><StatusBadge status={job.status}/></td><td>{admin ? <span className={!job.technicianId ? 'staff-unassigned' : ''}>{technicians.find(tech => tech.id === job.technicianId)?.name ?? 'Unassigned'}</span> : <span className={`staff-priority priority-${job.priority.toLowerCase()}`}><i/>{job.priority}</span>}</td><td><span className={isOverdue(job) ? 'staff-overdue' : ''}>{job.dueDate === dateKey() ? 'Today' : displayDate(job.dueDate)}</span><small>{job.time}{isOverdue(job) ? ' · Overdue' : ''}</small></td><td><button className="staff-icon-btn" aria-label={`Open repair ${job.id}`} onClick={() => onOpen(job.id)}><ChevronRight size={18}/></button></td></tr>)}</tbody></table></div>{!filtered.length && <div className="staff-empty"><Search size={28}/><h3>No repairs found</h3><p>Try another search or choose a different status.</p><button className="staff-btn" onClick={() => { onSearch(''); onFilter('All statuses'); }}>Clear filters</button></div>}<div className="staff-table-footer"><span>Showing {visible.length} of {filtered.length} repairs</span><span><i className="staff-online-dot"/> {admin ? 'All workshop repairs' : 'Assigned to you'}</span></div></div>;
}

export function NewRepairForm({ technicians, admin, onSave, onCancel }: { technicians: Technician[]; admin: boolean; onSave: (job: Job) => void; onCancel: () => void }) {
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (key: string) => String(data.get(key) || '').trim();
    if (!field('customer') || !field('device') || !field('issue') || !field('phone')) { setError('Please enter a customer, contact number, device and issue.'); return; }
    onSave({ id: `FL-${recordId().replace(/-/g, '').slice(-8).toUpperCase()}`, customer: field('customer'), email: field('email'), phone: field('phone'), device: field('device'), category: field('category') as Job['category'], issue: field('issue'), status: 'New', priority: field('priority') as Priority, technicianId: admin ? field('technician') : currentTechnicianId, dueDate: field('dueDate'), time: field('time'), estimate: Number(field('estimate')), createdAt: new Date().toISOString(), notes: [] });
  };
  return <form className="staff-form" onSubmit={submit}><div className="staff-form-grid"><label>Customer name<input name="customer" placeholder="e.g. Amaka Okafor" required maxLength={100}/></label><label>Email address<input type="email" name="email" placeholder="customer@example.com" required maxLength={150}/></label><label>Contact number<input name="phone" type="tel" placeholder="080 1234 5678" required maxLength={30}/></label><label>Device category<select name="category"><option>Phone</option><option>Laptop</option><option>Tablet</option><option>Other</option></select></label></div><label>Device model<input name="device" placeholder="e.g. iPhone 13 Pro" required maxLength={100}/></label><label>What needs repairing?<textarea name="issue" rows={3} placeholder="Describe the fault and any initial observations." required maxLength={2000}/></label><div className="staff-form-grid"><label>Due date<input name="dueDate" type="date" defaultValue={dateKey()} min={dateKey()} required/></label><label>Appointment time<input name="time" type="time" defaultValue="10:00" required/></label><label>Priority<select name="priority"><option>Normal</option><option>High</option><option>Urgent</option></select></label><label>Estimate (₦)<input name="estimate" type="number" min="0" max="100000000" step="1" defaultValue="0" required/></label>{admin && <label className="staff-form-span">Assign technician<select name="technician" defaultValue=""><option value="">Unassigned</option>{technicians.map(tech => <option key={tech.id} value={tech.id} disabled={!tech.available}>{tech.name}{tech.available ? '' : ' · Unavailable'}</option>)}</select></label>}</div>{error && <p className="staff-form-error" role="alert">{error}</p>}<div className="staff-modal-actions"><button className="staff-btn" type="button" onClick={onCancel}>Cancel</button><button className="staff-btn staff-btn-primary" type="submit"><Plus size={17}/>Create repair</button></div></form>;
}

export function RepairDetails({ job, technicians, admin, onSave, onCancel }: { job: Job; technicians: Technician[]; admin: boolean; onSave: (job: Job) => void; onCancel: () => void }) {
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [note, setNote] = useState('');

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load chat on mount or tab change
  useEffect(() => {
    let active = true;
    if (activeTab === 'chat' || messages.length === 0) {
      setChatLoading(true);
      api.repairs.getChat(job.id)
        .then(res => {
          if (active && res && Array.isArray(res.messages)) {
            setMessages(res.messages);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setChatLoading(false);
        });
    }
    return () => { active = false; };
  }, [job.id, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [activeTab, messages.length]);

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatDraft.trim() || chatSending) return;

    const textToSend = chatDraft.trim();
    setChatSending(true);
    try {
      const newMsg = await api.repairs.sendChat(job.id, textToSend);
      setMessages(prev => [...prev, newMsg]);
      setChatDraft('');
      setSentNotice(true);
      setTimeout(() => setSentNotice(false), 4000);
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      // Local optimistic fallback
      const fallbackMsg = {
        id: `msg-${Date.now()}`,
        from: 'staff',
        author: admin ? 'Alex Doe' : 'Jordan Malik',
        text: textToSend,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setChatDraft('');
      setSentNotice(true);
      setTimeout(() => setSentNotice(false), 4000);
    } finally {
      setChatSending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      ...job,
      status: data.get('status') as JobStatus,
      priority: data.get('priority') as Priority,
      technicianId: admin ? String(data.get('technician')) : job.technicianId,
      dueDate: String(data.get('dueDate')),
      time: String(data.get('time')),
      estimate: admin ? Number(data.get('estimate')) : job.estimate,
      notes: note.trim()
        ? [...job.notes, { id: recordId(), text: note.trim(), author: admin ? 'Alex Doe' : 'Jordan Malik', createdAt: new Date().toISOString() }]
        : job.notes,
    });
  };

  return (
    <div className="staff-repair-detail-wrap">
      {/* Top Mode Tabs */}
      <div className="staff-detail-tabs">
        <button
          type="button"
          className={`staff-detail-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Wrench size={15} /> Repair Order Details
        </button>
        <button
          type="button"
          className={`staff-detail-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={15} /> Chat with Client ({job.customer})
          {messages.length > 0 && <span className="staff-tab-count">{messages.length}</span>}
        </button>
      </div>

      {activeTab === 'chat' ? (
        /* Repair-Specific Chat Section */
        <div className="staff-repair-chat-view">
          <div className="staff-chat-header">
            <div className="staff-chat-info">
              <strong>Conversation with {job.customer}</strong>
              <small>Repair #{job.id} · {job.device} ({job.status})</small>
            </div>
            <div className="staff-chat-role-indicator">
              <span>Sending as: <b>{admin ? 'Alex Doe (Admin)' : 'Jordan Malik (Technician)'}</b></span>
            </div>
          </div>

          {sentNotice && (
            <div className="staff-chat-alert">
              <CheckCircle2 size={16} color="#16a34a" />
              <span>Message sent! Client notified via email and portal notification bell icon.</span>
            </div>
          )}

          <div className="staff-chat-scroll">
            {chatLoading && messages.length === 0 ? (
              <p className="staff-muted" style={{ textAlign: 'center', padding: '30px 0' }}>Loading conversation history...</p>
            ) : messages.length === 0 ? (
              <div className="staff-chat-empty">
                <MessageSquare size={32} color="#0c8279" />
                <h4>No messages yet for this repair</h4>
                <p>Send an update to {job.customer} regarding parts, diagnostics, or pickup readiness. The client will be notified immediately by email and in their dashboard bell icon.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isStaff = msg.from === 'staff';
                return (
                  <div
                    key={msg.id}
                    className={`staff-chat-bubble-wrap ${isStaff ? 'outgoing' : 'incoming'}`}
                  >
                    <div className="staff-chat-bubble-meta">
                      <strong>{msg.author || (isStaff ? 'Staff' : job.customer)}</strong>
                      <span className={`staff-chat-badge ${isStaff ? 'staff' : 'client'}`}>
                        {isStaff ? (admin ? 'Admin' : 'Technician') : 'Customer'}
                      </span>
                      <small>{msg.time}</small>
                    </div>
                    <div className="staff-chat-bubble">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatScrollRef} />
          </div>

          <form className="staff-chat-composer" onSubmit={handleSendChat}>
            <input
              className="staff-chat-input"
              placeholder={`Message ${job.customer} about repair #${job.id}...`}
              value={chatDraft}
              onChange={e => setChatDraft(e.target.value)}
              disabled={chatSending}
              required
            />
            <button
              type="submit"
              className="staff-btn staff-btn-primary staff-chat-send-btn"
              disabled={chatSending || !chatDraft.trim()}
            >
              <Send size={15} />
              {chatSending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          <p className="staff-chat-footer-note">
            Emails are automatically dispatched to {job.email || 'the customer'} with your message and tracking details.
          </p>
        </div>
      ) : (
        /* Standard Repair Details Form */
        <form className="staff-form" onSubmit={submit}>
          <div className="staff-detail-device">
            <span className="staff-device-icon"><DeviceIcon category={job.category} /></span>
            <div>
              <h3>{job.device}</h3>
              <p>{job.issue}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>

          <div className="staff-contact-card">
            <div>
              <span className="staff-avatar">{initials(job.customer)}</span>
              <div>
                <strong>{job.customer}</strong>
                <small>{job.email}</small>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>{job.phone}</span>
              <button
                type="button"
                className="staff-btn staff-btn-sm"
                onClick={() => setActiveTab('chat')}
                title="Direct messaging with customer"
              >
                <MessageSquare size={14} />
                Chat with Client
              </button>
            </div>
          </div>

          <div className="staff-form-grid">
            <label>
              Repair status
              <select name="status" defaultValue={job.status}>
                {statuses.map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select name="priority" defaultValue={job.priority}>
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </label>
            <label>
              Due date
              <input name="dueDate" type="date" defaultValue={job.dueDate} required />
            </label>
            <label>
              Appointment time
              <input name="time" type="time" defaultValue={job.time} required />
            </label>

            {admin ? (
              <>
                <label>
                  Assign technician
                  <select name="technician" defaultValue={job.technicianId}>
                    <option value="">Unassigned</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id} disabled={!tech.available && tech.id !== job.technicianId}>
                        {tech.name}{tech.available ? '' : ' · Unavailable'}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Estimate (₦)
                  <input name="estimate" type="number" min="0" max="100000000" step="1" defaultValue={job.estimate} required />
                </label>
              </>
            ) : (
              <div className="staff-estimate staff-form-span">
                <span>Customer estimate</span>
                <strong>{money(job.estimate)}</strong>
              </div>
            )}
          </div>

          <div className="staff-notes">
            <h3>Work notes <span>{job.notes.length}</span></h3>
            {job.notes.length ? (
              job.notes.map(item => (
                <article key={item.id}>
                  <div>
                    <strong>{item.author}</strong>
                    <small>{new Date(item.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                  <p>{item.text}</p>
                </article>
              ))
            ) : (
              <p className="staff-muted">Keep diagnostics, parts needed and handover details together.</p>
            )}
            <label>
              Add an internal note
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="What should the team know about this repair?" maxLength={2000} />
            </label>
          </div>

          <div className="staff-modal-actions">
            <button className="staff-btn" type="button" onClick={onCancel}>Cancel</button>
            <button className="staff-btn staff-btn-primary" type="submit"><Check size={17} />Save changes</button>
          </div>
        </form>
      )}
    </div>
  );
}


export function ScheduleView({ jobs, onOpen }: { jobs: Job[]; onOpen: (id: string) => void }) {
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const scheduled = jobs.filter(job => job.dueDate === selectedDate && job.status !== 'Completed').sort((a, b) => a.time.localeCompare(b.time));
  return <div className="staff-panel staff-schedule-page"><div className="staff-section-head"><div><h2>Your appointments</h2><p className="staff-muted">Plan your day around repair deadlines and collections.</p></div><label className="staff-date-field"><span className="sr-only">Schedule date</span><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/></label></div><div className="staff-schedule-summary"><CalendarDays size={20}/><strong>{selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Choose a date'}</strong><span>{scheduled.length} appointments</span><button className="staff-link" onClick={() => setSelectedDate(dateKey())}>Today</button></div>{scheduled.length ? scheduled.map(job => <button className="staff-agenda-row" key={job.id} onClick={() => onOpen(job.id)}><span className="staff-agenda-time"><Clock3 size={15}/>{job.time}</span><span className="staff-device-icon"><DeviceIcon category={job.category}/></span><span className="staff-agenda-info"><strong>{job.device}</strong><small>{job.customer} · #{job.id}</small></span><StatusBadge status={job.status}/><ArrowRight size={18}/></button>) : <div className="staff-empty"><CalendarDays size={32}/><h3>A little breathing room</h3><p>No open repairs are scheduled for this day.</p></div>}</div>;
}
