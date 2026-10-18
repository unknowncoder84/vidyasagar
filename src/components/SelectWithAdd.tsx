import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import FormSelect from './FormSelect';

interface SelectWithAddProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAdd: (name: string) => Promise<{ id: string; name: string } | void>;
  error?: string;
  required?: boolean;
  /** Shown next to the input while a new option is being added */
  addPlaceholder?: string;
}

/**
 * A dropdown (court / case type / district / etc.) with a small
 * "+ Add New" link underneath. Lets non-technical staff add a missing
 * option right where they need it, instead of having to find Settings.
 * The newly created option is auto-selected once saved.
 */
const SelectWithAdd: React.FC<SelectWithAddProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  onAdd,
  error,
  required,
  addPlaceholder,
}) => {
  const { theme } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  // Only shown for long lists (e.g. the 100+ Aurangabad courts) — keeps the
  // plain small dropdowns (case type, etc.) exactly as before.
  const [filterTerm, setFilterTerm] = useState('');
  const showFilter = options.length > 15;

  const filteredOptions = useMemo(() => {
    if (!showFilter || !filterTerm.trim()) return options;
    const term = filterTerm.toLowerCase();
    const matches = options.filter((o) => o.label.toLowerCase().includes(term));
    // Always keep the currently selected option visible, even if it doesn't
    // match the filter text, so an existing selection never appears blank.
    if (value && !matches.some((o) => o.value === value)) {
      const current = options.find((o) => o.value === value);
      if (current) return [current, ...matches];
    }
    return matches;
  }, [options, filterTerm, showFilter, value]);

  const linkClass = theme === 'light'
    ? 'text-xs font-medium text-orange-600 hover:text-orange-700'
    : 'text-xs font-medium text-orange-400 hover:text-orange-300';

  const inputClass = theme === 'light'
    ? 'flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-orange-500'
    : 'flex-1 px-3 py-2 bg-white/5 border border-orange-500/30 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500';

  const filterInputClass = theme === 'light'
    ? 'w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500'
    : 'w-full pl-9 pr-3 py-2 bg-white/5 border border-orange-500/30 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500';

  const handleSave = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const created = await onAdd(trimmed);
      if (created) {
        // Auto-select the newly created option
        onChange({ target: { name, value: created.id ?? created.name } } as any);
      }
      setNewValue('');
      setShowAdd(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to add. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {showFilter && (
        <div className="relative mb-1.5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            placeholder={`Filter ${label.toLowerCase()}…`}
            className={filterInputClass}
          />
        </div>
      )}
      <FormSelect label={label} name={name} options={filteredOptions} value={value} onChange={onChange} error={error} required={required} />
      {showFilter && filterTerm && filteredOptions.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">No {label.toLowerCase()} matches "{filterTerm}"</p>
      )}
      {!showAdd ? (
        <button type="button" onClick={() => setShowAdd(true)} className={`mt-1.5 flex items-center gap-1 ${linkClass}`}>
          <Plus size={12} /> Add new {label.toLowerCase()}
        </button>
      ) : (
        <div className="mt-1.5 flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
            placeholder={addPlaceholder || `Type new ${label.toLowerCase()} name`}
            className={inputClass}
          />
          <button type="button" onClick={handleSave} disabled={saving || !newValue.trim()}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium disabled:opacity-50 whitespace-nowrap">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => { setShowAdd(false); setNewValue(''); }} className={theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectWithAdd;
