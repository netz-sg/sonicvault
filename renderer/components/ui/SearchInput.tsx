'use client';

import { Search } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export function SearchInput({
  placeholder = 'Search...',
  className = '',
  value: controlledValue,
  onChange,
  onSubmit,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const value = controlledValue ?? internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onSubmit?.(value);
      }
    },
    [onSubmit, value]
  );

  // Cmd+K / Ctrl+K shortcut to focus
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={`relative group ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary group-focus-within:text-accent transition-colors" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-10 pr-14 py-2 bg-surface-tertiary/50 border border-border-subtle rounded-lg text-sm text-foreground placeholder:text-foreground-tertiary/60 focus:outline-none focus:border-accent/30 focus:bg-surface-tertiary focus:ring-1 focus:ring-accent/10 transition-all duration-200"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-elevated/60 border border-border-subtle text-[10px] font-mono text-foreground-tertiary">
        ⌘K
      </kbd>
    </div>
  );
}
