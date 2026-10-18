import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Plus,
  List,
  UserCheck,
  X,
  Shield,
  Scale,
  TrendingDown,
  Mail,
  BookOpen,
  Archive,
  Landmark,
  ExternalLink,
} from 'lucide-react';

const ECOURTS_URL = 'https://services.ecourts.gov.in/ecourtindia_v6/?p=cause_list/index';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTenant } from '../contexts/TenantContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const { theme } = useTheme();
  const { branding, tenant } = useTenant();
  const [isOfficeCasesOpen, setIsOfficeCasesOpen] = useState(false);

  // White label is active only on the Custom plan with branding enabled
  const whiteLabel = !!(branding?.white_label_active && tenant?.plan === 'custom');
  const firmName = branding?.firm_display_name || tenant?.firm_name || 'Your Firm';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'My Cases', path: '/cases' },
    { icon: UserCheck, label: 'Tasks', path: '/tasks' },
    { icon: UserCheck, label: 'Attendance', path: '/attendance' },
    { icon: Users, label: 'Appointments', path: '/appointments' },
    { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
    { icon: BookOpen, label: 'Library', path: '/library' },
    { icon: Archive, label: 'Storage', path: '/storage' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // DISABLED: Subscription nav entry removed — all features are free/unlocked.
  // ({ icon: CreditCard, label: 'Subscription', path: '/subscription' } removed from this list)
  const adminMenuItems = [
    { icon: Mail, label: 'Reminders', path: '/reminders' },
    { icon: Shield, label: 'Admin Panel', path: '/admin' },
  ];

  const officeCasesSubmenu = [
    { icon: Plus, label: 'Create Case', path: '/cases/create' },
    { icon: List, label: 'List Cases', path: '/cases' },
    { icon: Scale, label: 'Council Cases', path: '/counsel/cases' },
  ];

  const isActive = (path: string) => location.pathname === path;


  // "Docket rail" sidebar: flat paper/ink panel, serif wordmark, and the
  // single accent colour reserved for the active item + section markers.
  const bgClass = theme === 'light'
    ? 'bg-white border-gray-200'
    : 'bg-[#0f0f10] border-white/10';
  const textClass = theme === 'light' ? 'text-gray-700' : 'text-gray-300';
  const secondaryTextClass = theme === 'light' ? 'text-gray-400' : 'text-gray-500';
  const hoverClass = theme === 'light' ? 'hover:bg-gray-50 hover:text-gray-900' : 'hover:bg-white/[0.04]';
  const activeBgClass = theme === 'light'
    ? 'bg-gray-100 text-gray-900 border-l-2 border-gray-900'
    : 'bg-white/[0.08] text-white border-l-2 border-white';

  return (
    <>
      <div
        className={`${bgClass} h-screen flex flex-col overflow-hidden fixed md:relative z-40 ${
          isOpen
            ? 'w-64 md:w-72 translate-x-0 border-r'
            : 'w-64 md:w-0 -translate-x-full md:translate-x-0 border-r-0'
        }`}
        style={{ transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease' }}
      >
        {/* Background Overlay - solid flat panel */}
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[#0f0f10]' : 'bg-white'}`} />
        {/* Header — mark + wordmark side by side, firm name as a small badge below */}
        <div className={`relative flex items-center gap-3 px-5 py-5 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/10'} flex-shrink-0`}>
          <div
            className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 font-display font-bold text-sm"
            style={{ backgroundColor: 'rgb(82 82 91)', color: '#fafafa' }}
          >
            VD
          </div>
          <div className="flex-1 min-w-0">
            {whiteLabel ? (
              <>
                <h1 className={`font-display text-lg font-semibold tracking-tight leading-tight truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{firmName}</h1>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 truncate leading-tight mt-0.5">by VakilDesk</p>
              </>
            ) : (
              <>
                <h1 className={`font-display text-lg font-semibold tracking-tight leading-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  VakilDesk
                </h1>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 truncate leading-tight mt-0.5">{firmName}</p>
              </>
            )}
          </div>
          <button onClick={onToggle} className={`md:hidden p-2.5 rounded ${hoverClass} transition-colors`}>
            <X size={20} className={textClass} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 px-3 md:px-4 py-4 space-y-0.5 overflow-y-auto">
          <p className={`text-[10px] font-semibold uppercase ${secondaryTextClass} px-3 py-2 tracking-[0.18em] font-mono-ui`}>01 — Main</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex items-center gap-3 ${active ? 'pl-3.5' : 'pl-4'} pr-4 py-2.5 rounded-sm transition-colors duration-150 ${
                  active ? activeBgClass : `${textClass} ${hoverClass} border-l-2 border-transparent`
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* eCourts external link */}
          <a
            href={ECOURTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 pl-4 pr-4 py-2.5 rounded-sm transition-colors duration-150 border-l-2 border-transparent ${textClass} ${hoverClass}`}
          >
            <Landmark size={18} strokeWidth={1.75} />
            <span className="text-sm font-medium flex-1">eCourts Cause List</span>
            <ExternalLink size={13} className="opacity-50" />
          </a>

          {/* Case Management — below Main Menu */}
          <p className={`text-[10px] font-semibold uppercase ${secondaryTextClass} px-3 py-2 mt-5 tracking-[0.18em] font-mono-ui`}>02 — Case Mgmt</p>
          <div>
            <button
              onClick={() => setIsOfficeCasesOpen(!isOfficeCasesOpen)}
              className={`w-full flex items-center justify-between pl-4 pr-4 py-2.5 rounded-sm transition-colors duration-150 border-l-2 border-transparent ${
                isOfficeCasesOpen ? (theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-white/[0.06] text-white') : `${textClass} ${hoverClass}`
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={18} strokeWidth={1.75} />
                <span className="text-sm font-medium">Office Cases</span>
              </div>
              {isOfficeCasesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isOfficeCasesOpen && (
              <div className={`ml-4 mt-1 space-y-0.5 border-l ${theme === 'light' ? 'border-gray-200' : 'border-white/15'} pl-4`}>
                {officeCasesSubmenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const active = isActive(subItem.path);
                  return (
                    <Link key={subItem.path + subItem.label} to={subItem.path} className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors text-sm ${active ? (theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-white/[0.06] text-white') : `${textClass} ${hoverClass}`}`}>
                      <SubIcon size={15} strokeWidth={1.75} />
                      <span className="font-medium">{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Administration — below Case Management, admin only */}
          {isAdmin && (
            <>
              <p className={`text-[10px] font-semibold uppercase ${secondaryTextClass} px-3 py-2 mt-5 tracking-[0.18em] font-mono-ui`}>03 — Admin</p>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} className={`flex items-center gap-3 ${active ? 'pl-3.5' : 'pl-4'} pr-4 py-2.5 rounded-sm transition-colors duration-150 ${active ? activeBgClass : `${textClass} ${hoverClass} border-l-2 border-transparent`}`}>
                    <Icon size={18} strokeWidth={1.75} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

        </nav>

        {/* Logout */}
        <div className={`relative p-3 md:p-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm transition-colors ${theme === 'light' ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10'}`}>
            <LogOut size={18} strokeWidth={1.75} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-30" onClick={onToggle} />}
    </>
  );
};

export default Sidebar;
