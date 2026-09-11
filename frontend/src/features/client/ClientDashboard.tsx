import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import {
  Bell, Camera, Check, ChevronDown, ChevronRight, ClipboardList, Clock, CreditCard,
  Download, ExternalLink, FileText, Gift, HelpCircle, LayoutDashboard, LogOut,
  Menu, MessageSquare, Moon, Package, Phone, Printer, Send, Settings,
  ShieldCheck, Smartphone, Sparkles, Sun, Upload, UserRound, Wrench, X
} from 'lucide-react';
import './client-portal.css';
import { exportInvoicePDF, exportWarrantyPDF, exportDiagnosticPDF } from './pdfExport';
import { api } from '../../api/client';
import BrandLogo from '../../components/BrandLogo';

interface RepairItem {
  id: string;
  device: string;
  category: 'Phone' | 'Laptop' | 'Tablet' | 'Smartwatch' | 'Other';
  issue: string;
  status: 'Submitted' | 'Assigned repairer' | 'Repairer acknowledged' | 'Awaiting payment' | 'In progress' | 'Ready for pickup' | 'Collected';
  stageIndex: number; // 0 to 5
  estimate: number;
  paid: boolean;
  dueDate: string;
  dropoffDate: string;
  technician: string;
  notes: string;
}

interface MessageItem {
  id: string;
  from: 'staff' | 'client';
  author: string;
  text: string;
  time: string;
}

interface Thread {
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  unread: boolean;
  messages: MessageItem[];
}

const stages = ['Submitted', 'Assigned repairer', 'Repairer acknowledged', 'Paid', 'Repair in progress', 'Ready for collection'];

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export default function ClientDashboard({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('Overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toast, setToast] = useState<string | null>(null);

  // User profile state
  const [profile, setProfile] = useState({
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '080 1234 5678',
    avatarUrl: '',
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true,
  });

  // Client Repairs state
  const [repairs, setRepairs] = useState<RepairItem[]>([
    {
      id: 'FL-1048',
      device: 'iPhone 13 Pro',
      category: 'Phone',
      issue: 'Cracked OLED screen after drop. Touch digitizer unresponsive on lower quadrant.',
      status: 'Awaiting payment',
      stageIndex: 2,
      estimate: 45000,
      paid: false,
      dueDate: '2026-09-12',
      dropoffDate: '2026-09-08',
      technician: 'Jordan Malik',
      notes: 'Initial diagnostics complete. Original OLED replacement panel allocated. Awaiting payment confirmation to proceed.',
    },
    {
      id: 'FL-1042',
      device: 'Dell XPS 13',
      category: 'Laptop',
      issue: 'Spill on keyboard. Spacebar and row 3 sticky keys.',
      status: 'In progress',
      stageIndex: 4,
      estimate: 28000,
      paid: true,
      dueDate: '2026-09-15',
      dropoffDate: '2026-09-05',
      technician: 'Tomi Adeyemi',
      notes: 'Internal board cleaned. Replacement backlit keyboard module en route from certified supplier.',
    },
    {
      id: 'FL-1039',
      device: 'MacBook Air M1',
      category: 'Laptop',
      issue: 'Battery health degraded (62%). Frequent sudden shutdowns.',
      status: 'Collected',
      stageIndex: 5,
      estimate: 45000,
      paid: true,
      dueDate: '2026-09-04',
      dropoffDate: '2026-09-01',
      technician: 'Jordan Malik',
      notes: 'New OEM battery installed and calibrated. Passed all 40-point power draw benchmarks.',
    },
  ]);

  // Selected repair for detail modal
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);

  // Document modal preview state with target repair
  const [activeDoc, setActiveDoc] = useState<{
    type: 'invoice' | 'warranty' | 'diagnostic';
    repair?: RepairItem;
  } | null>(null);

  // Chat Threads state
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 'workshop',
      title: 'Kendat FixLap Workshop',
      subtitle: 'Repair updates for #FL-1048',
      avatar: 'JM',
      unread: true,
      messages: [
        { id: 'm1', from: 'staff', author: 'Jordan Malik (Senior Technician)', text: 'Hello Sarah! We have completed diagnostics on your iPhone 13 Pro (#FL-1048).', time: '10:15 AM' },
        { id: 'm2', from: 'staff', author: 'Jordan Malik (Senior Technician)', text: 'The display panel replacement is ready. Once payment of ₦45,000 is completed, our bench team will install and test it today.', time: '10:32 AM' },
      ],
    },
    {
      id: 'support',
      title: 'Kendat FixLap Support Desk',
      subtitle: 'General inquiries & pickups',
      avatar: 'KF',
      unread: true,
      messages: [
        { id: 's1', from: 'staff', author: 'Amaka (Support)', text: 'Welcome to Kendat FixLap, Sarah! Let us know if you ever need dispatch pickup for any device.', time: 'Yesterday' },
      ],
    },
  ]);

  // Active chat thread
  const [activeThreadId, setActiveThreadId] = useState('workshop');

  // Referral sent state
  const [referralCopied, setReferralCopied] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [paystackKey, setPaystackKey] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Notification Bell State
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [clientNotifications, setClientNotifications] = useState<
    { id: string; threadId: string; repairId: string | null; trackingNumber?: string; title: string; author: string; text: string; time: string }[]
  >([]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const selectPage = (page: string) => {
    setActive(page);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load live data from Laravel API on mount
  useEffect(() => {
    let mounted = true;
    const loadLiveClientData = async () => {
      try {
        const [userRes, repairsData, threadsData, refData, payConfig, notifsData] = await Promise.all([
          api.auth.me().catch(() => null),
          api.clientRepairs.list().catch(() => null),
          api.messages.threads().catch(() => null),
          api.referrals.stats().catch(() => null),
          api.payments.config().catch(() => null),
          api.notifications.list().catch(() => null),
        ]);

        if (mounted) {
          if (userRes?.user) {
            setProfile(prev => ({
              ...prev,
              name: userRes.user.name || prev.name,
              email: userRes.user.email || prev.email,
              phone: userRes.user.phone || prev.phone,
            }));
          }
          if (repairsData && Array.isArray(repairsData) && repairsData.length > 0) {
            setRepairs(repairsData);
          }
          if (threadsData && Array.isArray(threadsData) && threadsData.length > 0) {
            setThreads(threadsData);
          }
          if (notifsData?.items && Array.isArray(notifsData.items)) {
            setClientNotifications(notifsData.items);
          }
          if (refData?.referralCode) {
            setReferralCode(refData.referralCode);
          }
          if (payConfig?.publicKey) {
            setPaystackKey(payConfig.publicKey);
          }
        }
      } catch {
        // graceful fallback to seeded initial state
      }
    };
    loadLiveClientData();

    // Poll notifications every 15s to check for new messages from technician
    const pollInterval = setInterval(async () => {
      if (!mounted) return;
      try {
        const notifsData = await api.notifications.list().catch(() => null);
        if (mounted && notifsData?.items) {
          setClientNotifications(notifsData.items);
        }
      } catch {}
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Unread badge count
  const unreadCount = threads.filter(t => t.unread).length;
  const unreadNotifCount = Math.max(unreadCount, clientNotifications.length);

  // Jump from repair to direct technician chat
  const handleChatRepair = async (repair: RepairItem) => {
    try {
      const chatData = await api.repairs.getChat(repair.id).catch(() => null);
      const threadId = chatData?.id || `repair-${repair.id}`;

      const newThread: Thread = {
        id: threadId,
        title: `#${repair.id} · ${repair.device}`,
        subtitle: `Technician: ${repair.technician || 'Assigned Tech'}`,
        avatar: '🔧',
        unread: false,
        messages: chatData?.messages?.length ? chatData.messages.map((m: any) => ({
          id: m.id,
          from: m.from === 'staff' ? 'staff' : 'client',
          author: m.author,
          text: m.text,
          time: m.time,
        })) : [
          {
            id: `init-${Date.now()}`,
            from: 'staff',
            author: repair.technician || 'FixLap Technician',
            text: `Hello ${profile.name.split(' ')[0]}, this is your direct repair channel for ${repair.device} (#${repair.id}). You can ask any question or request an update right here!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ],
      };

      setThreads(prev => {
        const idx = prev.findIndex(t => t.id === threadId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], messages: newThread.messages };
          return updated;
        }
        return [newThread, ...prev];
      });

      setActiveThreadId(threadId);
      setActive('Messages');
      setOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setActive('Messages');
    }
  };

  const markThreadRead = async (threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread: false } : t));
    try {
      await api.messages.markRead(threadId);
    } catch {
      // ignore
    }
  };

  const startPayment = async (repairId = 'FL-1048', amount = 45000) => {
    const targetRepair = repairs.find(r => r.id === repairId) || repairs[0];
    let key = paystackKey || (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined);

    if (!key) {
      try {
        const config = await api.payments.config();
        if (config?.publicKey) {
          key = config.publicKey;
          setPaystackKey(config.publicKey);
        }
      } catch {
        // ignore
      }
    }

    // Default fallback to configured Paystack public key if backend config request was unreachable
    if (!key) {
      key = 'pk_test_f1543f74336d89f3e67ee441f296d715f3273552';
      setPaystackKey(key);
    }

    const openCheckout = () => {
      if (!window.PaystackPop) {
        showToast('Paystack checkout could not be loaded. Check connection.');
        return;
      }

      window.PaystackPop.setup({
        key,
        email: profile.email || 'client@fixlab.com',
        amount: Math.round(amount * 100),
        currency: 'NGN',
        ref: `FIX-${targetRepair.id}-${Date.now()}`,
        metadata: {
          repairId: targetRepair.id,
          device: targetRepair.device,
          customerName: profile.name,
        },
        callback: (resp) => {
          handlePaymentSuccess(targetRepair.id, amount, resp.reference);
        },
        onClose: () => undefined,
      }).openIframe();
    };

    if (window.PaystackPop) {
      openCheckout();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = openCheckout;
    script.onerror = () => showToast('Could not reach Paystack payment gateway.');
    document.body.appendChild(script);
  };

  const handlePaymentSuccess = async (repairId: string, amount = 45000, reference?: string) => {
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, paid: true, status: 'In progress', stageIndex: 4 } : r));
    showToast(`Payment of ₦${amount.toLocaleString()} received for repair #${repairId}!`);
    try {
      await api.payments.verify(reference || `PAY-${Date.now()}`, repairId, amount);
    } catch {
      // Local state already updated
    }
  };

  const activeRepairsCount = repairs.filter(r => r.status !== 'Collected').length;
  const totalRepairsCount = repairs.length;

  const currentActiveRepair = repairs.find(r => r.id === 'FL-1048') || repairs[0];

  return (
    <div className={`client-app ${theme}`}>
      {/* Toast popup */}
      {toast && (
        <div className="client-toast success">
          <Check size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      {open && <div className="client-sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={`client-sidebar ${open ? 'open' : ''}`}>
        <div className="client-side-head">
          <BrandLogo dark size="sm" />
          <button onClick={() => setOpen(false)} aria-label="Close sidebar"><X /></button>
        </div>

        <p className="nav-label">MY KENDAT FIXLAP</p>
        <nav>
          <button className={active === 'Overview' ? 'active' : ''} onClick={() => selectPage('Overview')}>
            <LayoutDashboard size={17} /> Overview
          </button>
          <button className={active === 'New repair request' ? 'active' : ''} onClick={() => selectPage('New repair request')}>
            <Wrench size={17} /> New repair request
          </button>
          <button className={active === 'My repairs' ? 'active' : ''} onClick={() => selectPage('My repairs')}>
            <ClipboardList size={17} /> My repairs
          </button>
          <button className={active === 'Messages' ? 'active' : ''} onClick={() => { selectPage('Messages'); markThreadRead(activeThreadId); }}>
            <MessageSquare size={17} /> Messages
            {unreadCount > 0 && <b>{unreadCount}</b>}
          </button>
          <button className={active === 'Referrals & rewards' ? 'active' : ''} onClick={() => selectPage('Referrals & rewards')}>
            <Gift size={17} /> Referrals & rewards
          </button>
          <button className={active === 'Documents' ? 'active' : ''} onClick={() => selectPage('Documents')}>
            <FileText size={17} /> Documents
          </button>
        </nav>

        <div className="client-bottom">
          <p className="nav-label">ACCOUNT</p>
          <button className={active === 'Profile & settings' ? 'active' : ''} onClick={() => selectPage('Profile & settings')}>
            <Settings size={17} /> Profile & settings
          </button>
          <button className={active === 'Help centre' ? 'active' : ''} onClick={() => selectPage('Help centre')}>
            <HelpCircle size={17} /> Help centre
          </button>
          <button onClick={onLogout}>
            <LogOut size={17} /> Sign out
          </button>

          <div className="client-profile">
            <div className="profile-photo">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <UserRound size={22} />
              )}
            </div>
            <div>
              <strong>{profile.name}</strong>
              <small>Client account</small>
            </div>
          </div>
        </div>
        
      </aside>

      {/* Main content area */}
      <section className="client-main">
        <header className="client-topbar">
          <button className="client-menu" onClick={() => setOpen(true)} aria-label="Open sidebar">
            <Menu />
          </button>
          <span className="client-breadcrumb">
           <strong>{active}</strong>
          </span>
          <div className="client-actions">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="client-bell-wrap" ref={notifRef}>
              <button
                className={`client-bell-btn ${notifOpen ? 'open' : ''}`}
                onClick={() => setNotifOpen(prev => !prev)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span className="client-bell-badge">{unreadNotifCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="client-notifications-dropdown" role="menu">
                  <div className="client-notif-head">
                    <h3><Bell size={15} color="#08a4b3" /> Notifications & Messages</h3>
                    {unreadNotifCount > 0 && (
                      <span className="dropdown-pill">{unreadNotifCount} unread</span>
                    )}
                  </div>

                  <div className="client-notif-list">
                    {clientNotifications.length > 0 ? (
                      clientNotifications.map(item => (
                        <div
                          key={item.id}
                          className="client-notif-item"
                          onClick={() => {
                            setNotifOpen(false);
                            if (item.threadId) {
                              setActiveThreadId(item.threadId);
                              markThreadRead(item.threadId);
                              setActive('Messages');
                            } else if (item.repairId) {
                              const targetRepair = repairs.find(r => r.id === item.repairId || r.id === item.trackingNumber);
                              if (targetRepair) handleChatRepair(targetRepair);
                              else setActive('Messages');
                            }
                          }}
                        >
                          <div className="client-notif-item-top">
                            <strong><MessageSquare size={13} /> {item.author || 'Technician'}</strong>
                            <small>{item.time}</small>
                          </div>
                          <div className="client-notif-item-title">{item.title}</div>
                          <p className="client-notif-item-text">
                            "{item.text.slice(0, 75)}{item.text.length > 75 ? '...' : ''}"
                          </p>
                          <button
                            type="button"
                            className="client-notif-reply-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifOpen(false);
                              if (item.threadId) {
                                setActiveThreadId(item.threadId);
                                markThreadRead(item.threadId);
                                setActive('Messages');
                              } else if (item.repairId) {
                                const targetRepair = repairs.find(r => r.id === item.repairId || r.id === item.trackingNumber);
                                if (targetRepair) handleChatRepair(targetRepair);
                                else setActive('Messages');
                              }
                            }}
                          >
                            💬 Open Chat & Reply
                          </button>
                        </div>
                      ))
                    ) : threads.some(t => t.unread) ? (
                      threads.filter(t => t.unread).map(t => (
                        <div
                          key={t.id}
                          className="client-notif-item"
                          onClick={() => {
                            setNotifOpen(false);
                            setActiveThreadId(t.id);
                            markThreadRead(t.id);
                            setActive('Messages');
                          }}
                        >
                          <div className="client-notif-item-top">
                            <strong><MessageSquare size={13} /> {t.title}</strong>
                            <small>{t.messages[t.messages.length - 1]?.time}</small>
                          </div>
                          <p className="client-notif-item-text">
                            {t.messages[t.messages.length - 1]?.text}
                          </p>
                          <button type="button" className="client-notif-reply-btn">
                            💬 Reply
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="client-notif-empty">
                        <p style={{ fontWeight: 600, color: '#475569', margin: '0 0 4px' }}>You’re all caught up!</p>
                        <small>Technician updates and repair messages will appear here and in your email.</small>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="client-user-dropdown-wrap" ref={userMenuRef}>
              <button
                className={`client-profile-trigger ${userMenuOpen ? 'open' : ''}`}
                onClick={() => setUserMenuOpen(prev => !prev)}
                aria-label="User profile and account menu"
                aria-expanded={userMenuOpen}
              >
                <div className="avatar" title={profile.name}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                  )}
                </div>
                <ChevronDown size={14} className={`profile-chevron ${userMenuOpen ? 'rotated' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="client-user-dropdown" role="menu">
                  <div className="dropdown-user-header">
                    <div className="dropdown-avatar">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      )}
                    </div>
                    <div className="dropdown-user-info">
                      <strong>{profile.name}</strong>
                      <small>{profile.email || 'client@fixlab.com'}</small>
                      <span className="dropdown-role-badge">Client account</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-menu-items">
                    <button
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        selectPage('Profile & settings');
                        setUserMenuOpen(false);
                      }}
                    >
                      <Settings size={16} />
                      <span>Profile & settings</span>
                    </button>

                    <button
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        selectPage('My repairs');
                        setUserMenuOpen(false);
                      }}
                    >
                      <ClipboardList size={16} />
                      <span>My repairs</span>
                      {repairs.length > 0 && <b className="dropdown-pill">{repairs.length}</b>}
                    </button>

                    <button
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        selectPage('New repair request');
                        setUserMenuOpen(false);
                      }}
                    >
                      <Wrench size={16} />
                      <span>New repair request</span>
                    </button>

                    <button
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        selectPage('Help centre');
                        setUserMenuOpen(false);
                      }}
                    >
                      <HelpCircle size={16} />
                      <span>Help centre</span>
                    </button>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-menu-items">
                    <button
                      className="dropdown-item dropdown-logout"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="client-content">
          {active === 'Overview' && (
            <OverviewSection
              profileName={profile.name}
              repairs={repairs}
              activeRepair={currentActiveRepair}
              activeCount={activeRepairsCount}
              totalCount={totalRepairsCount}
              onNew={() => selectPage('New repair request')}
              onViewAll={() => selectPage('My repairs')}
              onPay={() => startPayment(currentActiveRepair.id, currentActiveRepair.estimate)}
              onSelectRepair={setSelectedRepair}
            />
          )}

          {active === 'New repair request' && (
            <NewRepairSection
              contactNumber={profile.phone}
              onSubmitSuccess={(newJob) => {
                setRepairs(prev => [newJob, ...prev]);
                showToast(`Repair #${newJob.id} submitted successfully!`);
              }}
              onViewRepairs={() => selectPage('My repairs')}
            />
          )}

          {active === 'My repairs' && (
            <MyRepairsSection
              repairs={repairs}
              onSelectRepair={setSelectedRepair}
              onChat={handleChatRepair}
              onPay={(r) => startPayment(r.id, r.estimate)}
              onNew={() => selectPage('New repair request')}
              onOpenInvoice={(r) => setActiveDoc({ type: 'invoice', repair: r })}
            />
          )}

          {active === 'Messages' && (
            <MessagesSection
              threads={threads}
              activeThreadId={activeThreadId}
              onSelectThread={(id) => {
                setActiveThreadId(id);
                markThreadRead(id);
              }}
              onSendMessage={async (threadId, text) => {
                const newMsg: MessageItem = {
                  id: `msg-${Date.now()}`,
                  from: 'client',
                  author: profile.name,
                  text,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setThreads(prev => prev.map(t => {
                  if (t.id === threadId) {
                    return { ...t, messages: [...t.messages, newMsg] };
                  }
                  return t;
                }));

                // Synchronize with Laravel API: sends email to technician and flags message
                try {
                  if (threadId.startsWith('repair-') || !isNaN(Number(threadId))) {
                    const cleanRepairId = threadId.replace('repair-', '');
                    await api.repairs.sendChat(cleanRepairId, text);
                  } else {
                    await api.messages.send(threadId, text);
                  }
                } catch {
                  // Auto-reply fallback simulation if working offline
                  setTimeout(() => {
                    const replyText = threadId === 'workshop'
                      ? "Thank you Sarah. Jordan has noted this and is currently preparing your device. We'll send an update once the bench test finishes."
                      : 'Hello Sarah, your message has reached our support desk. An agent is on standby if you need courier assistance.';
                    const replyMsg: MessageItem = {
                      id: `msg-reply-${Date.now()}`,
                      from: 'staff',
                      author: threadId === 'workshop' ? 'Jordan Malik (FixLab)' : 'Amaka (Support)',
                      text: replyText,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    };
                    setThreads(prev => prev.map(t => {
                      if (t.id === threadId) {
                        return { ...t, messages: [...t.messages, replyMsg] };
                      }
                      return t;
                    }));
                  }, 1200);
                }
              }}
            />
          )}

          {active === 'Referrals & rewards' && (
            <ReferralSection
              copied={referralCopied}
              onCopy={() => {
                setReferralCopied(true);
                showToast('Referral link copied to clipboard!');
                setTimeout(() => setReferralCopied(false), 2500);
              }}
              onRedeem={() => setShowRedeemModal(true)}
            />
          )}

          {active === 'Documents' && (
            <DocumentsSection
              repairs={repairs}
              onOpenDoc={(type, repair) => setActiveDoc({ type, repair })}
            />
          )}

          {active === 'Profile & settings' && (
            <SettingsSection
              profile={profile}
              onSave={(updated) => {
                setProfile(updated);
                showToast('Profile and preferences updated successfully!');
              }}
            />
          )}

          {active === 'Help centre' && (
            <HelpSection
              repairs={repairs}
              onTrack={(id) => {
                const found = repairs.find(r => r.id.toLowerCase() === id.toLowerCase());
                if (found) {
                  setSelectedRepair(found);
                } else {
                  showToast(`No repair found with ID "${id}".`);
                }
              }}
              onContactSupport={() => selectPage('Messages')}
            />
          )}
        </main>
      </section>

      {/* Repair Details Modal */}
      {selectedRepair && (
        <RepairDetailModal
          repair={selectedRepair}
          onClose={() => setSelectedRepair(null)}
          onOpenInvoice={(r) => {
            setSelectedRepair(null);
            setActiveDoc({ type: 'invoice', repair: r });
          }}
          onChatTechnician={(r) => {
            setSelectedRepair(null);
            handleChatRepair(r);
          }}
          onPay={() => {
            setSelectedRepair(null);
            startPayment(selectedRepair.id, selectedRepair.estimate);
          }}
        />
      )}

      {/* Document View Modal */}
      {activeDoc && (
        <DocumentModal
          docType={activeDoc.type}
          repair={activeDoc.repair || repairs.find(r => r.id === 'FL-1039') || repairs[0]}
          clientName={profile.name}
          onClose={() => setActiveDoc(null)}
          onPrint={() => {
            window.print();
          }}
          onDownload={() => {
            const target = activeDoc.repair || repairs.find(r => r.id === 'FL-1039') || repairs[0];
            if (activeDoc.type === 'invoice') {
              exportInvoicePDF({
                repairId: target.id,
                device: target.device,
                clientName: profile.name,
                dateIssued: target.dropoffDate,
                paid: target.paid,
                amount: target.estimate,
              });
              showToast(`Invoice-${target.id}.pdf downloaded successfully!`);
            } else if (activeDoc.type === 'warranty') {
              exportWarrantyPDF({
                repairId: target.id,
                device: target.device,
                clientName: profile.name,
                dateIssued: target.dropoffDate,
              });
              showToast(`Warranty-Certificate-${target.id}.pdf downloaded!`);
            } else {
              exportDiagnosticPDF({
                repairId: target.id,
                device: target.device,
                clientName: profile.name,
                technician: target.technician,
              });
              showToast(`Diagnostic-Report-${target.id}.pdf downloaded!`);
            }
          }}
        />
      )}

      {/* Referral Redeem Modal */}
      {showRedeemModal && (
        <div className="client-modal-overlay" onClick={() => setShowRedeemModal(false)}>
          <div className="client-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="client-modal-head">
              <h3>Redeem referral rewards</h3>
              <button className="client-modal-close" onClick={() => setShowRedeemModal(false)}><X size={18} /></button>
            </div>
            <div className="client-modal-body">
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                Your current rewards balance is <strong style={{ color: '#08a4b3', fontSize: 15 }}>₦1,200</strong>.
              </p>
              <div style={{ display: 'grid', gap: 10, margin: '18px 0' }}>
                <button
                  className="client-repair-card"
                  style={{ cursor: 'pointer', textAlign: 'left', border: '1px solid #73e2e0' }}
                  onClick={() => {
                    setShowRedeemModal(false);
                    showToast('₦1,200 applied as discount on your next repair!');
                  }}
                >
                  <strong style={{ display: 'block', fontSize: 13 }}>Apply to active/next repair</strong>
                  <small style={{ color: '#64748b' }}>Deduct ₦1,200 directly from your repair bill.</small>
                </button>
                <button
                  className="client-repair-card"
                  style={{ cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => {
                    setShowRedeemModal(false);
                    showToast('Payout request of ₦1,200 submitted to support.');
                  }}
                >
                  <strong style={{ display: 'block', fontSize: 13 }}>Request bank transfer payout</strong>
                  <small style={{ color: '#64748b' }}>Transfer reward credits to your bank account.</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------- 1. OVERVIEW SECTION ----------------------
function OverviewSection({
  profileName,
  repairs,
  activeRepair,
  activeCount,
  totalCount,
  onNew,
  onViewAll,
  onPay,
  onSelectRepair,
}: {
  profileName: string;
  repairs: RepairItem[];
  activeRepair: RepairItem;
  activeCount: number;
  totalCount: number;
  onNew: () => void;
  onViewAll: () => void;
  onPay: () => void;
  onSelectRepair: (r: RepairItem) => void;
}) {
  return (
    <>
      <div className="client-welcome">
        <div>
          <p className="eyebrow">Client dashboard</p>
          <h1>Good morning, {profileName.split(' ')[0]}</h1>
          <p className="muted client-welcome-subtitle">Track your repairs and keep your devices moving.</p>
        </div>
        <button className="primary" onClick={onNew}>+ Submit a repair</button>
      </div>

      {/* Two stats cards on the EXACT same row across mobile & desktop */}
      <div className="client-cards">
        <div>
          <span className="card-icon cyan"><ClipboardList /></span>
          <small>Active repairs</small>
          <strong>{activeCount}</strong>
          <em>{activeRepair.paid ? 'Payment received' : 'Payment needed'}</em>
        </div>
        <div>
          <span className="card-icon violet"><Package /></span>
          <small>Total repairs</small>
          <strong>{totalCount}</strong>
          <em>Since joining Kendat FixLap</em>
        </div>
      </div>

      {/* Featured Active Repair Card */}
      <div className="client-panel">
        <div className="panel-title">
          <div>
            <h2>Repair #{activeRepair.id}</h2>
            <p className="muted">{activeRepair.device} - {activeRepair.issue.split('.')[0]}</p>
          </div>
          <span className={`status ${activeRepair.paid ? 'paid' : 'awaiting-parts'}`}>
            {activeRepair.paid ? 'Paid · In progress' : 'Awaiting payment'}
          </span>
        </div>

        <div className={`payment-callout ${activeRepair.paid ? 'paid' : ''}`}>
          <div>
            <span><CreditCard size={18} /></span>
            <div>
              <strong>{activeRepair.paid ? 'Payment confirmed' : 'Amount agreed'}</strong>
              <p>
                {activeRepair.paid
                  ? `₦${activeRepair.estimate.toLocaleString()} has been received for repair #${activeRepair.id}.`
                  : `Diagnostics are complete. Pay ₦${activeRepair.estimate.toLocaleString()} with Paystack to continue.`}
              </p>
            </div>
          </div>
          {activeRepair.paid ? (
            <span className="status paid">Paid</span>
          ) : (
            <button className="primary" onClick={onPay}>Pay ₦{activeRepair.estimate.toLocaleString()}</button>
          )}
        </div>

        <div className="timeline">
          {stages.map((stage, i) => (
            <div className={i <= activeRepair.stageIndex ? 'done' : ''} key={stage}>
              <span>{i <= activeRepair.stageIndex ? '✓' : i + 1}</span>
              <small>{stage}</small>
            </div>
          ))}
        </div>

        <p className="muted update">
          {activeRepair.paid
            ? 'Payment received. Repair bench diagnostics and component assembly in progress.'
            : 'Diagnostics are complete. Pay the agreed amount with Paystack to authorize technician work.'}
        </p>
      </div>

      {/* Repair History */}
      <div className="client-panel">
        <div className="panel-title">
          <div>
            <h2>Repair history</h2>
            <p className="muted">Your devices and past work orders</p>
          </div>
          <button className="text-button" onClick={onViewAll}>View all {'->'}</button>
        </div>

        {repairs.slice(1).map(repair => (
          <div
            className="history-row"
            key={repair.id}
            onClick={() => onSelectRepair(repair)}
            style={{ cursor: 'pointer' }}
            title="Click to view details"
          >
            <strong>#{repair.id}</strong>
            <span>{repair.device} - {repair.issue.split('.')[0]}</span>
            <span className={`status ${repair.status === 'Collected' ? 'ready-for-pickup' : 'in-progress'}`}>
              {repair.status}
            </span>
            <span>₦{repair.estimate.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------- 2. NEW REPAIR REQUEST ----------------------
function NewRepairSection({
  contactNumber,
  onSubmitSuccess,
  onViewRepairs,
}: {
  contactNumber: string;
  onSubmitSuccess: (job: RepairItem) => void;
  onViewRepairs: () => void;
}) {
  const [deviceType, setDeviceType] = useState<'Phone' | 'Laptop' | 'Tablet' | 'Smartwatch' | 'Other'>('Phone');
  const [model, setModel] = useState('');
  const [issue, setIssue] = useState('');
  const [phone, setPhone] = useState(contactNumber || '080 1234 5678');
  const [dropoffDate, setDropoffDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdJob, setCreatedJob] = useState<RepairItem | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (isFront) setFrontImage(reader.result as string);
        else setBackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!model.trim() || !issue.trim()) {
      setFormError('Please fill in the device brand & model and describe the problem.');
      return;
    }
    setFormError('');

    setSubmitting(true);
    try {
      const res = await api.clientRepairs.submit({
        deviceType,
        model: model.trim(),
        issue: issue.trim(),
        phone: phone.trim(),
        dropoffDate,
      });

      const newRepair: RepairItem = {
        id: res.repair.id,
        device: res.repair.device,
        category: res.repair.category,
        issue: res.repair.issue,
        status: res.repair.status,
        stageIndex: res.repair.stageIndex || 0,
        estimate: res.repair.estimate || (deviceType === 'Phone' ? 25000 : deviceType === 'Laptop' ? 35000 : 20000),
        paid: false,
        dueDate: res.repair.dueDate,
        dropoffDate: res.repair.dropoffDate,
        technician: res.repair.technician || 'Pending assignment',
        notes: res.repair.notes || 'Request logged online. Awaiting device drop-off at workshop.',
      };

      setCreatedJob(newRepair);
      onSubmitSuccess(newRepair);
    } catch {
      const randomNum = Math.floor(1050 + Math.random() * 40);
      const newRepair: RepairItem = {
        id: `FL-${randomNum}`,
        device: model.trim(),
        category: deviceType,
        issue: issue.trim(),
        status: 'Submitted',
        stageIndex: 0,
        estimate: deviceType === 'Phone' ? 25000 : deviceType === 'Laptop' ? 35000 : 20000,
        paid: false,
        dueDate: dropoffDate,
        dropoffDate,
        technician: 'Assigned on arrival',
        notes: 'Request logged online. Awaiting device drop-off at workshop.',
      };
      setCreatedJob(newRepair);
      onSubmitSuccess(newRepair);
    } finally {
      setSubmitting(false);
    }
  };

  if (createdJob) {
    return (
      <div className="client-panel" style={{ textAlign: 'center', padding: '36px 20px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#16a34a',
          display: 'grid', placeItems: 'center', margin: '0 auto 16px'
        }}>
          <Check size={28} />
        </div>
        <p className="eyebrow" style={{ color: '#16a34a' }}>REQUEST CONFIRMED</p>
        <h1 style={{ fontSize: 26, margin: '8px 0 12px' }}>Repair #{createdJob.id} Created</h1>
        <p className="muted" style={{ maxWidth: 460, margin: '0 auto 24px', fontSize: 13, lineHeight: 1.6 }}>
          Thank you! Your repair request for <strong>{createdJob.device}</strong> has been received.
          Drop your device off on <strong>{createdJob.dropoffDate}</strong> at our Kendat FixLap workshop.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="primary" onClick={onViewRepairs}>
            Track in My repairs {'->'}
          </button>
          <button
            className="secondary"
            onClick={() => {
              setCreatedJob(null);
              setModel('');
              setIssue('');
              setFrontImage(null);
              setBackImage(null);
            }}
          >
            Submit another repair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-panel request-form">
      <p className="eyebrow">New repair request</p>
      <h1>Tell us what needs fixing.</h1>
      <p className="muted">Share the details below so our technician team can review your device.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Device type
            <select value={deviceType} onChange={e => setDeviceType(e.target.value as any)}>
              <option value="Phone">Phone (iPhone, Samsung, Pixel...)</option>
              <option value="Laptop">Laptop (MacBook, Dell, HP, Lenovo...)</option>
              <option value="Tablet">Tablet (iPad, Galaxy Tab...)</option>
              <option value="Smartwatch">Smartwatch (Apple Watch, Galaxy...)</option>
              <option value="Other">Game console / Other gadget</option>
            </select>
          </label>

          <label>
            Brand and model
            <input
              placeholder="e.g. iPhone 13 Pro, MacBook Pro M2"
              value={model}
              onChange={e => setModel(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Describe the problem
          <textarea
            rows={4}
            placeholder="Tell us what happened (e.g. dropped on concrete, liquid spill, battery drains quickly, overheating)..."
            value={issue}
            onChange={e => setIssue(e.target.value)}
            required
          />
        </label>

        <div className="upload-grid">
          <label className={`upload-box ${frontImage ? 'has-file' : ''}`}>
            {frontImage ? (
              <>
                <img src={frontImage} alt="Front photo" className="upload-preview-img" />
                <small style={{ color: '#08a4b3', fontWeight: 700 }}>Front photo attached</small>
              </>
            ) : (
              <>
                <Upload size={22} />
                <strong>Front photo</strong>
                <small>PNG, JPG up to 10MB</small>
              </>
            )}
            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, true)} />
          </label>

          <label className={`upload-box ${backImage ? 'has-file' : ''}`}>
            {backImage ? (
              <>
                <img src={backImage} alt="Back photo" className="upload-preview-img" />
                <small style={{ color: '#08a4b3', fontWeight: 700 }}>Back photo attached</small>
              </>
            ) : (
              <>
                <Camera size={22} />
                <strong>Back photo</strong>
                <small>PNG, JPG up to 10MB</small>
              </>
            )}
            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, false)} />
          </label>
        </div>

        <div className="form-grid">
          <label>
            Preferred contact number
            <input
              placeholder="080..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </label>

          <label>
            Preferred drop-off date
            <input
              type="date"
              value={dropoffDate}
              onChange={e => setDropoffDate(e.target.value)}
              required
            />
          </label>
        </div>

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Submitting request...' : 'Submit repair request ->'}
        </button>
      </form>
    </div>
  );
}

// ---------------------- 3. MY REPAIRS SECTION ----------------------
function MyRepairsSection({
  repairs,
  onSelectRepair,
  onChat,
  onPay,
  onNew,
  onOpenInvoice,
}: {
  repairs: RepairItem[];
  onSelectRepair: (r: RepairItem) => void;
  onChat?: (r: RepairItem) => void;
  onPay: (r: RepairItem) => void;
  onNew: () => void;
  onOpenInvoice: (r: RepairItem) => void;
}) {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [search, setSearch] = useState('');

  const filtered = repairs.filter(r => {
    const matchFilter =
      filter === 'All' ? true :
      filter === 'Active' ? r.status !== 'Collected' :
      r.status === 'Collected';
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.device.toLowerCase().includes(search.toLowerCase()) ||
      r.issue.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <div className="client-welcome">
        <div>
          <p className="eyebrow">My repairs</p>
          <h1>Your repair jobs</h1>
          <p className="muted">See every device you have submitted, track progress, and inspect invoices.</p>
        </div>
        <button className="primary" onClick={onNew}>+ Submit another</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', margin: '20px 0 10px' }}>
        <div className="client-pills" style={{ margin: 0 }}>
          {(['All', 'Active', 'Completed'] as const).map(tab => (
            <button
              key={tab}
              className={`client-pill ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab} ({tab === 'All' ? repairs.length : tab === 'Active' ? repairs.filter(r => r.status !== 'Collected').length : repairs.filter(r => r.status === 'Collected').length})
            </button>
          ))}
        </div>

        <input
          placeholder="Search by ID or device..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 'min(100%, 240px)', padding: '8px 12px', fontSize: 12 }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        {filtered.map(repair => (
          <div key={repair.id} className="client-repair-card">
            <div className="client-repair-top">
              <div className="client-repair-title">
                <Smartphone size={20} color="#08a4b3" />
                <div>
                  <strong>{repair.device}</strong>
                  <span style={{ marginLeft: 8 }}>#{repair.id}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`status ${repair.paid ? 'paid' : repair.status === 'Collected' ? 'ready-for-pickup' : 'awaiting-parts'}`}>
                  {repair.status}
                </span>
                <strong style={{ fontSize: 14 }}>₦{repair.estimate.toLocaleString()}</strong>
              </div>
            </div>

            <p style={{ margin: '10px 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              {repair.issue}
            </p>

            <div className="timeline" style={{ margin: '14px 0 8px' }}>
              {stages.map((stage, i) => (
                <div className={i <= repair.stageIndex ? 'done' : ''} key={stage}>
                  <span>{i <= repair.stageIndex ? '✓' : i + 1}</span>
                  <small>{stage}</small>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid #edf2f7', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#718096' }}>
                Technician: <strong>{repair.technician}</strong> · Due: <strong>{repair.dueDate}</strong>
              </span>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {onChat && (
                  <button
                    className="secondary"
                    style={{ padding: '6px 12px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => onChat(repair)}
                    title="Chat with assigned technician"
                  >
                    <MessageSquare size={13} color="#087e8e" /> Chat
                  </button>
                )}
                <button
                  className="secondary"
                  style={{ padding: '6px 12px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => onOpenInvoice(repair)}
                >
                  <FileText size={13} /> Invoice
                </button>
                {!repair.paid && repair.status !== 'Collected' && (
                  <button className="primary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => onPay(repair)}>
                    Pay ₦{repair.estimate.toLocaleString()}
                  </button>
                )}
                <button className="secondary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => onSelectRepair(repair)}>
                  Inspect details {'->'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="client-panel" style={{ textAlign: 'center', padding: 36 }}>
            <p className="muted">No repairs matched your current filter.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------- 4. MESSAGES SECTION ----------------------
function MessagesSection({
  threads,
  activeThreadId,
  onSelectThread,
  onSendMessage,
}: {
  threads: Thread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onSendMessage: (threadId: string, text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(activeThread.id, draft.trim());
    setDraft('');
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="client-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #edf2f7' }}>
        <p className="eyebrow">Direct messaging</p>
        <h1 style={{ fontSize: 24, margin: '4px 0' }}>Repair conversations</h1>
        <p className="muted" style={{ fontSize: 13 }}>Live chat with your repair technician and Kendat FixLap customer care.</p>
      </div>

      <div className="client-chat-container" style={{ margin: 0, border: 0, borderRadius: 0 }}>
        {/* Conversations List */}
        <div className="client-chat-sidebar">
          <div className="client-chat-sidebar-head">Conversations</div>
          {threads.map(thread => (
            <button
              key={thread.id}
              className={`client-thread-btn ${activeThread.id === thread.id ? 'active' : ''}`}
              onClick={() => onSelectThread(thread.id)}
            >
              <div className="client-thread-avatar">{thread.avatar}</div>
              <div className="client-thread-info">
                <div className="client-thread-top">
                  <strong>{thread.title}</strong>
                  <small>{thread.messages[thread.messages.length - 1]?.time}</small>
                </div>
                <p className="client-thread-snippet">
                  {thread.messages[thread.messages.length - 1]?.text}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Chat Thread */}
        <div className="client-chat-main">
          <div className="client-chat-header">
            <div className="client-chat-peer">
              <div className="client-thread-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                {activeThread.avatar}
              </div>
              <div>
                <strong>{activeThread.title}</strong>
                <small>{activeThread.subtitle}</small>
              </div>
            </div>
            <span className="status ready-for-pickup" style={{ fontSize: 10 }}>Active</span>
          </div>

          <div className="client-chat-messages">
            {activeThread.messages.map(msg => (
              <div
                key={msg.id}
                className={`client-bubble ${msg.from === 'client' ? 'client-bubble-outgoing' : 'client-bubble-incoming'}`}
              >
                {msg.from === 'staff' && (
                  <span className="client-bubble-author">{msg.author}</span>
                )}
                {msg.text}
                <span className="client-bubble-time">{msg.time}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form className="client-chat-composer" onSubmit={handleSend}>
            <input
              className="client-chat-input"
              placeholder={`Message ${activeThread.title}...`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
            <button type="submit" className="client-chat-send">
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------------------- 5. REFERRALS SECTION ----------------------
function ReferralSection({
  copied,
  onCopy,
  onRedeem,
}: {
  copied: boolean;
  onCopy: () => void;
  onRedeem: () => void;
}) {
  const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/fixlap') ? '/fixlap' : '';
  const link = `${window.location.origin}${basePath}/referral/sarah-johnson-7K2P`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Get ₦1,000 off your next phone or laptop repair at Kendat FixLap! Use my invite link: ${link}`
  )}`;

  return (
    <>
      {/* Referral Balance Card */}
      <div className="client-cards referral-cards">
        <div>
          <span className="card-icon amber"><Gift /></span>
          <small>Referral wallet balance</small>
          <strong>₦1,200</strong>
          <em>6 successful referrals rewarded</em>
        </div>
      </div>

      <div className="client-panel referral">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="eyebrow">Referral programme</p>
            <h1>Earn ₦200 for every successful referral.</h1>
            <p className="muted">
              When a friend you invite completes a repair above ₦5,000, you automatically earn ₦200 in reward wallet balance.
            </p>
          </div>
          <button className="primary" onClick={onRedeem}>Redeem ₦1,200 balance</button>
        </div>

        {/* Link box */}
        <div className="referral-link">
          <strong>{link}</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCopy}>{copied ? 'Copied!' : 'Copy link'}</button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                color: '#ffffff',
                background: '#25d366',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Share on WhatsApp
            </a>
          </div>
        </div>

        {/* 3 Step Visual Guide */}
        <div className="referral-steps-grid">
          <div className="referral-step-card">
            <b>1</b>
            <strong>Share your link</strong>
            <p>Send your unique invite link or QR code to friends, colleagues, or family.</p>
          </div>
          <div className="referral-step-card">
            <b>2</b>
            <strong>Friend books a repair</strong>
            <p>They get a priority diagnostic check and instant ₦1,000 voucher on first repair.</p>
          </div>
          <div className="referral-step-card">
            <b>3</b>
            <strong>You get paid</strong>
            <p>Earn ₦200 per completed repair. Use credits for free repairs or bank payout.</p>
          </div>
        </div>

        <h2>Referral activity history</h2>
        <div className="history-row">
          <strong>Michael Smith</strong>
          <span>iPhone 11 Screen repair - ₦18,000</span>
          <span className="status ready-for-pickup">+ ₦200 earned</span>
        </div>
        <div className="history-row">
          <strong>Chinedu Okeke</strong>
          <span>HP Envy Battery service - ₦24,000</span>
          <span className="status ready-for-pickup">+ ₦200 earned</span>
        </div>
        <div className="history-row">
          <strong>Fatima Bello</strong>
          <span>Samsung S21 Charging Port - ₦15,000</span>
          <span className="status ready-for-pickup">+ ₦200 earned</span>
        </div>
      </div>
    </>
  );
}

// ---------------------- 6. DOCUMENTS SECTION ----------------------
function DocumentsSection({
  repairs,
  onOpenDoc,
}: {
  repairs: RepairItem[];
  onOpenDoc: (doc: 'invoice' | 'warranty' | 'diagnostic', repair?: RepairItem) => void;
}) {
  return (
    <div className="client-panel">
      <p className="eyebrow">Documents & Receipts</p>
      <h1>Receipts, invoices & certificates</h1>
      <p className="muted">
        Inspect, print or download PDF copies of official invoices, warranty guarantees, and diagnostic reports.
      </p>

      <div className="document-list">
        {/* Dynamic official invoices for client's repairs */}
        {repairs.map(r => (
          <button key={`inv-${r.id}`} onClick={() => onOpenDoc('invoice', r)}>
            <FileText size={18} />
            <div>
              <span style={{ fontWeight: 700, display: 'block' }}>Invoice #{r.id}.pdf</span>
              <small style={{ color: '#718096', fontSize: 11 }}>{r.device} · {r.issue.split('.')[0]}</small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status ${r.paid ? 'paid' : 'awaiting-parts'}`} style={{ fontSize: 10 }}>
                {r.paid ? 'Paid' : 'Pending'}
              </span>
              <strong style={{ fontSize: 13 }}>₦{r.estimate.toLocaleString()}</strong>
            </div>
          </button>
        ))}

        <button onClick={() => onOpenDoc('warranty', repairs.find(r => r.id === 'FL-1039') || repairs[0])}>
          <ShieldCheck size={18} />
          <div>
            <span style={{ fontWeight: 700, display: 'block' }}>90-Day Workmanship Warranty Certificate</span>
            <small style={{ color: '#718096', fontSize: 11 }}>MacBook Air M1 · Valid until 4 Dec 2026</small>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status ready-for-pickup" style={{ fontSize: 10 }}>Active coverage</span>
          </div>
        </button>

        <button onClick={() => onOpenDoc('diagnostic', repairs.find(r => r.id === 'FL-1048') || repairs[0])}>
          <ClipboardList size={18} />
          <div>
            <span style={{ fontWeight: 700, display: 'block' }}>Diagnostic Technical Report FL-1048</span>
            <small style={{ color: '#718096', fontSize: 11 }}>iPhone 13 Pro · Bench multi-point test</small>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status awaiting-parts" style={{ fontSize: 10 }}>Verified report</span>
          </div>
        </button>
      </div>
    </div>
  );
}

// ---------------------- 7. SETTINGS SECTION ----------------------
function SettingsSection({
  profile,
  onSave,
}: {
  profile: {
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    notifySms: boolean;
    notifyEmail: boolean;
    notifyWhatsapp: boolean;
  };
  onSave: (updated: any) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [notifySms, setNotifySms] = useState(profile.notifySms);
  const [notifyEmail, setNotifyEmail] = useState(profile.notifyEmail);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(profile.notifyWhatsapp);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || 'Sarah Johnson',
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatar,
      notifySms,
      notifyEmail,
      notifyWhatsapp,
    });
  };

  return (
    <div className="client-panel settings-panel">
      <p className="eyebrow">Account settings</p>
      <h1>Profile & preferences</h1>
      <p className="muted">Manage your personal information, notification channels, and portal login.</p>

      <div className="settings-photo">
        <div className="profile-photo large">
          {avatar ? (
            <img src={avatar} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <UserRound size={29} />
          )}
        </div>
        <div>
          <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
            Upload profile photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <small style={{ display: 'block', marginTop: 4 }}>JPG or PNG, max 5MB</small>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="form-grid">
          <label>
            Full name
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>
            Email address
            <input value={email} type="email" onChange={e => setEmail(e.target.value)} required />
          </label>
        </div>

        <label>
          Contact phone number
          <input value={phone} onChange={e => setPhone(e.target.value)} required />
        </label>

        <h2 style={{ marginTop: 24, marginBottom: 12 }}>Notification preferences</h2>

        <label className="toggle-switch-label">
          <div>
            <strong style={{ fontSize: 13, display: 'block' }}>SMS Notifications</strong>
            <small style={{ color: '#64748b' }}>Receive instant text messages when repairs change stage.</small>
          </div>
          <input
            type="checkbox"
            className="toggle-switch-input"
            checked={notifySms}
            onChange={e => setNotifySms(e.target.checked)}
          />
        </label>

        <label className="toggle-switch-label">
          <div>
            <strong style={{ fontSize: 13, display: 'block' }}>Email Receipts & Invoices</strong>
            <small style={{ color: '#64748b' }}>Send PDF invoices and warranty notes to {email}.</small>
          </div>
          <input
            type="checkbox"
            className="toggle-switch-input"
            checked={notifyEmail}
            onChange={e => setNotifyEmail(e.target.checked)}
          />
        </label>

        <label className="toggle-switch-label">
          <div>
            <strong style={{ fontSize: 13, display: 'block' }}>WhatsApp Direct Updates</strong>
            <small style={{ color: '#64748b' }}>Get diagnostic photos and ready-for-pickup notifications on WhatsApp.</small>
          </div>
          <input
            type="checkbox"
            className="toggle-switch-input"
            checked={notifyWhatsapp}
            onChange={e => setNotifyWhatsapp(e.target.checked)}
          />
        </label>

        <h2 style={{ marginTop: 24, marginBottom: 12 }}>Security</h2>
        <label>
          New password
          <input type="password" placeholder="Leave blank to keep your current password" />
        </label>

        <button type="submit" className="primary" style={{ marginTop: 14 }}>
          Save profile changes
        </button>
      </form>
    </div>
  );
}

// ---------------------- 8. HELP CENTRE SECTION ----------------------
function HelpSection({
  repairs,
  onTrack,
  onContactSupport,
}: {
  repairs: RepairItem[];
  onTrack: (id: string) => void;
  onContactSupport: () => void;
}) {
  const [trackQuery, setTrackQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How long do typical device repairs take at Kendat FixLap?',
      a: 'Screen and battery replacements for iPhones, Samsungs, and laptops are usually completed within 2 to 4 hours on the same day. Motherboard or liquid damage repairs requiring trace diagnostics take 24 to 48 hours.',
    },
    {
      q: 'What is covered under the Kendat FixLap 90-day warranty?',
      a: 'All replacement hardware (screens, batteries, charging ports, keyboards) and technician workmanship are covered for a full 90 days. If the replaced component develops a manufacturer fault, we fix it free of charge.',
    },
    {
      q: 'How do payments work via Paystack?',
      a: 'We accept bank cards (Mastercard, Visa, Verve), instant bank transfers, and USSD via Paystack. Once our diagnostics are complete and you approve the estimate, you can pay securely online with zero extra fees.',
    },
    {
      q: 'Can I request a courier pickup and drop-off?',
      a: 'Yes! Kendat FixLap offers secure insured dispatch collection within Lagos and Abuja. Message our support desk or call 080 1234 5678 to book pickup.',
    },
    {
      q: 'What happens if my device cannot be repaired?',
      a: 'Kendat FixLap adheres to a No Fix, No Fee policy for standard component repairs. If a board is deemed beyond economical repair, you will only pay a small diagnostic fee or collect your device free.',
    },
  ];

  return (
    <>
      <div className="client-panel">
        <p className="eyebrow">Help & Support</p>
        <h1>How can we help you today?</h1>
        <p className="muted">Track a repair order, explore our warranty coverage, or chat with a technician.</p>

        {/* Live Repair Tracker Input */}
        <div className="client-tracker-box">
          <strong style={{ fontSize: 14 }}>Track repair progress</strong>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 10px' }}>
            Enter your Kendat FixLap repair reference code (e.g. <code>FL-1048</code> or <code>FL-1039</code>):
          </p>
          <div className="client-tracker-input-row">
            <input
              placeholder="e.g. FL-1048"
              value={trackQuery}
              onChange={e => setTrackQuery(e.target.value)}
            />
            <button className="primary" onClick={() => onTrack(trackQuery || 'FL-1048')}>
              Track repair
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 11, color: '#64748b' }}>
            <span>Quick try:</span>
            {repairs.slice(0, 3).map(r => (
              <button
                key={r.id}
                type="button"
                style={{ background: 'none', border: 0, padding: 0, color: '#08a4b3', textDecoration: 'underline', cursor: 'pointer', fontSize: 11 }}
                onClick={() => {
                  setTrackQuery(r.id);
                  onTrack(r.id);
                }}
              >
                #{r.id} ({r.device})
              </button>
            ))}
          </div>
        </div>

        {/* Support Grid Cards */}
        <div className="help-grid">
          <div style={{ cursor: 'pointer' }} onClick={() => onTrack('FL-1048')}>
            <HelpCircle size={20} />
            <strong>Track an active repair</strong>
            <span>Check diagnostics, parts status, and collection ETA.</span>
          </div>

          <div style={{ cursor: 'pointer' }} onClick={onContactSupport}>
            <MessageSquare size={20} />
            <strong>Contact support & workshop</strong>
            <span>Send a direct note to your technician or dispatch desk.</span>
          </div>

          <div style={{ cursor: 'pointer' }} onClick={() => setOpenFaq(1)}>
            <ShieldCheck size={20} />
            <strong>90-day warranty claims</strong>
            <span>Understand what is covered under our workmanship guarantee.</span>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="client-panel" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 14 }}>Frequently asked questions</h2>
        <div>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-accordion-trigger"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} />
                </button>
                {isOpen && (
                  <div className="faq-accordion-content">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ---------------------- 9. REPAIR DETAILS MODAL ----------------------
function RepairDetailModal({
  repair,
  onClose,
  onPay,
  onOpenInvoice,
  onChatTechnician,
}: {
  repair: RepairItem;
  onClose: () => void;
  onPay: () => void;
  onOpenInvoice: (r: RepairItem) => void;
  onChatTechnician?: (r: RepairItem) => void;
}) {
  return (
    <div className="client-modal-overlay" onClick={onClose}>
      <div className="client-modal-card" onClick={e => e.stopPropagation()}>
        <div className="client-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={20} color="#08a4b3" />
            <div>
              <h3 style={{ margin: 0, fontSize: 17 }}>Repair #{repair.id}</h3>
              <small style={{ color: '#64748b' }}>{repair.device}</small>
            </div>
          </div>
          <button className="client-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="client-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className={`status ${repair.paid ? 'paid' : repair.status === 'Collected' ? 'ready-for-pickup' : 'awaiting-parts'}`}>
              {repair.status}
            </span>
            <strong style={{ fontSize: 18 }}>₦{repair.estimate.toLocaleString()}</strong>
          </div>

          <div className="doc-sheet" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, display: 'grid', gap: 6 }}>
              <div><span style={{ color: '#64748b' }}>Issue: </span><strong>{repair.issue}</strong></div>
              <div><span style={{ color: '#64748b' }}>Assigned Technician: </span><strong>{repair.technician}</strong></div>
              <div><span style={{ color: '#64748b' }}>Drop-off date: </span><strong>{repair.dropoffDate}</strong></div>
              <div><span style={{ color: '#64748b' }}>Estimated readiness: </span><strong>{repair.dueDate}</strong></div>
            </div>
          </div>

          <h4 style={{ fontSize: 13, marginBottom: 8 }}>Repair progress timeline</h4>
          <div className="timeline" style={{ margin: '14px 0 16px' }}>
            {stages.map((stage, i) => (
              <div className={i <= repair.stageIndex ? 'done' : ''} key={stage}>
                <span>{i <= repair.stageIndex ? '✓' : i + 1}</span>
                <small>{stage}</small>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569', marginBottom: 18 }}>
            <strong>Latest technician log: </strong>{repair.notes}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            {onChatTechnician && (
              <button
                className="secondary"
                onClick={() => onChatTechnician(repair)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <MessageSquare size={15} color="#087e8e" /> Message Technician
              </button>
            )}
            <button
              className="secondary"
              onClick={() => onOpenInvoice(repair)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FileText size={15} /> View & Print Invoice
            </button>
            {!repair.paid && repair.status !== 'Collected' && (
              <button className="primary" onClick={onPay}>
                Pay ₦{repair.estimate.toLocaleString()} with Paystack
              </button>
            )}
            <button className="secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------- 10. DOCUMENT MODAL (INVOICE, WARRANTY, DIAGNOSTIC) ----------------------
function DocumentModal({
  docType,
  clientName,
  repair,
  onClose,
  onPrint,
  onDownload,
}: {
  docType: 'invoice' | 'warranty' | 'diagnostic';
  clientName: string;
  repair: RepairItem;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="client-modal-overlay" onClick={onClose}>
      <div className="client-modal-card" onClick={e => e.stopPropagation()}>
        <div className="client-modal-head">
          <h3>
            {docType === 'invoice' && `Official Invoice #${repair.id}`}
            {docType === 'warranty' && `90-Day Workmanship Warranty (#${repair.id})`}
            {docType === 'diagnostic' && `Technical Diagnostic Report #${repair.id}`}
          </h3>
          <button className="client-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="client-modal-body">
          {/* Printable Document Sheet - captured exclusively during window.print() */}
          <div className="doc-sheet" id="printable-invoice">
            <div className="doc-header">
              <div className="doc-brand">
                <BrandLogo size="sm" />
              </div>
              <span className="doc-badge">
                {docType === 'invoice' ? 'OFFICIAL INVOICE' : docType === 'warranty' ? 'WARRANTY CERTIFICATE' : 'DIAGNOSTIC REPORT'}
              </span>
            </div>

            {docType === 'invoice' && (
              <>
                <div className="doc-meta-grid">
                  <div>
                    <span>INVOICE NUMBER:</span>
                    <strong>INV-{repair.id}-2026</strong>
                  </div>
                  <div>
                    <span>DATE ISSUED:</span>
                    <strong>{repair.dropoffDate || '04 September 2026'}</strong>
                  </div>
                  <div>
                    <span>BILLED TO:</span>
                    <strong>{clientName}</strong>
                  </div>
                  <div>
                    <span>PAYMENT METHOD:</span>
                    <strong>{repair.paid ? 'Paystack Online Card (Paid)' : 'Pending Paystack Card/Transfer'}</strong>
                  </div>
                  <div>
                    <span>DEVICE SERVICED:</span>
                    <strong style={{ color: '#08a4b3' }}>{repair.device}</strong>
                  </div>
                  <div>
                    <span>PAYMENT STATUS:</span>
                    <span className={`status ${repair.paid ? 'paid' : 'awaiting-parts'}`} style={{ display: 'inline-block', fontSize: 10, marginTop: 2 }}>
                      {repair.paid ? 'Paid' : 'Awaiting payment'}
                    </span>
                  </div>
                </div>

                <div className="doc-table-wrapper">
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{repair.device} OEM Replacement Component ({repair.issue.split('.')[0]})</td>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'right' }}>₦{Math.round(repair.estimate * 0.78).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Precision technician diagnostic bench testing & workmanship labour</td>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'right' }}>₦{Math.round(repair.estimate * 0.22).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="doc-total">
                  <span>{repair.paid ? 'Total Paid:' : 'Total Due:'}</span>
                  <strong style={{ color: '#08a4b3' }}>₦{repair.estimate.toLocaleString()}</strong>
                </div>

                <div className="doc-invoice-seal-section">
                  <div className="doc-invoice-seal-details">
                    <p className="doc-invoice-seal-title">KENDAT FIXLAP OFFICIAL INVOICE</p>
                    <p className="doc-invoice-seal-sub">Authorized Computer & Mobile Device Service Center</p>
                    <p className="doc-invoice-seal-meta">No 2 INIKPIST, Makurdi, Benue State · Tel: +234 703 836 7322</p>
                    <p className="doc-invoice-guarantee">✓ 90-Day Comprehensive Warranty Coverage Included</p>
                  </div>
                  <div className="doc-invoice-stamp-wrapper">
                    <img 
                      src="/images/kendat-fixlap-stamp.png" 
                      alt="Kendat FixLap Official Paid Stamp" 
                      className="doc-invoice-stamp-img" 
                    />
                  </div>
                </div>
              </>
            )}

            {docType === 'warranty' && (
              <>
                <div className="doc-meta-grid">
                  <div>
                    <span>CERTIFICATE ID:</span>
                    <strong>WAR-FL-90D-{repair.id.replace('FL-', '')}</strong>
                  </div>
                  <div>
                    <span>COVERED DEVICE:</span>
                    <strong>{repair.device}</strong>
                  </div>
                  <div>
                    <span>OWNER:</span>
                    <strong>{clientName}</strong>
                  </div>
                  <div>
                    <span>COVERAGE DURATION:</span>
                    <strong>90 Days (Valid until 4 Dec 2026)</strong>
                  </div>
                </div>

                <p style={{ fontSize: 12, lineHeight: 1.6, color: '#64748b' }}>
                  This certificate confirms that the component replacement and repair services performed on
                  work order #{repair.id} are covered against defects in materials and workmanship under Kendat FixLap's standard
                  warranty policy.
                </p>

                <div style={{ marginTop: 14, padding: 12, background: '#eafaf9', borderRadius: 8, fontSize: 12, color: '#09707b' }}>
                  ✓ Includes replacement hardware, power health testing, and free labour if re-service is required.
                </div>
              </>
            )}

            {docType === 'diagnostic' && (
              <>
                <div className="doc-meta-grid">
                  <div>
                    <span>REPORT ID:</span>
                    <strong>DIAG-{repair.id}</strong>
                  </div>
                  <div>
                    <span>TARGET DEVICE:</span>
                    <strong>{repair.device}</strong>
                  </div>
                  <div>
                    <span>CUSTOMER:</span>
                    <strong>{clientName}</strong>
                  </div>
                  <div>
                    <span>TECHNICIAN:</span>
                    <strong>{repair.technician}</strong>
                  </div>
                </div>

                <div className="doc-table-wrapper">
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th>Diagnostic Test Module</th>
                        <th style={{ textAlign: 'right' }}>Bench Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Display Panel & Touch Digitizer</td>
                        <td><span className="status awaiting-parts" style={{ fontSize: 10 }}>FAILED (Service required)</span></td>
                      </tr>
                      <tr>
                        <td>Sensors & Camera Integration</td>
                        <td><span className="status ready-for-pickup" style={{ fontSize: 10 }}>PASSED (Intact)</span></td>
                      </tr>
                      <tr>
                        <td>Battery Health & Voltage Regulation</td>
                        <td><span className="status ready-for-pickup" style={{ fontSize: 10 }}>PASSED (Optimal)</span></td>
                      </tr>
                      <tr>
                        <td>Motherboard Trace & Power Rails</td>
                        <td><span className="status ready-for-pickup" style={{ fontSize: 10 }}>PASSED (No shorts detected)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
                  <strong>Technician recommendation: </strong>
                  {repair.notes}
                </p>
              </>
            )}
          </div>

          <div className="doc-actions">
            <button className="secondary" onClick={onPrint} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Printer size={15} /> Print document
            </button>
            <button className="primary" onClick={onDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Download size={15} /> Save PDF copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
