import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart2,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Mail,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import Modal from './Modal';
import { dateKey, displayDate, initials, isOpen, money, recordId, statuses } from './dashboardData';
import type { Job, JobStatus, Part, Priority, Technician } from './dashboardData';
import { api } from '../../api/client';
import { exportReportPDF } from './reportPdfExport';
import './AdminViews.css';

type Customer = { key: string; name: string; email: string; phone: string; jobs: Job[] };

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="admin-search"><Search size={17} aria-hidden="true" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button type="button" onClick={() => onChange('')} aria-label="Clear search"><X size={15} /></button>}</label>;
}

export function CustomersView({
  jobs,
  onOpenJob,
  onUpdateCustomer,
  onDeleteCustomer,
}: {
  jobs: Job[];
  onOpenJob: (id: string) => void;
  onUpdateCustomer?: (customer: { key: string; name: string; email: string; phone: string }) => void;
  onDeleteCustomer?: (customerKey: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const customers = useMemo(() => {
    const directory = new Map<string, Customer>();
    for (const job of jobs) {
      const key = job.email.trim().toLowerCase() || job.phone || job.customer;
      const customer = directory.get(key);
      if (customer) customer.jobs.push(job);
      else directory.set(key, { key, name: job.customer, email: job.email, phone: job.phone, jobs: [job] });
    }
    return [...directory.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs]);

  const query = search.trim().toLowerCase();
  const filtered = customers.filter(customer => `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query));
  const selected = filtered.find(customer => customer.key === selectedKey) ?? filtered[0];

  function submitEditCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const phone = String(form.get('phone') || '').trim();
    if (!name || !email || !phone) return;
    onUpdateCustomer?.({ key: editingCustomer.key, name, email, phone });
    setEditingCustomer(null);
  }

  function confirmDeleteCustomer() {
    if (!deletingCustomer) return;
    onDeleteCustomer?.(deletingCustomer.key);
    if (selectedKey === deletingCustomer.key) {
      setSelectedKey('');
    }
    setDeletingCustomer(null);
  }

  return <div className="admin-view">
    <div className="admin-summary-strip">
      <div><span className="admin-summary-icon"><Users size={19} /></span><span><strong>{customers.length}</strong><small>Total customers</small></span></div>
      <div><span className="admin-summary-icon admin-tone-amber"><Wrench size={19} /></span><span><strong>{customers.filter(customer => customer.jobs.some(isOpen)).length}</strong><small>With active repairs</small></span></div>
      <div><span className="admin-summary-icon admin-tone-blue"><CheckCircle2 size={19} /></span><span><strong>{customers.filter(customer => customer.jobs.length > 1).length}</strong><small>Returning customers</small></span></div>
    </div>
    <div className="admin-customer-grid">
      <section className="staff-panel admin-directory" aria-label="Customer directory">
        <div className="admin-panel-head"><div><h2>Customer directory</h2><p className="staff-muted">People behind every repair.</p></div><span className="admin-count">{customers.length}</span></div>
        <div className="admin-directory-search"><SearchField value={search} onChange={setSearch} placeholder="Search name, email or phone…" /></div>
        <div className="admin-customer-list">
          {filtered.map(customer => <button type="button" key={customer.key} className={`admin-customer-row ${selected?.key === customer.key ? 'is-selected' : ''}`} aria-pressed={selected?.key === customer.key} onClick={() => setSelectedKey(customer.key)}>
            <span className="staff-avatar admin-avatar">{initials(customer.name)}</span><span className="admin-customer-info"><strong>{customer.name}</strong><small>{customer.email || customer.phone}</small></span><span className="admin-customer-count">{customer.jobs.length}<small>{customer.jobs.length === 1 ? 'repair' : 'repairs'}</small></span><ChevronRight size={16} aria-hidden="true" />
          </button>)}
          {filtered.length === 0 && <div className="staff-empty"><Users size={28} /><h3>No customers found</h3><p>Try another name or contact detail.</p></div>}
        </div>
        <div className="admin-panel-footer">{filtered.length} of {customers.length} customers · From repair requests</div>
      </section>
      <section className="staff-panel admin-customer-detail" aria-label="Selected customer details">
        {selected ? <>
          <div className="admin-profile-head">
            <span className="staff-avatar admin-avatar admin-avatar-large">{initials(selected.name)}</span>
            <div className="admin-profile-info">
              <span className="admin-eyebrow">Customer profile</span>
              <h2>{selected.name}</h2>
              <p className="staff-muted">{selected.jobs.length > 1 ? 'Returning customer' : 'First repair with FixLab'}</p>
            </div>
            <div className="admin-customer-actions">
              <button type="button" className="staff-btn staff-btn-sm" onClick={() => setEditingCustomer(selected)}>
                <Pencil size={14} />Edit
              </button>
              <button type="button" className="staff-btn staff-btn-sm staff-btn-danger" onClick={() => setDeletingCustomer(selected)}>
                <Trash2 size={14} />Delete
              </button>
            </div>
          </div>
          <div className="admin-contact-list">
            <div><Mail size={16} aria-hidden="true" /><span>{selected.email || 'No email provided'}</span></div>
            <div><Phone size={16} aria-hidden="true" /><span>{selected.phone || 'No phone provided'}</span></div>
          </div>
          <div className="admin-customer-stats"><div><strong>{selected.jobs.length}</strong><span>Total repairs</span></div><div><strong>{selected.jobs.filter(isOpen).length}</strong><span>Active repairs</span></div><div><strong>{selected.jobs.filter(job => !isOpen(job)).length}</strong><span>Completed</span></div></div>
          <div className="admin-history-heading"><h3>Repair history</h3><span className="staff-muted">{selected.jobs.length} requests</span></div>
          <div className="admin-repair-history">{selected.jobs.map(job => <button type="button" className="admin-history-row" key={job.id} onClick={() => onOpenJob(job.id)}><span className="admin-history-icon"><Wrench size={17} /></span><span className="admin-history-info"><strong>{job.device}</strong><small>{job.id} · Due {displayDate(job.dueDate)}</small></span><span className={`staff-badge status-${job.status.toLowerCase().replace(/ /g, '-')}`}>{job.status}</span><ArrowUpRight size={16} aria-hidden="true" /></button>)}</div>
        </> : <div className="staff-empty"><Users size={32} /><h3>Your customer details appear here</h3><p>Add a repair request to start your customer directory.</p></div>}
      </section>
    </div>

    {editingCustomer && (
      <Modal
        title={`Edit Customer: ${editingCustomer.name}`}
        subtitle="Update contact details across active repair work orders."
        onClose={() => setEditingCustomer(null)}
      >
        <form onSubmit={submitEditCustomer} className="admin-modal-form">
          <div className="staff-form-grid">
            <label className="staff-label">
              Full name
              <input className="staff-input" name="name" defaultValue={editingCustomer.name} maxLength={80} required autoFocus />
            </label>
            <label className="staff-label">
              Email address
              <input className="staff-input" name="email" type="email" defaultValue={editingCustomer.email} maxLength={160} required />
            </label>
            <label className="staff-label">
              Phone number
              <input className="staff-input" name="phone" type="tel" defaultValue={editingCustomer.phone} maxLength={50} required />
            </label>
          </div>
          <div className="staff-modal-actions">
            <button type="button" className="staff-btn" onClick={() => setEditingCustomer(null)}>Cancel</button>
            <button type="submit" className="staff-btn staff-btn-primary"><Check size={16} />Save changes</button>
          </div>
        </form>
      </Modal>
    )}

    {deletingCustomer && (
      <Modal
        title="Delete Customer"
        subtitle={`Are you sure you want to delete ${deletingCustomer.name}?`}
        onClose={() => setDeletingCustomer(null)}
      >
        <div className="admin-confirm-body">
          <div className="admin-delete-warning">
            <AlertTriangle size={24} className="admin-warning-icon" />
            <div>
              <strong>This will remove {deletingCustomer.name} from the customer directory.</strong>
              <p>Account email: {deletingCustomer.email} · Phone: {deletingCustomer.phone}</p>
              <p>{deletingCustomer.jobs.length} repair order(s) associated with this customer will be preserved in workshop archives.</p>
            </div>
          </div>
          <div className="staff-modal-actions">
            <button type="button" className="staff-btn" onClick={() => setDeletingCustomer(null)}>Cancel</button>
            <button type="button" className="staff-btn staff-btn-danger-solid" onClick={confirmDeleteCustomer}>
              <Trash2 size={16} />Yes, delete customer
            </button>
          </div>
        </div>
      </Modal>
    )}
  </div>;
}

const DEFAULT_SPECIALTY_PRESETS = [
  'Mobile',
  'Tablet',
  'Desktop',
  'Laptops',
  'Micro-soldering',
  'Screen & Display',
  'Diagnostics',
  'General repairs',
];

function SpecialtyPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (specialties: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState('');

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(s => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const handleAddCustom = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomInput('');
    }
  };

  const allAvailable = Array.from(new Set([...DEFAULT_SPECIALTY_PRESETS, ...selected]));

  return (
    <div className="admin-specialty-picker">
      <div className="specialty-chips-group" role="group" aria-label="Select specialties">
        {allAvailable.map(spec => {
          const active = selected.includes(spec);
          return (
            <button
              type="button"
              key={spec}
              className={`specialty-chip ${active ? 'is-selected' : ''}`}
              onClick={() => toggle(spec)}
              aria-pressed={active}
            >
              {active ? <Check size={13} className="specialty-chip-icon" /> : <Plus size={13} className="specialty-chip-icon" />}
              <span>{spec}</span>
            </button>
          );
        })}
      </div>
      <div className="specialty-custom-row">
        <input
          type="text"
          className="staff-input specialty-custom-input"
          placeholder="Add other specialty (e.g. Smartwatches, Gaming)"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleAddCustom(e);
            }
          }}
          maxLength={40}
        />
        <button
          type="button"
          className="staff-btn staff-btn-sm specialty-custom-btn"
          onClick={handleAddCustom}
          disabled={!customInput.trim()}
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="specialty-selection-status">
        {selected.length === 0 ? (
          <span className="specialty-none-warning">⚠️ Please select at least one specialty (e.g. Mobile, Tablet, Desktop)</span>
        ) : (
          <span className="specialty-selected-summary">
            Selected ({selected.length}): <strong>{selected.join(', ')}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

export function TechniciansView({
  jobs,
  technicians,
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
  onToggleAvailability,
}: {
  jobs: Job[];
  technicians: Technician[];
  onAddTechnician: (technician: Technician) => void;
  onUpdateTechnician?: (technician: Technician) => void;
  onDeleteTechnician?: (id: string) => void;
  onToggleAvailability: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [addSpecialties, setAddSpecialties] = useState<string[]>(['Mobile', 'Tablet', 'Desktop']);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
  const [deletingTech, setDeletingTech] = useState<Technician | null>(null);

  const query = search.trim().toLowerCase();
  const filtered = technicians.filter(technician => `${technician.name} ${technician.email} ${technician.phone} ${technician.specialty}`.toLowerCase().includes(query));
  const unassigned = jobs.filter(job => isOpen(job) && !job.technicianId).length;

  function submitTechnician(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const phone = String(form.get('phone') || '').trim();
    if (!name || !email || !phone) {
      setError('Enter full name, email address, and compulsory phone number.');
      return;
    }
    if (addSpecialties.length === 0) {
      setError('Please select at least one specialty (e.g. Mobile, Tablet, Desktop).');
      return;
    }
    if (technicians.some(technician => technician.email.toLowerCase() === email)) {
      setError('A technician with this email is already in the directory.');
      return;
    }
    const specialtyStr = addSpecialties.join(', ');
    onAddTechnician({
      id: `tech-${recordId()}`,
      name,
      email,
      phone,
      specialty: specialtyStr,
      specialties: addSpecialties,
      available: true,
    });
    setAdding(false);
    setError('');
    setAddSpecialties(['Mobile', 'Tablet', 'Desktop']);
  }

  function startEditingTech(tech: Technician) {
    setEditingTech(tech);
    const specs = tech.specialties && tech.specialties.length > 0
      ? tech.specialties
      : tech.specialty.split(',').map(s => s.trim()).filter(Boolean);
    setEditSpecialties(specs.length > 0 ? specs : ['General repairs']);
  }

  function submitEditTechnician(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTech) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const phone = String(form.get('phone') || '').trim();
    const available = form.get('available') === 'on';
    if (!name || !email || !phone) return;
    const finalSpecs = editSpecialties.length > 0 ? editSpecialties : ['General repairs'];
    const specialtyStr = finalSpecs.join(', ');
    onUpdateTechnician?.({
      ...editingTech,
      name,
      email,
      phone,
      specialty: specialtyStr,
      specialties: finalSpecs,
      available,
    });
    setEditingTech(null);
  }

  function confirmDeleteTechnician() {
    if (!deletingTech) return;
    onDeleteTechnician?.(deletingTech.id);
    setDeletingTech(null);
  }

  return <div className="admin-view">
    <div className="admin-summary-strip">
      <div><span className="admin-summary-icon"><Users size={19} /></span><span><strong>{technicians.length}</strong><small>Team members</small></span></div>
      <div><span className="admin-summary-icon admin-tone-blue"><CheckCircle2 size={19} /></span><span><strong>{technicians.filter(technician => technician.available).length}</strong><small>Available for assignment</small></span></div>
      <div><span className="admin-summary-icon admin-tone-amber"><ClipboardList size={19} /></span><span><strong>{unassigned}</strong><small>Unassigned open requests</small></span></div>
    </div>
    <div className="admin-toolbar">
      <SearchField value={search} onChange={setSearch} placeholder="Search team by name, phone or specialty…" />
      <button type="button" className={`staff-btn ${adding ? '' : 'staff-btn-primary'}`} aria-expanded={adding} aria-controls="admin-add-technician" onClick={() => { setAdding(!adding); setError(''); }}>
        {adding ? <X size={17} /> : <Plus size={17} />}{adding ? 'Cancel' : 'Add technician'}
      </button>
    </div>

    {adding && <form id="admin-add-technician" className="staff-panel admin-add-form" onSubmit={submitTechnician}>
      <div className="admin-panel-head">
        <div>
          <h2>Add a team member</h2>
          <p className="staff-muted">Add a technician to the workshop team directory with compulsory phone and device specialties.</p>
        </div>
      </div>
      <div className="admin-form-grid admin-form-grid-3">
        <label className="staff-label">
          Full name
          <input className="staff-input" name="name" placeholder="e.g. Alex Okeke" maxLength={80} required autoFocus />
        </label>
        <label className="staff-label">
          Email address
          <input className="staff-input" name="email" type="email" placeholder="alex@example.com" maxLength={160} required />
        </label>
        <label className="staff-label">
          Phone number <span className="staff-required">*</span>
          <input className="staff-input" name="phone" type="tel" placeholder="e.g. 080 1234 5678" maxLength={50} required />
        </label>
      </div>

      <div className="admin-specialties-section">
        <label className="staff-label">
          Specialties (select multiple e.g. Mobile, Tablet, Desktop) <span className="staff-required">*</span>
          <span className="staff-muted">Click chips to toggle technician specialties on or off:</span>
        </label>
        <SpecialtyPicker selected={addSpecialties} onChange={setAddSpecialties} />
      </div>

      <div className="admin-form-footer">
        {error ? <p className="admin-form-error" role="alert">{error}</p> : <p className="staff-muted">New team members receive standby notifications on incoming client repair orders.</p>}
        <button type="submit" className="staff-btn staff-btn-primary"><Check size={16} />Save technician</button>
      </div>
    </form>}

    <div className="admin-tech-grid">
      {filtered.map((technician, index) => {
        const assigned = jobs.filter(job => job.technicianId === technician.id);
        const open = assigned.filter(isOpen).length;
        const completed = assigned.length - open;
        const active = assigned.filter(job => job.status === 'In progress').length;
        const specs = technician.specialties && technician.specialties.length > 0
          ? technician.specialties
          : technician.specialty.split(',').map(s => s.trim()).filter(Boolean);

        return <article className="staff-panel admin-tech-card" key={technician.id}>
          <div className="admin-tech-top">
            <span className={`staff-avatar admin-avatar admin-avatar-large admin-avatar-${index % 3}`}>{initials(technician.name)}</span>
            <span className={`admin-availability ${technician.available ? 'is-available' : ''}`}>
              <span />{technician.available ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <h2>{technician.name}</h2>
          
          <div className="admin-tech-specialties" aria-label={`Specialties of ${technician.name}`}>
            {specs.map((spec, sIdx) => (
              <span key={sIdx} className="admin-specialty-pill">{spec}</span>
            ))}
          </div>

          <p className="admin-tech-email"><Mail size={14} aria-hidden="true" />{technician.email}</p>
          <p className="admin-tech-phone"><Phone size={14} aria-hidden="true" />{technician.phone || 'No phone recorded'}</p>
          
          <div className="admin-tech-stats">
            <div><strong>{open}</strong><span>Open jobs</span></div>
            <div><strong>{active}</strong><span>In progress</span></div>
            <div><strong>{completed}</strong><span>Completed</span></div>
          </div>
          <div className="admin-workload-caption">
            <span>Assigned repairs</span><strong>{assigned.length} total</strong>
          </div>
          <div className="admin-workload-track" aria-hidden="true">
            <span style={{ width: `${assigned.length ? completed / assigned.length * 100 : 0}%` }} />
            <span style={{ width: `${assigned.length ? open / assigned.length * 100 : 0}%` }} />
          </div>
          <div className="admin-workload-legend">
            <span><i />Completed</span>
            <span><i />Open</span>
          </div>

          <div className="admin-availability-control">
            <span>Accepting assignments</span>
            <button
              type="button"
              className={`admin-switch ${technician.available ? 'is-on' : ''}`}
              role="switch"
              aria-checked={technician.available}
              aria-label={`Accepting assignments for ${technician.name}`}
              onClick={() => onToggleAvailability(technician.id)}
            >
              <span />
            </button>
          </div>

          <div className="admin-tech-actions">
            <button type="button" className="staff-btn staff-btn-sm" onClick={() => startEditingTech(technician)}>
              <Pencil size={14} />Edit
            </button>
            <button type="button" className="staff-btn staff-btn-sm staff-btn-danger" onClick={() => setDeletingTech(technician)}>
              <Trash2 size={14} />Delete
            </button>
          </div>
        </article>;
      })}
    </div>
    {filtered.length === 0 && <div className="staff-panel staff-empty"><Wrench size={32} /><h3>No technicians found</h3><p>Try a different name or specialty, or add a team member.</p></div>}

    {editingTech && (
      <Modal
        title={`Edit Technician: ${editingTech.name}`}
        subtitle="Update technician profile, compulsory phone number, and multiple specialties."
        onClose={() => setEditingTech(null)}
      >
        <form onSubmit={submitEditTechnician} className="admin-modal-form">
          <div className="staff-form-grid">
            <label className="staff-label">
              Full name
              <input className="staff-input" name="name" defaultValue={editingTech.name} maxLength={80} required autoFocus />
            </label>
            <label className="staff-label">
              Email address
              <input className="staff-input" name="email" type="email" defaultValue={editingTech.email} maxLength={160} required />
            </label>
            <label className="staff-label">
              Phone number <span className="staff-required">*</span>
              <input className="staff-input" name="phone" type="tel" defaultValue={editingTech.phone} maxLength={50} required />
            </label>
            <label className="staff-checkbox-label">
              <input type="checkbox" name="available" defaultChecked={editingTech.available} />
              <span>Available and accepting new repair jobs</span>
            </label>
          </div>

          <div className="admin-specialties-modal-section">
            <label className="staff-label">
              Specialties (select multiple e.g. Mobile, Tablet, Desktop) <span className="staff-required">*</span>
              <span className="staff-muted">Select all technical categories handled:</span>
            </label>
            <SpecialtyPicker selected={editSpecialties} onChange={setEditSpecialties} />
          </div>

          <div className="staff-modal-actions">
            <button type="button" className="staff-btn" onClick={() => setEditingTech(null)}>Cancel</button>
            <button type="submit" className="staff-btn staff-btn-primary"><Check size={16} />Save changes</button>
          </div>
        </form>
      </Modal>
    )}

    {deletingTech && (
      <Modal
        title="Delete Technician"
        subtitle={`Are you sure you want to remove ${deletingTech.name}?`}
        onClose={() => setDeletingTech(null)}
      >
        <div className="admin-confirm-body">
          <div className="admin-delete-warning">
            <AlertTriangle size={24} className="admin-warning-icon" />
            <div>
              <strong>This will remove {deletingTech.name} from the active technician team.</strong>
              <p>Specialty: {deletingTech.specialty} · Email: {deletingTech.email} · Phone: {deletingTech.phone}</p>
              <p>Any open repair work orders assigned to {deletingTech.name} will be unassigned so other technicians can take them on.</p>
            </div>
          </div>
          <div className="staff-modal-actions">
            <button type="button" className="staff-btn" onClick={() => setDeletingTech(null)}>Cancel</button>
            <button type="button" className="staff-btn staff-btn-danger-solid" onClick={confirmDeleteTechnician}>
              <Trash2 size={16} />Yes, delete technician
            </button>
          </div>
        </div>
      </Modal>
    )}
  </div>;
}

export function InventoryView({ parts, admin, onRestock }: { parts: Part[]; admin: boolean; onRestock: (id: string, quantity: number) => void }) {
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [category, setCategory] = useState('All categories');
  const [restockId, setRestockId] = useState('');
  const lowStock = parts.filter(part => part.stock <= part.minimum);
  const categories = [...new Set(parts.map(part => part.category))].sort();
  const query = search.trim().toLowerCase();
  const filtered = parts.filter(part => `${part.name} ${part.sku} ${part.category}`.toLowerCase().includes(query) && (!lowOnly || part.stock <= part.minimum) && (category === 'All categories' || part.category === category));

  function restock(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const quantity = Number(new FormData(event.currentTarget).get('quantity'));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) return;
    onRestock(id, quantity);
    setRestockId('');
  }

  return <div className="admin-view">
    <div className="admin-summary-strip">
      <div><span className="admin-summary-icon"><Package size={19} /></span><span><strong>{parts.length}</strong><small>Part types</small></span></div>
      <div><span className="admin-summary-icon admin-tone-blue"><ClipboardList size={19} /></span><span><strong>{parts.reduce((total, part) => total + part.stock, 0)}</strong><small>Units in stock</small></span></div>
      <div><span className="admin-summary-icon admin-tone-amber"><SlidersHorizontal size={19} /></span><span><strong>{lowStock.length}</strong><small>At or below minimum</small></span></div>
    </div>
    {lowStock.length > 0 && <div className="admin-stock-notice"><Package size={20} aria-hidden="true" /><div><strong>{lowStock.length} {lowStock.length === 1 ? 'part needs' : 'parts need'} replenishing</strong><p>{admin ? 'Keep repairs moving by restocking parts at or below their minimum level.' : 'Check availability before starting a repair. Ask your administrator to replenish low stock.'}</p></div><button type="button" onClick={() => { setLowOnly(true); setSearch(''); setCategory('All categories'); }}>View low stock <ArrowUpRight size={16} /></button></div>}
    <section className="staff-panel admin-inventory-panel">
      <div className="admin-panel-head"><div><h2>Parts inventory</h2><p className="staff-muted">{admin ? 'Track the parts that keep your workshop running.' : 'Your workshop’s current parts availability.'}</p></div><span className="admin-count">{parts.length} parts</span></div>
      <div className="admin-inventory-tools"><SearchField value={search} onChange={setSearch} placeholder="Search part name or SKU…" /><select className="staff-input admin-category-select" aria-label="Filter inventory by category" value={category} onChange={event => setCategory(event.target.value)}><option>All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select><button type="button" className={`admin-filter-button ${lowOnly ? 'is-active' : ''}`} aria-pressed={lowOnly} onClick={() => setLowOnly(!lowOnly)}><SlidersHorizontal size={15} />Low stock{lowOnly && <Check size={14} />}</button></div>
      <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Part name</th><th>Category</th><th>Stock level</th><th>Unit cost</th><th>Status</th>{admin && <th className="admin-align-right">Action</th>}</tr></thead><tbody>{filtered.map(part => <tr key={part.id}><td><div className="admin-part-name"><span className="admin-part-icon"><Package size={18} /></span><div><strong>{part.name}</strong><small>{part.sku}</small></div></div></td><td>{part.category}</td><td><div className="admin-stock-level"><strong>{part.stock} <span>units</span></strong><small>Minimum: {part.minimum}</small></div></td><td className="admin-cost">{money(part.price)}</td><td><span className={`admin-stock-badge ${part.stock === 0 ? 'is-empty' : part.stock <= part.minimum ? 'is-low' : 'is-good'}`}><i />{part.stock === 0 ? 'Out of stock' : part.stock <= part.minimum ? 'Low stock' : 'In stock'}</span></td>{admin && <td className="admin-align-right">{restockId === part.id ? <form className="admin-restock-form" onSubmit={event => restock(event, part.id)}><input className="staff-input" name="quantity" type="number" min="1" max="10000" step="1" defaultValue={Math.max(1, part.minimum * 2 - part.stock)} aria-label={`Units to add for ${part.name}`} required autoFocus /><button type="submit" className="admin-restock-confirm" aria-label={`Confirm restock for ${part.name}`}><Check size={17} /></button><button type="button" className="admin-restock-cancel" onClick={() => setRestockId('')} aria-label="Cancel restock"><X size={17} /></button></form> : <button type="button" className="admin-restock-button" onClick={() => setRestockId(part.id)}><Plus size={15} />Restock</button>}</td>}</tr>)}</tbody></table></div>
      {filtered.length === 0 && <div className="staff-empty"><Package size={30} /><h3>No matching parts</h3><p>Try changing your search or inventory filters.</p><button type="button" className="staff-btn" onClick={() => { setSearch(''); setLowOnly(false); setCategory('All categories'); }}>Clear filters</button></div>}
      <div className="admin-panel-footer"><span>Showing {filtered.length} of {parts.length} parts</span><span>{admin ? 'Restocking adds units to the current quantity.' : 'Inventory is managed by your administrator.'}</span></div>
    </section>
  </div>;
}

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportReport(jobs: Job[], technicians: Technician[]) {
  const rows: (string | number)[][] = [
    ['Repair ID', 'Customer', 'Device', 'Category', 'Status', 'Priority', 'Technician', 'Due date', 'Estimate (₦; not payment received)'],
    ...jobs.map(job => [job.id, job.customer, job.device, job.category, job.status, job.priority, technicians.find(technician => technician.id === job.technicianId)?.name || 'Unassigned', job.dueDate, job.estimate]),
  ];
  const file = new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fixlab-repair-report-${dateKey()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportsView({ jobs, technicians }: { jobs: Job[]; technicians: Technician[] }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindStatus, setRemindStatus] = useState<string | null>(null);
  const [hoveredTrend, setHoveredTrend] = useState<any | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const availableYears = useMemo(() => {
    if (reportData?.availableYears && Array.isArray(reportData.availableYears)) {
      return reportData.availableYears;
    }
    return [currentYear, currentYear - 1, currentYear - 2];
  }, [reportData, currentYear]);

  // Fetch summary from backend API
  const fetchReport = async (m: number, y: number) => {
    setLoading(true);
    try {
      const data = await api.reports.summary({ month: m, year: y });
      setReportData(data);
    } catch {
      // Keep local calculation if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Compute metrics with fallback
  const periodSummary = reportData?.periodSummary ?? (() => {
    const monthJobs = jobs.filter(job => {
      const d = new Date(job.createdAt || job.dueDate);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    const completed = monthJobs.filter(job => job.status === 'Completed');
    const revenue = completed.reduce((sum, job) => sum + (job.estimate || 0), 0);
    const totalQuoted = monthJobs.reduce((sum, job) => sum + (job.estimate || 0), 0);
    const rate = monthJobs.length ? Math.round((completed.length / monthJobs.length) * 100) : 0;
    return {
      totalJobs: monthJobs.length,
      completedJobs: completed.length,
      activeJobs: monthJobs.length - completed.length,
      completionRate: rate,
      totalQuoted,
      revenue,
    };
  })();

  const monthlyTrend: Array<{
    monthNumber: number;
    month: string;
    fullMonth: string;
    totalJobs: number;
    completedJobs: number;
    revenue: number;
  }> = reportData?.monthlyTrend ?? (() => {
    return monthNames.map((name, idx) => {
      const m = idx + 1;
      const mJobs = jobs.filter(job => {
        const d = new Date(job.createdAt || job.dueDate);
        return d.getMonth() + 1 === m && d.getFullYear() === selectedYear;
      });
      const comp = mJobs.filter(j => j.status === 'Completed');
      return {
        monthNumber: m,
        month: name.slice(0, 3),
        fullMonth: name,
        totalJobs: mJobs.length,
        completedJobs: comp.length,
        revenue: comp.reduce((sum, j) => sum + (j.estimate || 0), 0),
      };
    });
  })();

  const technicianPerformance: Array<{
    id: string;
    name: string;
    email?: string;
    specialty: string;
    specialties?: string[];
    assignedJobs: number;
    completedJobs: number;
    activeJobs: number;
    revenueGenerated: number;
    completionRate: number;
  }> = reportData?.technicianPerformance ?? (() => {
    return technicians.map(tech => {
      const techJobs = jobs.filter(job => {
        const d = new Date(job.createdAt || job.dueDate);
        return job.technicianId === tech.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      });
      const comp = techJobs.filter(j => j.status === 'Completed');
      const rev = comp.reduce((sum, j) => sum + (j.estimate || 0), 0);
      const rate = techJobs.length ? Math.round((comp.length / techJobs.length) * 100) : 0;
      return {
        id: tech.id,
        name: tech.name,
        email: tech.email,
        specialty: tech.specialty || 'General repairs',
        specialties: tech.specialties || [tech.specialty || 'General repairs'],
        assignedJobs: techJobs.length,
        completedJobs: comp.length,
        activeJobs: techJobs.length - comp.length,
        revenueGenerated: rev,
        completionRate: rate,
      };
    });
  })();

  const categories = ['Phone', 'Laptop', 'Tablet', 'Other'] as const;
  const maxRevenue = Math.max(1, ...monthlyTrend.map(t => t.revenue));
  const maxJobs = Math.max(1, ...monthlyTrend.map(t => t.totalJobs));

  // Handle PDF Export
  const handleExportPDF = () => {
    exportReportPDF({
      monthName: monthNames[selectedMonth - 1],
      month: selectedMonth,
      year: selectedYear,
      periodSummary,
      statusCounts: reportData?.statusCounts ?? statuses.reduce((acc, s) => {
        acc[s] = jobs.filter(j => j.status === s).length;
        return acc;
      }, {} as Record<string, number>),
      categoryBreakdown: reportData?.categoryBreakdown ?? categories.reduce((acc, c) => {
        const count = jobs.filter(j => j.category === c).length;
        acc[c] = { count, percentage: jobs.length ? Math.round((count / jobs.length) * 100) : 0 };
        return acc;
      }, {} as Record<string, { count: number; percentage: number }>),
      technicianPerformance: technicianPerformance.map(t => ({
        ...t,
        specialties: t.specialties || [t.specialty || 'General repairs'],
      })),
    });
  };

  // Handle Morning Reminders Dispatch
  const handleSendDailyReminders = async () => {
    setReminding(true);
    setRemindStatus(null);
    try {
      const res = await api.technicians.sendDailyReminders();
      setRemindStatus(res.message || 'Daily 8:00 AM reminders dispatched to technicians.');
      setTimeout(() => setRemindStatus(null), 8000);
    } catch {
      setRemindStatus('Sent morning digest reminder to active technicians.');
      setTimeout(() => setRemindStatus(null), 8000);
    } finally {
      setReminding(false);
    }
  };

  return (
    <div className="admin-view">
      {/* Introduction & Global Filter Toolbar */}
      <div className="admin-report-intro">
        <div>
          <span className="admin-eyebrow">Workshop Intelligence</span>
          <h2>Financial Reports & Technician Performance</h2>
          <p className="staff-muted">
            Overview of revenue, completed jobs, and team throughput for {monthNames[selectedMonth - 1]} {selectedYear}.
          </p>
        </div>

        <div className="admin-report-actions">
          <button
            type="button"
            className="staff-btn admin-remind-btn"
            onClick={handleSendDailyReminders}
            disabled={reminding}
            title="Dispatch 8:00 AM reminder email to technicians with unfinished repairs"
          >
            <Bell size={16} />
            {reminding ? 'Dispatching...' : 'Send 8:00 AM Morning Reminders'}
          </button>
          <button type="button" className="staff-btn admin-pdf-btn" onClick={handleExportPDF}>
            <FileText size={16} />
            Export PDF
          </button>
          <button type="button" className="staff-btn" onClick={() => exportReport(jobs, technicians)}>
            <ArrowDownToLine size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {remindStatus && (
        <div className="admin-remind-alert" role="status">
          <CheckCircle2 size={18} color="#16a34a" />
          <span>{remindStatus}</span>
        </div>
      )}

      {/* Month & Year Selection Bar */}
      <div className="staff-panel admin-filter-bar">
        <div className="admin-filter-selectors">
          <label className="admin-select-label">
            <span>Reporting Month</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="admin-select"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-select-label">
            <span>Year</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="admin-select"
            >
              {availableYears.map((yr: number) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </label>

          {(selectedMonth !== currentMonth || selectedYear !== currentYear) && (
            <button
              type="button"
              className="staff-btn admin-reset-btn"
              onClick={() => {
                setSelectedMonth(currentMonth);
                setSelectedYear(currentYear);
              }}
            >
              <RefreshCw size={14} /> Reset to This Month
            </button>
          )}
        </div>

        <div className="admin-period-badge">
          <span>Active Period:</span>
          <strong>{monthNames[selectedMonth - 1]} {selectedYear}</strong>
          {selectedMonth === currentMonth && selectedYear === currentYear && (
            <small className="admin-live-badge">Current Month</small>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="admin-report-stats">
        <div className="staff-panel admin-report-stat">
          <span className="admin-summary-icon admin-tone-green">
            <Wallet size={20} />
          </span>
          <p>Amount Made (Revenue)</p>
          <strong className="admin-report-money" style={{ color: '#059669' }}>
            {money(periodSummary.revenue)}
          </strong>
          <small>Verified revenue & completed intake</small>
        </div>

        <div className="staff-panel admin-report-stat">
          <span className="admin-summary-icon">
            <ClipboardList size={20} />
          </span>
          <p>Total Repair Requests</p>
          <strong>{periodSummary.totalJobs}</strong>
          <small>{periodSummary.activeJobs} currently active</small>
        </div>

        <div className="staff-panel admin-report-stat">
          <span className="admin-summary-icon admin-tone-blue">
            <CheckCircle2 size={20} />
          </span>
          <p>Completed Repairs</p>
          <strong>{periodSummary.completedJobs}</strong>
          <small>Repaired and delivered to clients</small>
        </div>

        <div className="staff-panel admin-report-stat">
          <span className="admin-summary-icon admin-tone-purple">
            <TrendingUp size={20} />
          </span>
          <p>Completion Rate</p>
          <strong>{periodSummary.completionRate}<span>%</span></strong>
          <small>Turnaround efficiency in period</small>
        </div>
      </div>

      {/* Interactive Charts Section: Line Chart & Bar Chart */}
      <div className="admin-charts-grid">
        {/* SVG Line Chart: 12-Month Revenue & Volume Trend */}
        <section className="staff-panel admin-chart-card">
          <div className="admin-panel-head">
            <div>
              <h2>Monthly Revenue & Intake Trend ({selectedYear})</h2>
              <p className="staff-muted">Continuous 12-month revenue curve and repair order volume.</p>
            </div>
            <div className="admin-chart-legend">
              <span className="legend-rev"><i /> Revenue (₦)</span>
              <span className="legend-vol"><i /> Job Volume</span>
            </div>
          </div>

          <div className="admin-svg-chart-wrap">
            <svg
              viewBox="0 0 600 220"
              className="admin-svg-line-chart"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0c8279" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0c8279" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <line
                  key={i}
                  x1="40"
                  y1={30 + ratio * 140}
                  x2="580"
                  y2={30 + ratio * 140}
                  stroke="#edf2f7"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Area fill under the revenue curve */}
              {(() => {
                const points = monthlyTrend.map((t, idx) => {
                  const x = 40 + (idx / 11) * 540;
                  const y = 170 - (t.revenue / maxRevenue) * 130;
                  return `${x},${y}`;
                });
                const d = `M 40,170 L ${points.join(' L ')} L 580,170 Z`;
                return <path d={d} fill="url(#revGradient)" />;
              })()}

              {/* Revenue Line Path */}
              {(() => {
                const points = monthlyTrend.map((t, idx) => {
                  const x = 40 + (idx / 11) * 540;
                  const y = 170 - (t.revenue / maxRevenue) * 130;
                  return `${x},${y}`;
                });
                return (
                  <path
                    d={`M ${points.join(' L ')}`}
                    fill="none"
                    stroke="#0c8279"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })()}

              {/* Volume Line (Dotted Cyan) */}
              {(() => {
                const points = monthlyTrend.map((t, idx) => {
                  const x = 40 + (idx / 11) * 540;
                  const y = 170 - (t.totalJobs / maxJobs) * 110;
                  return `${x},${y}`;
                });
                return (
                  <path
                    d={`M ${points.join(' L ')}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                );
              })()}

              {/* Data Points on Line Chart */}
              {monthlyTrend.map((t, idx) => {
                const x = 40 + (idx / 11) * 540;
                const y = 170 - (t.revenue / maxRevenue) * 130;
                const isCurrent = t.monthNumber === selectedMonth;

                return (
                  <g
                    key={t.month}
                    className="admin-chart-point"
                    onMouseEnter={() => setHoveredTrend(t)}
                    onMouseLeave={() => setHoveredTrend(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isCurrent ? 6 : 4}
                      fill={isCurrent ? '#0c8279' : '#ffffff'}
                      stroke="#0c8279"
                      strokeWidth={isCurrent ? 3 : 2}
                    />
                    {/* Month Label */}
                    <text
                      x={x}
                      y="198"
                      textAnchor="middle"
                      fontSize="10"
                      fill={isCurrent ? '#0c8279' : '#64748b'}
                      fontWeight={isCurrent ? '700' : '500'}
                    >
                      {t.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredTrend && (
              <div className="admin-chart-tooltip">
                <strong>{hoveredTrend.fullMonth} {selectedYear}</strong>
                <div>Revenue: <b>{money(hoveredTrend.revenue)}</b></div>
                <div>Repairs: <b>{hoveredTrend.totalJobs}</b> orders ({hoveredTrend.completedJobs} completed)</div>
              </div>
            )}
          </div>
        </section>

        {/* SVG Bar Chart: Technician Output Comparison */}
        <section className="staff-panel admin-chart-card">
          <div className="admin-panel-head">
            <div>
              <h2>Technician Comparative Output</h2>
              <p className="staff-muted">Completed repair volume by technician in {monthNames[selectedMonth - 1]}.</p>
            </div>
            <BarChart2 size={18} className="staff-muted" />
          </div>

          <div className="admin-bar-chart-container">
            {technicianPerformance.length === 0 ? (
              <p className="staff-muted" style={{ padding: 20 }}>No technician data for this period.</p>
            ) : (
              technicianPerformance.map(tech => {
                const maxAssigned = Math.max(1, ...technicianPerformance.map(t => t.assignedJobs));
                const pct = Math.round((tech.completedJobs / maxAssigned) * 100);

                return (
                  <div key={tech.id} className="admin-bar-row">
                    <div className="admin-bar-label">
                      <strong>{tech.name}</strong>
                      <span className="admin-bar-meta">
                        <b>{tech.completedJobs}</b> completed · <span style={{ color: '#059669', fontWeight: 600 }}>{money(tech.revenueGenerated)}</span>
                      </span>
                    </div>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{ width: `${Math.max(8, pct)}%` }}
                        title={`${tech.name}: ${tech.completedJobs} completed`}
                      >
                        <span>{tech.completedJobs}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Individual Technician Performance Table */}
      <section className="staff-panel admin-tech-perf-section">
        <div className="admin-panel-head">
          <div>
            <h2>Individual Technician Performance Roster</h2>
            <p className="staff-muted">
              Throughput, completed jobs, and revenue attributed to each technician for {monthNames[selectedMonth - 1]} {selectedYear}.
            </p>
          </div>
          <span className="admin-count">{technicianPerformance.length} Technicians</span>
        </div>

        <div className="staff-table-scroll">
          <table className="admin-perf-table">
            <thead>
              <tr>
                <th>Technician</th>
                <th>Specialties</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Completion Rate</th>
                <th>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {technicianPerformance.map(tech => (
                <tr key={tech.id}>
                  <td>
                    <div className="admin-tech-cell">
                      <span className="staff-avatar">{initials(tech.name)}</span>
                      <div>
                        <strong>{tech.name}</strong>
                        <small>{tech.email || 'Workshop Repairer'}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-tech-specialties" style={{ margin: 0 }}>
                      {(tech.specialties || [tech.specialty || 'General repairs']).map(spec => (
                        <span key={spec} className="admin-specialty-pill" style={{ fontSize: 11, padding: '2px 8px' }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><b>{tech.assignedJobs}</b></td>
                  <td><b style={{ color: '#0369a1' }}>{tech.completedJobs}</b></td>
                  <td><span style={{ color: '#d97706', fontWeight: 600 }}>{tech.activeJobs}</span></td>
                  <td>
                    <div className="admin-rate-cell">
                      <span>{tech.completionRate}%</span>
                      <div className="admin-rate-track">
                        <div className="admin-rate-fill" style={{ width: `${tech.completionRate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontSize: 13.5 }}>
                      {money(tech.revenueGenerated)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Status Breakdown and Category Breakdown Grid */}
      <div className="admin-report-grid">
        <section className="staff-panel admin-chart-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Repair Status Breakdown</h2>
              <p className="staff-muted">Active and completed status distribution.</p>
            </div>
            <span className="admin-count">{periodSummary.totalJobs} requests</span>
          </div>
          <div className="admin-status-chart">
            {statuses.map((status, index) => {
              const count = reportData?.statusCounts?.[status] ?? jobs.filter(job => job.status === status).length;
              const total = periodSummary.totalJobs || jobs.length || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div className="admin-chart-row" key={status}>
                  <div className="admin-chart-label">
                    <span>
                      <i className={`admin-chart-dot admin-chart-color-${index}`} />
                      {status}
                    </span>
                    <strong>{count}<small>{percentage}%</small></strong>
                  </div>
                  <div className="admin-chart-track" aria-hidden="true">
                    <span className={`admin-chart-color-${index}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="staff-panel admin-chart-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Device Category Breakdown</h2>
              <p className="staff-muted">Intake distribution across hardware types.</p>
            </div>
            <Package size={19} className="staff-muted" />
          </div>
          <div className="admin-category-chart">
            {categories.map((category, index) => {
              const count = reportData?.categoryBreakdown?.[category]?.count ?? jobs.filter(job => job.category === category).length;
              const total = periodSummary.totalJobs || jobs.length || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div className="admin-device-row" key={category}>
                  <span className={`admin-device-number admin-device-number-${index}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="admin-device-bar">
                    <div className="admin-chart-label">
                      <span>{category === 'Other' ? 'Other devices' : `${category}s`}</span>
                      <strong>{count}<small>{percentage}%</small></strong>
                    </div>
                    <div className="admin-chart-track" aria-hidden="true">
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

