import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
  color: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, count, color, delay }) => {
  const { theme } = useTheme();

  // Monochrome grey chip for every variant — colour prop kept for API
  // compatibility with existing callers, but no longer renders colourfully.
  const colorClasses: Record<string, string> = {
    purple: 'bg-gray-500',
    blue: 'bg-gray-500',
    green: 'bg-gray-500',
    red: 'bg-gray-500',
    cyan: 'bg-gray-500',
    pink: 'bg-gray-500',
  };

  const cardBg = theme === 'light'
    ? 'bg-white border-gray-200 hover:border-[rgb(180,140,60)]/50'
    : 'bg-[#18181b] border-white/10 hover:border-[rgb(180,140,60)]/50';
  const titleClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const countClass = theme === 'light' ? 'text-gray-900' : 'text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`${cardBg} p-5 rounded-sm cursor-pointer transition-colors duration-200 border`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`${titleClass} text-[11px] font-medium uppercase tracking-[0.12em]`}>{title}</p>
          <p className={`text-3xl font-display font-semibold mt-2 ${countClass}`}>{count}</p>
        </div>
        <div className={`${colorClasses[color]} p-2.5 rounded-sm`}>
          <Icon size={18} strokeWidth={1.75} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
