'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  FileText,
  ArrowRightLeft,
  Tag,
  Copy,
  Image,
  Save,
  CheckCircle2,
  Loader2,
  Info,
  Server,
  Globe,
  RotateCcw,
  AlertTriangle,
  Eye,
  Clock,
  Activity,
  Settings2,
  Layers,
  Cpu,
  Zap,
  Trash2,
} from 'lucide-react';
import { useToastStore } from '@/lib/store/useToastStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import type { Locale } from '@/lib/i18n/translations';

type SettingsMap = Record<string, string>;

type TabId = 'general' | 'organization' | 'processing' | 'automation' | 'danger';

const TAB_DEFS: { id: TabId; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'general', labelKey: 'settings.tabGeneral', icon: Settings2 },
  { id: 'organization', labelKey: 'settings.tabOrganization', icon: Layers },
  { id: 'processing', labelKey: 'settings.tabProcessing', icon: Cpu },
  { id: 'automation', labelKey: 'settings.tabAutomation', icon: Zap },
  { id: 'danger', labelKey: 'settings.tabDanger', icon: Trash2 },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsMap>({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [onboardingConfirm, setOnboardingConfirm] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  // Fetch auto-watch status
  const { data: watchStatus } = useQuery<{
    enabled: boolean;
    processing: boolean;
    lastRun: number | null;
    nextRun: number | null;
    intervalMinutes: number;
    lastResult: { newTracks: number; enriched: number; organized: number; errors: string[] } | null;
    logs: Array<{ id: string; timestamp: number; type: string; message: string }>;
  }>({
    queryKey: ['auto-watch-status'],
    queryFn: () => fetch('/api/auto-watch').then((r) => r.json()),
    refetchInterval: 10000,
  });

  // Toggle auto-watch
  const watchToggleMutation = useMutation({
    mutationFn: async ({ enabled, intervalMinutes }: { enabled: boolean; intervalMinutes: number }) => {
      const res = await fetch('/api/auto-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, intervalMinutes }),
      });
      if (!res.ok) throw new Error('Failed to toggle auto-watch');
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['auto-watch-status'] });
      addToast({
        type: vars.enabled ? 'success' : 'info',
        title: vars.enabled ? 'Auto-Watch activated' : 'Auto-Watch deactivated',
        description: vars.enabled
          ? `Checking every ${vars.intervalMinutes} min for new files`
          : undefined,
      });
    },
  });

  // Fetch settings
  const { data: settings, isLoading } = useQuery<SettingsMap>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  });

  // Populate form when settings load
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SettingsMap) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setResetConfirm(false);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 4000);
    },
  });

  // Restart onboarding mutation (reset library + clear onboarding flag)
  const onboardingResetMutation = useMutation({
    mutationFn: async () => {
      const resetRes = await fetch('/api/reset', { method: 'POST' });
      if (!resetRes.ok) throw new Error('Failed to reset library');
      const settingsRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: '' }),
      });
      if (!settingsRes.ok) throw new Error('Failed to reset onboarding');
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setOnboardingConfirm(false);
    },
  });

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveMutation.mutate(form);
  }

  const patternPreview = buildPreview(form);

  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ gap: '1.5rem' }}>
        <div>
          <h1 className="font-heading text-3xl text-foreground tracking-tight">{t('settings.title')}</h1>
          <p className="mt-1 text-foreground-secondary text-sm">Loading configuration...</p>
        </div>
        {/* Skeleton tab bar */}
        <div
          className="rounded-xl border border-border-subtle overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)', padding: '0.375rem' }}
        >
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-lg animate-shimmer bg-linear-to-r from-surface-tertiary via-surface-elevated to-surface-tertiary bg-size-[200%_100%]"
                style={{ width: i === 0 ? '5rem' : i === 4 ? '6.5rem' : '6rem' }}
              />
            ))}
          </div>
        </div>
        {/* Skeleton cards */}
        <div className="flex flex-col" style={{ gap: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-subtle overflow-hidden animate-shimmer
                         bg-linear-to-r from-surface-tertiary via-surface-elevated to-surface-tertiary bg-size-[200%_100%]"
              style={{ height: i === 0 ? '7rem' : '6rem' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl"
    >
      {/* Header + Save */}
      <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="font-heading text-3xl text-foreground tracking-tight">{t('settings.title')}</h1>
          <p className="mt-1 text-foreground-secondary text-sm">
            {t('settings.subtitle')}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 h-9 rounded-lg text-sm font-medium
                     bg-accent text-surface border border-accent hover:bg-accent-dark
                     transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            padding: '0 1.25rem',
            boxShadow: '0 0 12px rgba(232,168,73,0.15)',
          }}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? t('settings.saved') : t('settings.save')}
        </button>
      </div>

      {/* Error */}
      {saveMutation.isError && (
        <div
          className="relative rounded-xl border border-error/20 overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.03)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}
        >
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: '3px',
              background: 'linear-gradient(to bottom, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.1) 100%)',
            }}
          />
          <p className="text-sm text-error">{saveMutation.error?.message}</p>
        </div>
      )}

      {/* Tab Bar */}
      <div
        className="rounded-xl border border-border-subtle overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
          padding: '0.375rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="flex items-center" style={{ gap: '0.25rem' }}>
          {TAB_DEFS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg text-xs font-medium transition-all duration-200
                  ${isActive
                    ? isDanger
                      ? 'text-error'
                      : 'text-foreground'
                    : isDanger
                      ? 'text-error/30 hover:text-error/60'
                      : 'text-foreground-tertiary hover:text-foreground-secondary'
                  }`}
                style={{
                  padding: '0.5rem 0.875rem',
                  ...(isActive
                    ? isDanger
                      ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }
                      : { background: 'rgba(232,168,73,0.06)', border: '1px solid rgba(232,168,73,0.1)' }
                    : { background: 'transparent', border: '1px solid transparent' }
                  ),
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {activeTab === 'general' && (
            <TabGeneral form={form} updateField={updateField} locale={locale} setLocale={setLocale} />
          )}
          {activeTab === 'organization' && (
            <TabOrganization form={form} updateField={updateField} patternPreview={patternPreview} />
          )}
          {activeTab === 'processing' && (
            <TabProcessing form={form} updateField={updateField} />
          )}
          {activeTab === 'automation' && (
            <TabAutomation
              form={form}
              updateField={updateField}
              watchStatus={watchStatus}
              watchToggleMutation={watchToggleMutation}
            />
          )}
          {activeTab === 'danger' && (
            <TabDanger
              resetConfirm={resetConfirm}
              setResetConfirm={setResetConfirm}
              resetDone={resetDone}
              resetMutation={resetMutation}
              onboardingConfirm={onboardingConfirm}
              setOnboardingConfirm={setOnboardingConfirm}
              onboardingResetMutation={onboardingResetMutation}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab Content Components
// ═══════════════════════════════════════════════════════

function TabGeneral({
  form,
  updateField,
  locale,
  setLocale,
}: {
  form: SettingsMap;
  updateField: (key: string, value: string) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col" style={{ gap: '1rem' }}>
      <SettingsCard
        icon={Globe}
        title={t('settings.uiLanguage')}
        description={t('settings.uiLanguageDesc')}
      >
        <SelectInput
          value={locale}
          onChange={(v) => {
            setLocale(v as Locale);
            updateField('ui_language', v);
          }}
          options={[
            { value: 'en', label: 'English' },
            { value: 'de', label: 'Deutsch' },
          ]}
        />
      </SettingsCard>

      <SettingsCard
        icon={Globe}
        title={t('settings.metadataLanguage')}
        description={t('settings.metadataLanguageDesc')}
      >
        <SelectInput
          value={form.metadata_language ?? 'en'}
          onChange={(v) => updateField('metadata_language', v)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'de', label: 'Deutsch' },
            { value: 'fr', label: 'Fran\u00e7ais' },
            { value: 'es', label: 'Espa\u00f1ol' },
            { value: 'it', label: 'Italiano' },
            { value: 'pt', label: 'Portugu\u00eas' },
            { value: 'ja', label: '\u65e5\u672c\u8a9e' },
            { value: 'ko', label: '\ud55c\uad6d\uc5b4' },
            { value: 'zh', label: '\u4e2d\u6587' },
          ]}
        />
      </SettingsCard>

      <SettingsCard
        icon={FolderOpen}
        title={t('settings.libraryPath')}
        description={t('settings.libraryPathDesc')}
      >
        <TextInput
          value={form.library_path ?? ''}
          onChange={(v) => updateField('library_path', v)}
          placeholder={t('settings.libraryPathPlaceholder')}
          mono
        />
      </SettingsCard>
    </div>
  );
}

function TabOrganization({
  form,
  updateField,
  patternPreview,
}: {
  form: SettingsMap;
  updateField: (key: string, value: string) => void;
  patternPreview: string | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col" style={{ gap: '1rem' }}>
      <SettingsCard
        icon={FileText}
        title={t('settings.namingPatterns')}
        description={t('settings.namingPatternsDesc')}
      >
        <div className="flex flex-col gap-3">
          <LabeledInput
            label={t('settings.artistPattern')}
            value={form.naming_pattern_artist ?? '{artist}'}
            onChange={(v) => updateField('naming_pattern_artist', v)}
            placeholder="{artist}"
          />
          <LabeledInput
            label={t('settings.albumPattern')}
            value={form.naming_pattern_album ?? '{year} - {album}'}
            onChange={(v) => updateField('naming_pattern_album', v)}
            placeholder="{year} - {album}"
          />
          <LabeledInput
            label={t('settings.trackPattern')}
            value={form.naming_pattern_track ?? '{track_number} - {title}'}
            onChange={(v) => updateField('naming_pattern_track', v)}
            placeholder="{track_number} - {title}"
          />

          {patternPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex items-start gap-3 rounded-lg overflow-hidden"
              style={{
                marginTop: '0.25rem',
                padding: '0.75rem 0.75rem 0.75rem 1rem',
                background: 'rgba(232,168,73,0.02)',
                border: '1px solid rgba(232,168,73,0.08)',
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: '3px',
                  background: 'linear-gradient(to bottom, rgba(232,168,73,0.5) 0%, rgba(232,168,73,0.1) 100%)',
                }}
              />
              <div
                className="rounded flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  background: 'rgba(232,168,73,0.06)',
                  border: '1px solid rgba(232,168,73,0.08)',
                }}
              >
                <Info className="w-3 h-3 text-accent" />
              </div>
              <div>
                <span className="text-[11px] text-foreground-tertiary font-medium uppercase tracking-wider">{t('settings.preview')}</span>
                <p className="text-xs font-mono text-foreground-secondary mt-0.5 break-all leading-relaxed">
                  {patternPreview}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={ArrowRightLeft}
        title={t('settings.organizeMode')}
        description={t('settings.organizeModeDesc')}
      >
        <SelectInput
          value={form.organize_mode ?? 'copy'}
          onChange={(v) => updateField('organize_mode', v)}
          options={[
            { value: 'copy', label: `${t('settings.copy')} \u2014 Keep originals (safer)` },
            { value: 'move', label: `${t('settings.move')} \u2014 Remove originals (saves space)` },
          ]}
        />
      </SettingsCard>

      <SettingsCard
        icon={Copy}
        title={t('settings.duplicates')}
        description={t('settings.duplicatesDesc')}
      >
        <SelectInput
          value={form.handle_duplicates ?? 'skip'}
          onChange={(v) => updateField('handle_duplicates', v)}
          options={[
            { value: 'skip', label: `${t('settings.skip')} \u2014 Keep existing file` },
            { value: 'overwrite', label: `${t('settings.overwrite')} \u2014 Replace existing file` },
            { value: 'keep_both', label: `${t('settings.rename')} \u2014 Add suffix to new file` },
          ]}
        />
      </SettingsCard>
    </div>
  );
}

function TabProcessing({
  form,
  updateField,
}: {
  form: SettingsMap;
  updateField: (key: string, value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col" style={{ gap: '1rem' }}>
      <SettingsCard
        icon={Tag}
        title={t('settings.autoTagWrite')}
        description={t('settings.autoTagWriteDesc')}
      >
        <ToggleInput
          value={form.auto_tag_write === 'true'}
          onChange={(v) => updateField('auto_tag_write', v ? 'true' : 'false')}
          label=""
        />
      </SettingsCard>

      <SettingsCard
        icon={Image}
        title={t('settings.coverEmbed')}
        description={t('settings.coverEmbedDesc')}
      >
        <ToggleInput
          value={form.cover_embed === 'true'}
          onChange={(v) => updateField('cover_embed', v ? 'true' : 'false')}
          label=""
        />
      </SettingsCard>

      <SettingsCard
        icon={Server}
        title={t('settings.nfoGenerate')}
        description={t('settings.nfoGenerateDesc')}
      >
        <ToggleInput
          value={form.nfo_generate === 'true'}
          onChange={(v) => updateField('nfo_generate', v ? 'true' : 'false')}
          label=""
        />
      </SettingsCard>
    </div>
  );
}

function TabAutomation({
  form,
  updateField,
  watchStatus,
  watchToggleMutation,
}: {
  form: SettingsMap;
  updateField: (key: string, value: string) => void;
  watchStatus: {
    enabled: boolean;
    processing: boolean;
    lastRun: number | null;
    nextRun: number | null;
    intervalMinutes: number;
    lastResult: { newTracks: number; enriched: number; organized: number; errors: string[] } | null;
    logs: Array<{ id: string; timestamp: number; type: string; message: string }>;
  } | undefined;
  watchToggleMutation: { mutate: (vars: { enabled: boolean; intervalMinutes: number }) => void };
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col" style={{ gap: '1rem' }}>
      <div
        className="rounded-xl border border-border-subtle overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
          padding: '1.25rem',
        }}
      >
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg flex items-center justify-center shrink-0"
              style={{
                width: '2.25rem',
                height: '2.25rem',
                background: 'rgba(232,168,73,0.06)',
                border: '1px solid rgba(232,168,73,0.08)',
              }}
            >
              <Eye className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">{t('settings.autoWatch')}</h3>
              <p className="text-xs text-foreground-tertiary">
                {t('settings.autoWatchDesc')}
              </p>
            </div>
          </div>
          <ToggleInput
            value={watchStatus?.enabled ?? false}
            onChange={(enabled) =>
              watchToggleMutation.mutate({
                enabled,
                intervalMinutes: Number(form.auto_watch_interval) || 5,
              })
            }
            label=""
          />
        </div>

        {/* Interval Setting */}
        {(watchStatus?.enabled || form.auto_watch_enabled === 'true') && (
          <>
            <div
              style={{
                height: '1px',
                marginTop: '1rem',
                marginBottom: '1rem',
                background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)',
              }}
            />
            <div className="flex items-center gap-3 mb-3">
              <div
                className="rounded flex items-center justify-center shrink-0"
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Clock className="w-3 h-3 text-foreground-tertiary" />
              </div>
              <span className="text-xs text-foreground-secondary font-medium">{t('settings.checkInterval')}</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 5, 15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    updateField('auto_watch_interval', String(mins));
                    if (watchStatus?.enabled) {
                      watchToggleMutation.mutate({ enabled: true, intervalMinutes: mins });
                    }
                  }}
                  className="rounded-lg text-xs font-mono font-medium transition-all duration-200"
                  style={{
                    height: '2rem',
                    padding: '0 0.75rem',
                    ...((Number(form.auto_watch_interval) || 5) === mins
                      ? {
                          background: 'rgba(232,168,73,0.1)',
                          color: 'var(--color-accent)',
                          border: '1px solid rgba(232,168,73,0.25)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          color: 'var(--color-foreground-tertiary)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }
                    ),
                  }}
                >
                  {mins < 60 ? `${mins}m` : '1h'}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Live Status */}
        {watchStatus?.enabled && (
          <>
            <div
              style={{
                height: '1px',
                marginTop: '1rem',
                marginBottom: '1rem',
                background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)',
              }}
            />
            <div className="flex items-center gap-3 mb-2">
              <div
                className="rounded flex items-center justify-center shrink-0"
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Activity className="w-3 h-3 text-foreground-tertiary" />
              </div>
              <span className="text-xs text-foreground-secondary font-medium">{t('settings.status')}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${watchStatus.processing ? 'bg-accent animate-pulse' : 'bg-success'}`} />
                {watchStatus.processing ? t('dashboard.processing') : t('settings.watching')}
              </span>
              {watchStatus.lastRun && (
                <span className="font-mono tabular-nums">
                  {t('settings.lastRun')}: {formatTimeAgo(watchStatus.lastRun)}
                </span>
              )}
              {watchStatus.nextRun && !watchStatus.processing && (
                <span className="font-mono tabular-nums">
                  {t('settings.nextRun')}: {formatTimeAgo(watchStatus.nextRun)}
                </span>
              )}
            </div>

            {/* Recent Logs */}
            {watchStatus.logs.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                {watchStatus.logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px]">
                    <span className={`shrink-0 mt-1.5 w-1 h-1 rounded-full ${
                      log.type === 'success' ? 'bg-success' :
                      log.type === 'error' ? 'bg-error' :
                      log.type === 'warning' ? 'bg-warning' :
                      'bg-foreground-tertiary'
                    }`} />
                    <span className="text-foreground-tertiary leading-relaxed">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabDanger({
  resetConfirm,
  setResetConfirm,
  resetDone,
  resetMutation,
  onboardingConfirm,
  setOnboardingConfirm,
  onboardingResetMutation,
}: {
  resetConfirm: boolean;
  setResetConfirm: (v: boolean) => void;
  resetDone: boolean;
  resetMutation: {
    mutate: () => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
  onboardingConfirm: boolean;
  setOnboardingConfirm: (v: boolean) => void;
  onboardingResetMutation: {
    mutate: () => void;
    isPending: boolean;
  };
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col" style={{ gap: '1rem' }}>
      <div
        className="relative rounded-xl border border-error/20 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
          padding: '1.25rem',
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '3px',
            background: 'linear-gradient(to bottom, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.1) 100%)',
          }}
        />

        <div className="flex items-center gap-3 mb-1">
          <div
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{
              width: '2rem',
              height: '2rem',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.1)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-error" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{t('settings.resetLibrary')}</h3>
        </div>
        <p className="text-xs text-foreground-tertiary" style={{ marginBottom: '1rem' }}>
          {t('settings.resetLibraryDesc')}
        </p>

        {resetDone ? (
          <div className="flex items-center gap-2 text-sm text-accent">
            <CheckCircle2 className="w-4 h-4" />
            {t('settings.resetComplete')}
          </div>
        ) : resetConfirm ? (
          <div className="flex flex-col gap-3">
            <div
              className="relative flex items-start gap-3 rounded-lg overflow-hidden"
              style={{
                padding: '0.75rem',
                background: 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.1)',
              }}
            >
              <div
                className="rounded flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.12)',
                }}
              >
                <AlertTriangle className="w-3 h-3 text-error" />
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                {t('settings.resetWarning')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="inline-flex items-center gap-2 h-8 rounded-lg text-xs font-medium
                           bg-error text-white hover:bg-error/80
                           transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: '0 1rem' }}
              >
                {resetMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                {resetMutation.isPending ? t('settings.resetting') : t('settings.confirmReset')}
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                disabled={resetMutation.isPending}
                className="h-8 rounded-lg text-xs font-medium text-foreground-secondary
                           bg-surface-tertiary hover:bg-surface-tertiary/80 border border-border-subtle
                           transition-all duration-200 disabled:opacity-40"
                style={{ padding: '0 1rem' }}
              >
                {t('settings.cancel')}
              </button>
            </div>
            {resetMutation.isError && (
              <p className="text-xs text-error">{resetMutation.error?.message}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setResetConfirm(true)}
            className="inline-flex items-center gap-2 h-8 rounded-lg text-xs font-medium
                       text-error bg-error/10 border border-error/20 hover:bg-error/20
                       transition-all duration-200"
            style={{ padding: '0 1rem' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('settings.resetLibrary')}
          </button>
        )}
      </div>

      {/* Restart Onboarding */}
      <div
        className="relative rounded-xl border border-error/20 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
          padding: '1.25rem',
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '3px',
            background: 'linear-gradient(to bottom, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.1) 100%)',
          }}
        />

        <div className="flex items-center gap-3 mb-1">
          <div
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{
              width: '2rem',
              height: '2rem',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.1)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-error" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{t('settings.restartOnboarding')}</h3>
        </div>
        <p className="text-xs text-foreground-tertiary" style={{ marginBottom: '1rem' }}>
          {t('settings.restartOnboardingDesc')}
        </p>

        {onboardingConfirm ? (
          <div className="flex flex-col gap-3">
            <div
              className="relative flex items-start gap-3 rounded-lg overflow-hidden"
              style={{
                padding: '0.75rem',
                background: 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.1)',
              }}
            >
              <div
                className="rounded flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.12)',
                }}
              >
                <AlertTriangle className="w-3 h-3 text-error" />
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                {t('settings.restartWarning')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onboardingResetMutation.mutate()}
                disabled={onboardingResetMutation.isPending}
                className="inline-flex items-center gap-2 h-8 rounded-lg text-xs font-medium
                           bg-error text-white hover:bg-error/80
                           transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: '0 1rem' }}
              >
                {onboardingResetMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                {onboardingResetMutation.isPending ? t('settings.resetting') : t('settings.confirmRestart')}
              </button>
              <button
                onClick={() => setOnboardingConfirm(false)}
                disabled={onboardingResetMutation.isPending}
                className="h-8 rounded-lg text-xs font-medium text-foreground-secondary
                           bg-surface-tertiary hover:bg-surface-tertiary/80 border border-border-subtle
                           transition-all duration-200 disabled:opacity-40"
                style={{ padding: '0 1rem' }}
              >
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOnboardingConfirm(true)}
            className="inline-flex items-center gap-2 h-8 rounded-lg text-xs font-medium
                       text-error bg-error/10 border border-error/20 hover:bg-error/20
                       transition-all duration-200"
            style={{ padding: '0 1rem' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('settings.restartOnboarding')}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════════════════

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-border-subtle overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
        padding: '1.25rem',
      }}
    >
      <div className="flex items-center gap-3 mb-1">
        <div
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{
            width: '2rem',
            height: '2rem',
            background: 'rgba(232,168,73,0.06)',
            border: '1px solid rgba(232,168,73,0.08)',
          }}
        >
          <Icon className="w-3.5 h-3.5 text-accent" />
        </div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-foreground-tertiary" style={{ marginBottom: '1rem' }}>{description}</p>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 rounded-lg bg-surface-tertiary border border-border-subtle text-sm text-foreground
                  placeholder:text-foreground-tertiary/50 focus:outline-none focus:border-accent/30 focus:ring-1
                  focus:ring-accent/10 transition-all ${mono ? 'font-mono' : ''}`}
      style={{ padding: '0 0.75rem' }}
    />
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label
        className="shrink-0 text-xs text-foreground-tertiary font-medium"
        style={{ width: '6.5rem' }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-9 rounded-lg bg-surface-tertiary border border-border-subtle text-sm
                   text-foreground font-mono placeholder:text-foreground-tertiary/50
                   focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all"
        style={{ padding: '0 0.75rem' }}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 rounded-lg bg-surface-tertiary border border-border-subtle text-sm text-foreground
                 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all cursor-pointer"
      style={{ padding: '0 0.75rem' }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ToggleInput({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative shrink-0 rounded-full transition-all duration-200"
        style={{
          width: '2.5rem',
          height: '1.375rem',
          background: value ? 'var(--color-accent)' : 'var(--color-surface-tertiary)',
          boxShadow: value ? '0 0 10px rgba(232,168,73,0.25)' : 'none',
          border: value ? '1px solid rgba(232,168,73,0.3)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          className="absolute rounded-full transition-all duration-200"
          style={{
            width: '0.875rem',
            height: '0.875rem',
            top: '0.1875rem',
            left: value ? 'calc(100% - 1.0625rem)' : '0.1875rem',
            background: value ? '#1a1a21' : 'rgba(255,255,255,0.35)',
            boxShadow: value ? '0 0 4px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      </button>
      {label && (
        <span className="text-sm text-foreground-secondary group-hover:text-foreground transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}

// ── Time formatting helper ──

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60000);
    if (mins < 1) return 'in < 1m';
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    return `in ${hours}h`;
  }

  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Pattern Preview Builder ──

function buildPreview(form: SettingsMap): string | null {
  const libraryPath = form.library_path;
  if (!libraryPath) return null;

  const artistPattern = form.naming_pattern_artist || '{artist}';
  const albumPattern = form.naming_pattern_album || '{year} - {album}';
  const trackPattern = form.naming_pattern_track || '{track_number} - {title}';

  const vars: Record<string, string> = {
    artist: 'Rammstein',
    album: 'Mutter',
    title: 'Mein Herz Brennt',
    year: '2001',
    track_number: '01',
    disc_number: '1',
    genre: 'Industrial Metal',
    format: 'flac',
  };

  const resolve = (pattern: string) =>
    pattern.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);

  const sep = libraryPath.includes('\\') ? '\\' : '/';
  return `${libraryPath}${sep}${resolve(artistPattern)}${sep}${resolve(albumPattern)}${sep}${resolve(trackPattern)}.flac`;
}
