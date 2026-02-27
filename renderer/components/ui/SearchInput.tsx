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
  const [focused, setFocused] = useState(false);
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

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <div
      className={`flex items-center rounded-lg border transition-all duration-200 ${
        focused
          ? 'bg-surface-tertiary border-accent/30 ring-1 ring-accent/10'
          : 'bg-surface-tertiary/50 border-border-subtle'
      } ${className}`}
      style={{ height: '2.25rem', gap: '0.5rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
      onClick={() => inputRef.current?.focus()}
    >
      <Search
        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
          focused ? 'text-accent' : 'text-foreground-tertiary'
        }`}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-full bg-transparent text-sm text-foreground placeholder:text-foreground-tertiary/60 focus:outline-none"
      />
      <kbd
        className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-surface-secondary border border-border-subtle text-[10px] font-mono text-foreground-tertiary"
        style={{ gap: '0.125rem' }}
      >
        {isMac ? '⌘' : 'Ctrl+'}K
      </kbd>
    </div>
  );
}
