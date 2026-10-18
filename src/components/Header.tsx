import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Bell, Search, Scale, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatIndianDate } from '../utils/dateFormat';

interface HeaderProps {
  onMenuClick: () => void;
}

// Key for storing viewed notifications in localStorage
const VIEWED_NOTIFICATIONS_KEY = 'viewedNotifications';
const NOTIFICATION_EXPIRY_HOURS = 24;

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const { cases, counsel, appointments, tasks, expenses } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<Set<string>>(new Set());
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Load viewed notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out expired entries (older than 24 hours)
        const now = Date.now();
        const validEntries = Object.entries(parsed).filter(([_, timestamp]) => {
          return now - (timestamp as number) < NOTIFICATION_EXPIRY_HOURS * 60 * 60 * 1000;
        });
        const validIds = new Set(validEntries.map(([id]) => id));
        setViewedNotifications(validIds);
        // Update localStorage with only valid entries
        localStorage.setItem(VIEWED_NOTIFICATIONS_KEY, JSON.stringify(Object.fromEntries(validEntries)));
      } catch {
        setViewedNotifications(new Set());
      }
    }
  }, []);
  
  // Mark notifications as viewed when dropdown is opened
  const markNotificationsAsViewed = (notificationIds: string[]) => {
    const stored = localStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    const existing = stored ? JSON.parse(stored) : {};
    const now = Date.now();
    
    notificationIds.forEach(id => {
      existing[id] = now;
    });
    
    localStorage.setItem(VIEWED_NOTIFICATIONS_KEY, JSON.stringify(existing));
    setViewedNotifications(new Set(Object.keys(existing)));
  };
  
  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Generate notifications from recent activity (only within 24 hours)
  const notifications = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - NOTIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    
    const notifs: Array<{
      id: string;
      /** The real record id to navigate to (id alone is prefixed, e.g. "case-<uuid>") */
      refId?: string;
      type: 'case' | 'task' | 'appointment' | 'expense' | 'book' | 'sofa';
      title: string;
      description: string;
      time: Date;
      icon: string;
    }> = [];
    
    // Recent cases (last 24 hours only)
    cases
      .filter(c => new Date(c.createdAt) > oneDayAgo)
      .forEach(c => {
        notifs.push({
          id: `case-${c.id}`,
          refId: c.id,
          type: 'case',
          title: 'New Case Added',
          description: `${c.clientName} - ${c.fileNo}`,
          time: new Date(c.createdAt),
          icon: '⚖️'
        });
      });
    
    // Upcoming tasks (next 3 days) - but only show if created within 24 hours
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    tasks
      .filter(t => t.status === 'pending' && new Date(t.deadline) <= threeDaysFromNow && new Date(t.createdAt) > oneDayAgo)
      .forEach(t => {
        notifs.push({
          id: `task-due-${t.id}`,
          type: 'task',
          title: 'Task Due Soon',
          description: `${t.title} - Due: ${formatIndianDate(t.deadline)}`,
          time: new Date(t.deadline),
          icon: '📋'
        });
      });
    
    // Recently assigned tasks (last 24 hours) - for task assignment notifications
    tasks
      .filter(t => new Date(t.createdAt) > oneDayAgo && t.assignedTo === user?.id)
      .forEach(t => {
        notifs.push({
          id: `assigned-${t.id}`,
          type: 'task',
          title: '🔔 New Task Assigned to You',
          description: `${t.title} by ${t.assignedByName || 'Admin'} - Due: ${formatIndianDate(t.deadline)}`,
          time: new Date(t.createdAt),
          icon: '✅'
        });
      });
    
    // Upcoming appointments (next 3 days) - but only show if created within 24 hours
    appointments
      .filter(a => new Date(a.date) >= now && new Date(a.date) <= threeDaysFromNow && new Date(a.createdAt) > oneDayAgo)
      .forEach(a => {
        notifs.push({
          id: `apt-${a.id}`,
          type: 'appointment',
          title: 'Upcoming Appointment',
          description: `${a.client} - ${formatIndianDate(a.date)} at ${a.time}`,
          time: new Date(a.date),
          icon: '📅'
        });
      });
    
    // Recent expenses (last 24 hours)
    expenses
      .filter(e => new Date(e.createdAt) > oneDayAgo)
      .forEach(e => {
        notifs.push({
          id: `exp-${e.id}`,
          type: 'expense',
          title: 'New Expense Added',
          description: `₹${e.amount.toLocaleString()} - ${e.description}`,
          time: new Date(e.createdAt),
          icon: '💰'
        });
      });
    
    // Sort by time (most recent first)
    return notifs.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
  }, [cases, tasks, appointments, expenses, user?.id]);
  
  // Count unread notifications (not viewed yet)
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !viewedNotifications.has(n.id)).length;
  }, [notifications, viewedNotifications]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { 
      cases: [], 
      counsel: [], 
      appointments: [], 
      tasks: [], 
      expenses: [], 
    };
    
    const term = searchTerm.toLowerCase();
    
    // Search cases: client name, file number, parties name, case type
    const matchedCases = cases.filter(c => 
      c.clientName.toLowerCase().includes(term) ||
      c.fileNo.toLowerCase().includes(term) ||
      c.partiesName.toLowerCase().includes(term) ||
      c.caseType.toLowerCase().includes(term)
    ).slice(0, 5);
    
    // Search counsel: name, email
    const matchedCounsel = counsel.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    ).slice(0, 5);
    
    // Search appointments: client name, details
    const matchedAppointments = appointments.filter(a =>
      a.client.toLowerCase().includes(term) ||
      a.details.toLowerCase().includes(term)
    ).slice(0, 5);
    
    // Search tasks: title, description, assigned to name
    const matchedTasks = tasks.filter(t =>
      t.title.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      t.assignedToName.toLowerCase().includes(term)
    ).slice(0, 5);
    
    // Search expenses: description
    const matchedExpenses = expenses.filter(e =>
      e.description.toLowerCase().includes(term)
    ).slice(0, 5);
    
    return {
      cases: matchedCases,
      counsel: matchedCounsel,
      appointments: matchedAppointments,
      tasks: matchedTasks,
      expenses: matchedExpenses,
    };
  }, [searchTerm, cases, counsel, appointments, tasks, expenses]);

  const handleResultClick = (type: 'case' | 'counsel' | 'appointment' | 'task' | 'expense', id: string) => {
    setSearchTerm('');
    setShowResults(false);
    
    switch (type) {
      case 'case':
        navigate(`/cases/${id}`);
        break;
      case 'counsel':
        navigate('/counsel');
        break;
      case 'appointment':
        navigate('/appointments');
        break;
      case 'task':
        navigate('/tasks');
        break;
      case 'expense':
        navigate('/expenses');
        break;
    }
  };

  const bgClass = theme === 'light'
    ? 'bg-white border-gray-200'
    : 'bg-[#0f0f10] border-white/10';
  const inputBgClass = theme === 'light'
    ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
    : 'bg-white/[0.04] border-white/10 text-white placeholder-gray-400';
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const secondaryText = theme === 'light' ? 'text-gray-600' : 'text-gray-400';

  return (
    <header className={`${bgClass} border-b px-4 md:px-6 py-3.5 flex items-center justify-between gap-4 relative z-50`}>
      {/* Left - Menu */}
      <button
        onClick={onMenuClick}
        className={`p-2.5 rounded-sm transition-colors duration-150 ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'} group`}
      >
        <Menu size={20} strokeWidth={1.75} className={`${textClass} transition-colors`} />
      </button>

      {/* Center - Search */}
      <div className="flex-1 max-w-xl mx-2 md:mx-4">
        <div className="relative group">
          <div className="relative">
            <Search size={15} strokeWidth={1.75} className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 ${secondaryText} transition-colors`} />
            <input
              type="text"
              placeholder="Search cases, clients, tasks…"
              value={searchTerm}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className={`w-full pl-10 md:pl-11 pr-8 md:pr-10 py-2 md:py-2.5 ${inputBgClass} border rounded-sm focus:outline-none transition-colors text-sm`}
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setShowResults(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && searchTerm && (() => {
            const hasResults = searchResults.cases.length > 0 || 
                              searchResults.counsel.length > 0 || 
                              searchResults.appointments.length > 0 || 
                              searchResults.tasks.length > 0 || 
                              searchResults.expenses.length > 0;
            
            return (
              <div className={`absolute top-full left-0 right-0 mt-2 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#18181b] border-white/10'} border rounded-sm shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto`}>
                {!hasResults && (
                  <div className="px-4 py-6 text-center">
                    <p className={`text-sm ${secondaryText}`}>No results found</p>
                  </div>
                )}
                
                {/* Cases */}
                {searchResults.cases.length > 0 && (
                  <div>
                    <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Cases</p>
                    {searchResults.cases.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleResultClick('case', c.id)}
                        className={`w-full px-4 py-3 text-left ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-colors`}
                      >
                        <p className={`font-medium ${textClass}`}>{c.clientName}</p>
                        <p className={`text-xs ${secondaryText}`}>File: {c.fileNo} | {c.caseType}</p>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Counsel */}
                {searchResults.counsel.length > 0 && (
                  <div>
                    <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Counsel</p>
                    {searchResults.counsel.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleResultClick('counsel', c.id)}
                        className={`w-full px-4 py-3 text-left ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-colors`}
                      >
                        <p className={`font-medium ${textClass}`}>{c.name}</p>
                        <p className={`text-xs ${secondaryText}`}>{c.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Appointments */}
                {searchResults.appointments.length > 0 && (
                  <div>
                    <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Appointments</p>
                    {searchResults.appointments.map(a => (
                      <button
                        key={a.id}
                        onClick={() => handleResultClick('appointment', a.id)}
                        className={`w-full px-4 py-3 text-left ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-colors`}
                      >
                        <p className={`font-medium ${textClass}`}>{a.client}</p>
                        <p className={`text-xs ${secondaryText}`}>{formatIndianDate(a.date)} | {a.time}</p>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Tasks */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Tasks</p>
                    {searchResults.tasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleResultClick('task', t.id)}
                        className={`w-full px-4 py-3 text-left ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-colors`}
                      >
                        <p className={`font-medium ${textClass}`}>{t.title}</p>
                        <p className={`text-xs ${secondaryText}`}>Assigned to: {t.assignedToName} | Due: {formatIndianDate(t.deadline)}</p>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Expenses */}
                {searchResults.expenses.length > 0 && (
                  <div>
                    <p className={`px-4 py-2 text-xs font-semibold uppercase ${theme === 'light' ? 'bg-gray-50 text-gray-600' : 'bg-white/5 text-gray-400'}`}>Expenses</p>
                    {searchResults.expenses.map(e => (
                      <button
                        key={e.id}
                        onClick={() => handleResultClick('expense', e.id)}
                        className={`w-full px-4 py-3 text-left ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'} transition-colors`}
                      >
                        <p className={`font-medium ${textClass}`}>{e.description}</p>
                        <p className={`text-xs ${secondaryText}`}>₹{e.amount.toLocaleString()} | {e.month}</p>
                      </button>
                    ))}
                  </div>
                )}
                
              </div>
            );
          })()}
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              // Mark all current notifications as viewed when opening
              if (!showNotifications && notifications.length > 0) {
                markNotificationsAsViewed(notifications.map(n => n.id));
              }
            }}
            className={`relative p-2 md:p-2.5 rounded-sm transition-colors duration-150 ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'} group`}
          >
            <Bell size={19} strokeWidth={1.75} className={`${textClass} transition-colors`} />
            {/* Unread dot — grey, consistent with the rest of the UI */}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#0f0f10] bg-gray-400" />
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className={`fixed left-3 right-3 top-16 w-auto md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#18181b] border-white/10'} border rounded-sm shadow-2xl z-[9999] overflow-hidden max-h-96 overflow-y-auto`}>
              <div className={`px-4 py-3 border-b ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                <h3 className={`font-semibold ${textClass}`}>Notifications</h3>
                <p className={`text-xs ${secondaryText}`}>
                  {notifications.length} updates (auto-clears after 24h)
                </p>
              </div>
              
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={32} className={`mx-auto mb-2 ${secondaryText}`} />
                  <p className={`text-sm ${secondaryText}`}>No new notifications</p>
                  <p className={`text-xs ${secondaryText} mt-1`}>You're all caught up!</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b ${theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-white/5 hover:bg-white/5'} transition-colors cursor-pointer`}
                      onClick={() => {
                        setShowNotifications(false);
                        // Navigate based on type
                        switch (notif.type) {
                          case 'case':
                            navigate(`/cases/${notif.refId}`);
                            break;
                          case 'task':
                            navigate('/tasks');
                            break;
                          case 'appointment':
                            navigate('/appointments');
                            break;
                          case 'expense':
                            navigate('/expenses');
                            break;
                          case 'book':
                            navigate('/library/books');
                            break;
                          case 'sofa':
                            navigate('/library/sofa');
                            break;
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{notif.icon}</span>
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
              
              <div className={`px-4 py-3 text-center border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'}`}>
                <button
                  onClick={() => setShowNotifications(false)}
                  className={`text-xs font-medium ${secondaryText} hover:text-gray-200 transition-colors`}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 md:p-2.5 rounded-sm border transition-colors duration-150 ${theme === 'light' ? 'border-gray-200 hover:bg-gray-100' : 'border-white/10 hover:bg-white/5'}`}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} className={textClass} /> : <Moon size={18} strokeWidth={1.75} className={textClass} />}
        </button>

        {/* User Profile */}
        <div className={`flex items-center gap-3 pl-2 ml-0.5 md:pl-4 md:ml-1 border-l ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
          <div
            className={`w-9 h-9 md:w-10 md:h-10 rounded-sm flex items-center justify-center border font-display ${
              theme === 'light' ? 'bg-gray-900 border-gray-900' : 'bg-white/10 border-white/15'
            }`}
          >
            <span className="text-white font-semibold">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="hidden md:block">
            <p className={`text-sm font-semibold ${textClass}`}>{user?.name || 'User'}</p>
            <div className="flex items-center gap-1">
              {isAdmin ? (
                <>
                  <Scale size={10} className={secondaryText} />
                  <span className={`text-xs font-medium ${secondaryText}`}>Admin</span>
                </>
              ) : (
                <span className={`text-xs ${secondaryText} capitalize`}>{user?.role || 'User'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
