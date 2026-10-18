import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Clock,
  ThumbsUp,
  ThumbsDown,
  FileText,
  CheckCircle,
  Landmark,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import Calendar from '../components/Calendar';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases, tasks } = useData();
  const { theme } = useTheme();

  // Calculate pending tasks count - only pending status tasks
  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'pending').length;
  }, [tasks]);

  // Calculate statistics dynamically from actual case data
  // These stats update automatically when cases array changes (via real-time subscription)
  const stats = useMemo(() => {
    const myCases = cases.length;
    // Handle both uppercase and lowercase values for interim relief
    const irFavor = cases.filter((c) => 
      c.interimRelief?.toLowerCase() === 'favor'
    ).length;
    const irAgainst = cases.filter((c) => 
      c.interimRelief?.toLowerCase() === 'against'
    ).length;
    // Handle both formats: 'non-circulated', 'NON CIRCULATED', 'non circulated'
    const nonCirculated = cases.filter((c) => {
      const status = c.circulationStatus?.toLowerCase().replace(/\s+/g, '-');
      return status === 'non-circulated' || !c.circulationStatus;
    }).length;
    const circulated = cases.filter((c) => {
      const status = c.circulationStatus?.toLowerCase().replace(/\s+/g, '-');
      return status === 'circulated' || status === 'circulation';
    }).length;

    return { myCases, irFavor, irAgainst, nonCirculated, circulated };
  }, [cases, pendingTasksCount]);

  // Dynamic stat cards - each card shows real-time count and navigates to filtered view
  // Icon chips are monochrome grey now (previously colourful per-card accents).
  const statCards = [
    { 
      title: 'MY CASES', 
      count: stats.myCases, 
      iconBg: 'bg-gray-500', 
      icon: Briefcase, 
      path: '/cases', 
      linkColor: 'text-gray-400'
    },
    { 
      title: 'PENDING TASKS', 
      count: pendingTasksCount, 
      iconBg: 'bg-gray-500', 
      icon: Clock, 
      path: '/tasks?filter=pending', 
      linkColor: 'text-gray-400'
    },
    { 
      title: 'IR FAVOR', 
      count: stats.irFavor, 
      iconBg: 'bg-gray-500', 
      icon: ThumbsUp, 
      path: '/cases?filter=ir-favor', 
      linkColor: 'text-gray-400'
    },
    { 
      title: 'IR AGAINST', 
      count: stats.irAgainst, 
      iconBg: 'bg-gray-500', 
      icon: ThumbsDown, 
      path: '/cases?filter=ir-against', 
      linkColor: 'text-gray-400'
    },
    { 
      title: 'NON CIRCULATED', 
      count: stats.nonCirculated, 
      iconBg: 'bg-gray-500', 
      icon: FileText, 
      path: '/cases?filter=non-circulated', 
      linkColor: 'text-gray-400'
    },
    { 
      title: 'CIRCULATED', 
      count: stats.circulated, 
      iconBg: 'bg-gray-500', 
      icon: CheckCircle, 
      path: '/cases?filter=circulated', 
      linkColor: 'text-gray-400'
    },
  ];

  const cardBg = theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#18181b] border-white/10';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const accent = 'rgb(161 161 170)'; // was gold — now grey, matching the all-monochrome UI

  return (
    <MainLayout>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className={`text-[11px] uppercase tracking-[0.2em] font-mono-ui mb-2 ${textSecondary}`}>
              {format(new Date(), 'EEEE, dd MMMM yyyy')}
            </p>
            <h1 className={`font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight ${textPrimary}`}>
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className={`${textSecondary} text-base md:text-lg mt-2`}>Here's what's happening with your cases today.</p>
          </div>
          <a
            href="https://services.ecourts.gov.in/ecourtindia_v6/?p=cause_list/index"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-5 py-3 rounded-sm font-semibold text-sm border transition-colors whitespace-nowrap flex-shrink-0 ${
              theme === 'light' ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
            }`}
          >
            <Landmark size={16} strokeWidth={1.75} />
            eCourts Cause List
            <ExternalLink size={14} className="opacity-70" />
          </a>
        </div>
      </motion.div>

      {/* Statistics — "docket" ledger grid: numbered entries, flat icon
          chips, accent hairline on hover instead of glow/scale. */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const cardClass = theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-[#18181b] border-white/10';
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              onClick={() => navigate(stat.path)}
              className={`relative p-4 md:p-5 rounded-sm cursor-pointer group border transition-colors duration-200 hover:border-[rgb(180,140,60)]/50 ${cardClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-mono-ui tracking-[0.15em] ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                    0{index + 1} / {stat.title}
                  </p>
                  <p className={`text-3xl md:text-4xl font-display font-semibold mt-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{stat.count}</p>
                  <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${stat.linkColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`}>
                    <span>View details →</span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-sm ${stat.iconBg}`}>
                  <Icon size={18} strokeWidth={1.75} className="text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className={`lg:col-span-2 ${cardBg} rounded-sm p-6 border`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`font-display text-xl font-semibold ${textPrimary}`}>Case Statistics</h2>
            <span className="text-[10px] uppercase tracking-[0.15em] font-mono-ui" style={{ color: accent }}>By Stage</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200/10">
                {[
                  { label: 'Consultation', value: cases.filter((c) => c.stage === 'consultation').length, filter: 'consultation' },
                  { label: 'Drafting', value: cases.filter((c) => c.stage === 'drafting').length, filter: 'drafting' },
                  { label: 'Filing', value: cases.filter((c) => c.stage === 'filing').length, filter: 'filing' },
                  { label: 'Circulation', value: stats.circulated, filter: 'circulated' },
                  { label: 'Notice', value: cases.filter((c) => c.stage === 'notice').length, filter: 'notice' },
                  { label: 'Pre Admission', value: cases.filter((c) => c.stage === 'pre-admission').length, filter: 'pre-admission' },
                  { label: 'Admitted', value: cases.filter((c) => c.stage === 'admitted').length, filter: 'admitted' },
                  { label: 'Final Hearing', value: cases.filter((c) => c.stage === 'final-hearing').length, filter: 'final-hearing' },
                  { label: 'Reserved For Judgement', value: cases.filter((c) => c.stage === 'reserved').length, filter: 'reserved' },
                  { label: 'Disposed', value: cases.filter((c) => c.stage === 'disposed').length, filter: 'disposed' },
                ].map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => navigate(`/cases?filter=${row.filter}`)}
                    className={`${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]'} transition-colors cursor-pointer group`}
                  >
                    <td className={`py-3 px-4 uppercase text-xs font-semibold tracking-wide ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`}>
                      <span className="flex items-center gap-2">
                        {row.label}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>→</span>
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-mono-ui text-lg ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                      {row.value}
                    </td>
                  </tr>
                ))}
                <tr 
                  onClick={() => navigate('/cases')}
                  className={`${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/[0.04] hover:bg-white/[0.07]'} cursor-pointer transition-colors`}
                >
                  <td className={`py-4 px-4 uppercase text-xs font-bold tracking-wide ${textPrimary}`}>Total Cases</td>
                  <td className={`py-4 px-4 text-right font-mono-ui font-semibold text-xl ${textPrimary}`}>{cases.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="space-y-4"
        >
          <button 
            onClick={() => navigate(`/events/${format(new Date(), 'yyyy-MM-dd')}`)}
            className={`w-full font-semibold text-sm py-3.5 rounded-sm transition-colors duration-150 border ${
              theme === 'light' ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
            }`}
          >
            View Today's Events
          </button>
          <Calendar />
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
