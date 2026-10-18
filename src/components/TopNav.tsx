import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Plus,
  List,
  UserCheck,
  Shield,
  Scale,
  TrendingDown,
  Mail,
  BookOpen,
  Archive,
  Landmark,
  ExternalLink,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTenant } from '../contexts/TenantContext';
import { useData } from '../contexts/DataContext';
import { formatIndianDate } from '../utils/dateFormat';

const ECOURTS_URL = 'https://services.ecourts.gov.in/ecourtindia_v6/?p=cause_list/index';
const ACCENT = 'rgb(161 161 170)'; // was gold — now grey, matching the all-monochrome UI

// Key for storing viewed notifications in localStorage
const VIEWED_NOTIFICATIONS_KEY = 'viewedNotifications';
const NOTIFICATION_EXPIRY_HOURS = 24;

/**
 * TopNav — replaces the previous Sidebar + Header pairing with a single
 * horizontal navigation shell: a top bar (wordmark, primary nav pills,
 * search, notifications, profile) plus a contextual sub-strip that shows
 * section-specific links (Office Cases / Administration) only when
 * relevant. Mobile collapses the primary nav into a full-screen overlay
 * instead of a sliding drawer.
 *
 * All data wiring (auth, tenant, search, notifications) is carried over
 * unchanged from the old Sidebar/Header — only the arrangement changed.
 */
const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { branding, tenant } = useTenant();
  const { cases, counsel, appointments, tasks, expenses } = useData();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<Set<string>>(new Set());
  const notificationRef = useRef<HTMLDivElement>(null);

  const whiteLabel = !!(branding?.white_label_active && tenant?.plan === 'custom');
  const firmName = branding?.firm_display_name || tenant?.firm_name || 'Your Firm';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;
  const isUnder = (prefix: string) => location.pathname.startsWith(prefix);

  const primaryNav = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Cases', path: '/cases' },
    { icon: UserCheck, label: 'Tasks', path: '/tasks' },
    { icon: UserCheck, label: 'Attendance', path: '/attendance' },
    { icon: Users, label: 'Appointments', path: '/appointments' },
    { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
    { icon: BookOpen, label: 'Library', path: '/library' },
    { icon: Archive, label: 'Storage', path: '/storage' },
  ];

  const officeCasesSubmenu = [
    { icon: Plus, label: 'Create Case', path: '/cases/create' },
    { icon: List, label: 'List Cases', path: '/cases' },
    { icon: Scale, label: 'Council Cases', path: '/counsel/cases' },
  ];

  const adminMenuItems = [
    { icon: Mail, label: 'Reminders', path: '/reminders' },
    { icon: Shield, label: 'Admin Panel', path: '/admin' },
  ];

  // Show the contextual sub-strip only while inside case-management or
  // admin-only routes — otherwise the top bar stays a single slim row.
  const showCaseSubstrip = isUnder('/cases') || isUnder('/counsel');
  const showAdminSubstrip = isAdmin && (isUnder('/reminders') || isUnder('/admin'));

  // ---- Notifications (carried over from the old Header, unchanged) ----
  useEffect(() => {
    const stored = localStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const validEntries = Object.entries(parsed).filter(([, timestamp]) => {
          return now - (timestamp as number) < NOTIFICATION_EXPIRY_HOURS * 60 * 60 * 1000;
        });
        const validIds = new Set(validEntries.map(([id]) => id));
        setViewedNotifications(validIds);
        localStorage.setItem(VIEWED_NOTIFICATIONS_KEY, JSON.stringify(Object.fromEntries(validEntries)));
      } catch {
        setViewedNotifications(new Set());
      }
    }
  }, []);

  const markNotificationsAsViewed = (notificationIds: string[]) => {
    const stored = localStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    const existing = stored ? JSON.parse(stored) : {};
    const now = Date.now();
    notificationIds.forEach((id) => { existing[id] = now; });
    localStorage.setItem(VIEWED_NOTIFICATIONS_KEY, JSON.stringify(existing));
    setViewedNotifications(new Set(Object.keys(existing)));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const notifications = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - NOTIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    const notifs: Array<{ id: string; refId?: string; type: 'case' | 'task' | 'appointment' | 'expense' | 'book' | 'sofa'; title: string; description: string; time: Date; icon: string; }> = [];

    cases.filter(c => new Date(c.createdAt) > oneDayAgo).forEach(c => {
      notifs.push({ id: `case-${c.id}`, refId: c.id, type: 'case', title: 'New Case Added', description: `${c.clientName} - ${c.fileNo}`, time: new Date(c.createdAt), icon: '⚖️' });
    });

    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    tasks.filter(t => t.status === 'pending' && new Date(t.deadline) <= threeDaysFromNow && new Date(t.createdAt) > oneDayAgo).forEach(t => {
      notifs.push({ id: `task-due-${t.id}`, type: 'task', title: 'Task Due Soon', description: `${t.title} - Due: ${formatIndianDate(t.deadline)}`, time: new Date(t.deadline), icon: '📋' });
    });

    tasks.filter(t => new Date(t.createdAt) > oneDayAgo && t.assignedTo === user?.id).forEach(t => {
      notifs.push({ id: `assigned-${t.id}`, type: 'task', title: '🔔 New Task Assigned to You', description: `${t.title} by ${t.assignedByName || 'Admin'} - Due: ${formatIndianDate(t.deadline)}`, time: new Date(t.createdAt), icon: '✅' });
    });

    appointments.filter(a => new Date(a.date) >= now && new Date(a.date) <= threeDaysFromNow && new Date(a.createdAt) > oneDayAgo).forEach(a => {
      notifs.push({ id: `apt-${a.id}`, type: 'appointment', title: 'Upcoming Appointment', description: `${a.client} - ${formatIndianDate(a.date)} at ${a.time}`, time: new Date(a.date), icon: '📅' });
    });

    expenses.filter(e => new Date(e.createdAt) > oneDayAgo).forEach(e => {
      notifs.push({ id: `exp-${e.id}`, type: 'expense', title: 'New Expense Added', description: `₹${e.amount.toLocaleString()} - ${e.description}`, time: new Date(e.createdAt), icon: '💰' });
    });

    return notifs.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
  }, [cases, tasks, appointments, expenses, user?.id]);

  const unreadCount = useMemo(() => notifications.filter(n => !viewedNotifications.has(n.id)).length, [notifications, viewedNotifications]);

  // ---- Search (carried over from the old Header, unchanged) ----
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { cases: [], counsel: [], appointments: [], tasks: [], expenses: [] };
    const term = searchTerm.toLowerCase();
    return {
      cases: cases.filter(c => c.clientName.toLowerCase().includes(term) || c.fileNo.toLowerCase().includes(term) || c.partiesName.toLowerCase().includes(term) || c.caseType.toLowerCase().includes(term)).slice(0, 5),
      counsel: counsel.filter(c => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)).slice(0, 5),
      appointments: appointments.filter(a => a.client.toLowerCase().includes(term) || a.details.toLowerCase().includes(term)).slice(0, 5),
      tasks: tasks.filter(t => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term) || t.assignedToName.toLowerCase().includes(term)).slice(0, 5),
      expenses: expenses.filter(e => e.description.toLowerCase().includes(term)).slice(0, 5),
    };
  }, [searchTerm, cases, counsel, appointments, tasks, expenses]);

  const handleResultClick = (type: 'case' | 'counsel' | 'appointment' | 'task' | 'expense', id: string) => {
    setSearchTerm('');
    setShowResults(false);
    switch (type) {
      case 'case': navigate(`/cases/${id}`); break;
      case 'counsel': navigate('/counsel'); break;
      case 'appointment': navigate('/appointments'); break;
      case 'task': navigate('/tasks'); break;
      case 'expense': navigate('/expenses'); break;
    }
  };

  const barBg = theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#0f0f10] border-white/10';
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const secondaryText = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const hoverClass = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5';
  const inputBgClass = theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500' : 'bg-white/[0.04] border-white/10 text-white placeholder-gray-400';
  const pillActive = theme === 'light' ? 'text-gray-900' : 'text-white';

  return (
    <>
      {/* ───────── Row 1: wordmark · primary nav · search · actions ───────── */}
      <header className={`${barBg} border-b sticky top-0 z-40`}>
        <div className="flex items-center gap-3 px-4 md:px-6 h-16">
          {/* Mobile menu toggle */}
          <button onClick={() => setMobileMenuOpen(true)} className={`lg:hidden p-2 rounded-sm ${hoverClass}`}>
            <Menu size={20} strokeWidth={1.75} className={textClass} />
          </button>

          {/* Wordmark */}
          <Link to="/dashboard" className="flex-shrink-0">
            {whiteLabel ? (
              <span className={`font-display text-lg font-semibold tracking-tight ${textClass}`}>{firmName}</span>
            ) : (
              <span className={`font-display text-lg font-semibold tracking-tight ${textClass}`}>
                Vakil<span style={{ color: ACCENT }}>Desk</span>
              </span>
            )}
          </Link>

          {/* Primary nav — horizontal pills, desktop only */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-4 overflow-x-auto">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = item.path === '/cases' ? showCaseSubstrip : isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? pillActive : `${secondaryText} ${hoverClass}`
                  }`}
                  style={active ? { borderBottom: `2px solid ${ACCENT}` } : undefined}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden sm:block w-48 md:w-64">
            <Search size={14} strokeWidth={1.75} className={`absolute left-3 top-1/2 -translate-y-1/2 ${secondaryText}`} />
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className={`w-full pl-9 pr-3 py-2 ${inputBgClass} border rounded-sm focus:outline-none transition-colors text-sm`}
            />

            {showResults && searchTerm && (() => {
              const hasResults = searchResults.cases.length > 0 || searchResults.counsel.length > 0 || searchResults.appointments.length > 0 || searchResults.tasks.length > 0 || searchResults.expenses.length > 0;
              return (
                <div className={`absolute top-full right-0 mt-2 w-80 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#18181b] border-white/10'} border rounded-sm shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto`}>
                  {!hasResults && <div className="px-4 py-6 text-center"><p className={`text-sm ${secondaryText}`}>No results found</p></div>}
                  {searchResults.cases.length > 0 && (
                    <div>
                      <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Cases</p>
                      {searchResults.cases.map(c => (
                        <button key={c.id} onClick={() => handleResultClick('case', c.id)} className={`w-full px-4 py-3 text-left ${hoverClass} transition-colors`}>
                          <p className={`font-medium text-sm ${textClass}`}>{c.clientName}</p>
                          <p className={`text-xs ${secondaryText}`}>File: {c.fileNo} | {c.caseType}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.counsel.length > 0 && (
                    <div>
                      <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Counsel</p>
                      {searchResults.counsel.map(c => (
                        <button key={c.id} onClick={() => handleResultClick('counsel', c.id)} className={`w-full px-4 py-3 text-left ${hoverClass} transition-colors`}>
                          <p className={`font-medium text-sm ${textClass}`}>{c.name}</p>
                          <p className={`text-xs ${secondaryText}`}>{c.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.appointments.length > 0 && (
                    <div>
                      <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Appointments</p>
                      {searchResults.appointments.map(a => (
                        <button key={a.id} onClick={() => handleResultClick('appointment', a.id)} className={`w-full px-4 py-3 text-left ${hoverClass} transition-colors`}>
                          <p className={`font-medium text-sm ${textClass}`}>{a.client}</p>
                          <p className={`text-xs ${secondaryText}`}>{formatIndianDate(a.date)} | {a.time}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.tasks.length > 0 && (
                    <div>
                      <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Tasks</p>
                      {searchResults.tasks.map(t => (
                        <button key={t.id} onClick={() => handleResultClick('task', t.id)} className={`w-full px-4 py-3 text-left ${hoverClass} transition-colors`}>
                          <p className={`font-medium text-sm ${textClass}`}>{t.title}</p>
                          <p className={`text-xs ${secondaryText}`}>Assigned to: {t.assignedToName} | Due: {formatIndianDate(t.deadline)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.expenses.length > 0 && (
                    <div>
                      <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Expenses</p>
                      {searchResults.expenses.map(e => (
                        <button key={e.id} onClick={() => handleResultClick('expense', e.id)} className={`w-full px-4 py-3 text-left ${hoverClass} transition-colors`}>
                          <p className={`font-medium text-sm ${textClass}`}>{e.description}</p>
                          <p className={`text-xs ${secondaryText}`}>₹{e.amount.toLocaleString()} | {e.month}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && notifications.length > 0) markNotificationsAsViewed(notifications.map(n => n.id));
              }}
              className={`relative p-2 rounded-sm transition-colors ${hoverClass}`}
            >
              <Bell size={18} strokeWidth={1.75} className={textClass} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#0f0f10]" style={{ backgroundColor: ACCENT }} />}
            </button>

            {showNotifications && (
              <div className={`fixed left-3 right-3 top-16 w-auto md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#18181b] border-white/10'} border rounded-sm shadow-2xl z-[9999] overflow-hidden max-h-96 overflow-y-auto`}>
                <div className={`px-4 py-3 border-b ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                  <h3 className={`font-semibold text-sm ${textClass}`}>Notifications</h3>
                  <p className={`text-xs ${secondaryText}`}>{notifications.length} updates (auto-clears after 24h)</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={28} strokeWidth={1.5} className={`mx-auto mb-2 ${secondaryText}`} />
                    <p className={`text-sm ${secondaryText}`}>No new notifications</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b ${theme === 'light' ? 'border-gray-100' : 'border-white/5'} ${hoverClass} transition-colors cursor-pointer`}
                        onClick={() => {
                          setShowNotifications(false);
                          switch (notif.type) {
                            case 'case': navigate(`/cases/${notif.refId}`); break;
                            case 'task': navigate('/tasks'); break;
                            case 'appointment': navigate('/appointments'); break;
                            case 'expense': navigate('/expenses'); break;
                            case 'book': navigate('/library/books'); break;
                            case 'sofa': navigate('/library/sofa'); break;
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{notif.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${textClass}`}>{notif.title}</p>
                            <p className={`text-xs ${secondaryText} truncate`}>{notif.description}</p>
                            <p className={`text-xs ${secondaryText} mt-1`}>
                              {(() => {
                                const diff = Date.now() - notif.time.getTime();
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                const days = Math.floor(hours / 24);
                                if (days > 0) return `${days}d ago`;
                                if (hours > 0) return `${hours}h ago`;
                                return 'Just now';
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={`px-4 py-2.5 text-center border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                  <button onClick={() => setShowNotifications(false)} className="text-xs font-medium" style={{ color: ACCENT }}>Close</button>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className={`p-2 rounded-sm border transition-colors ${theme === 'light' ? 'border-gray-200 hover:bg-gray-100' : 'border-white/10 hover:bg-white/5'}`}>
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.75} className={textClass} /> : <Moon size={16} strokeWidth={1.75} className={textClass} />}
          </button>

          {/* Profile */}
          <div className={`w-9 h-9 rounded-sm flex items-center justify-center border font-display flex-shrink-0 ${theme === 'light' ? 'bg-gray-900 border-gray-900' : 'bg-white/10 border-white/15'}`}>
            <span className="text-white font-semibold text-sm">{user?.name?.charAt(0) || 'U'}</span>
          </div>
        </div>
      </header>

      {/* ───────── Row 2: contextual sub-strip (only when relevant) ───────── */}
      {(showCaseSubstrip || showAdminSubstrip) && (
        <div className={`${barBg} border-b hidden lg:block`}>
          <div className="flex items-center gap-1 px-4 md:px-6 h-11">
            {showCaseSubstrip && officeCasesSubmenu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${active ? pillActive : `${secondaryText} ${hoverClass}`}`} style={active ? { backgroundColor: theme === 'light' ? '#f4f4f5' : 'rgba(255,255,255,0.06)' } : undefined}>
                  <Icon size={13} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
            {showAdminSubstrip && adminMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${active ? pillActive : `${secondaryText} ${hoverClass}`}`} style={active ? { backgroundColor: theme === 'light' ? '#f4f4f5' : 'rgba(255,255,255,0.06)' } : undefined}>
                  <Icon size={13} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────── Mobile full-screen nav overlay ───────── */}
      {mobileMenuOpen && (
        <div className={`fixed inset-0 z-[9999] lg:hidden ${theme === 'light' ? 'bg-white' : 'bg-[#0f0f10]'}`}>
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
            <span className={`font-display text-lg font-semibold ${textClass}`}>Vakil<span style={{ color: ACCENT }}>Desk</span></span>
            <button onClick={() => setMobileMenuOpen(false)} className={`p-2 rounded-sm ${hoverClass}`}>
              <X size={20} className={textClass} />
            </button>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
            <p className={`text-[10px] uppercase tracking-[0.18em] font-mono-ui ${secondaryText} px-3 py-2`}>Main</p>
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium ${active ? pillActive : `${secondaryText}`} ${hoverClass}`}>
                  <Icon size={18} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium ${secondaryText} ${hoverClass}`}>
              <Settings size={18} strokeWidth={1.75} />
              Settings
            </Link>
            <a href={ECOURTS_URL} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium ${secondaryText} ${hoverClass}`}>
              <Landmark size={18} strokeWidth={1.75} />
              <span className="flex-1">eCourts Cause List</span>
              <ExternalLink size={13} className="opacity-50" />
            </a>

            <p className={`text-[10px] uppercase tracking-[0.18em] font-mono-ui ${secondaryText} px-3 py-2 mt-4`}>Case Management</p>
            {officeCasesSubmenu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium ${active ? pillActive : `${secondaryText}`} ${hoverClass}`}>
                  <Icon size={18} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <p className={`text-[10px] uppercase tracking-[0.18em] font-mono-ui ${secondaryText} px-3 py-2 mt-4`}>Administration</p>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium ${active ? pillActive : `${secondaryText}`} ${hoverClass}`}>
                      <Icon size={18} strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}

            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-medium text-red-500 hover:bg-red-500/10 mt-4">
              <LogOut size={18} strokeWidth={1.75} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </>
  );
};

export default TopNav;
