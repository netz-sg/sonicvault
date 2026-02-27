'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Music,
  ScanSearch,
  Sparkles,
  ArrowRightLeft,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Rocket,
  Globe,
} from 'lucide-react';
import { useToastStore } from '@/lib/store/useToastStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import type { Locale } from '@/lib/i18n/translations';

// ── Constants ──

const TOTAL_STEPS = 5;

const EASE_OUT_QUART = [0.25, 0.1, 0.25, 1] as const;

// ── Slide Variants (direction-aware) ──

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    filter: 'blur(4px)',
  }),
};

const slideTransition = {
  duration: 0.35,
  ease: EASE_OUT_QUART,
};

// ── Artist Images Background ──

interface ArtistItem {
  id: string;
  name: string;
  imageUrl: string | null;
}

function ArtistImagesBackground() {
  const { data: artistData } = useQuery<{ items: ArtistItem[] }>({
    queryKey: ['artists-onboarding-bg'],
    queryFn: () => fetch('/api/artists?limit=20').then((r) => r.json()),
    staleTime: Infinity,
    retry: false,
  });

  const images = (artistData?.items ?? [])
    .filter((a) => a.imageUrl)
    .slice(0, 16);

  if (images.length < 4) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Animated floating image grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(4, 1fr)`,
          gap: '1rem',
          padding: '2rem',
          filter: 'blur(28px) saturate(0.5) brightness(0.35)',
          opacity: 0.4,
          transform: 'scale(1.15)',
        }}
      >
        {images.map((artist, i) => (
          <motion.div
            key={artist.id}
            className="rounded-xl overflow-hidden"
            animate={{
              y: [0, i % 2 === 0 ? -14 : 14, 0],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 8 + (i % 4) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
            style={{
              aspectRatio: '1',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.imageUrl!}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Heavy overlay to keep images very subtle */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(10,10,12,0.7) 0%, rgba(10,10,12,0.92) 70%, rgba(10,10,12,0.98) 100%)',
        }}
      />
    </div>
  );
}

// ── Main Component ──

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [libraryPath, setLibraryPath] = useState('');
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const { t, locale } = useTranslation();
  const setLocale = useLocaleStore((s) => s.setLocale);

  // Pre-fill library path from existing settings (e.g. Docker sets LIBRARY_PATH=/music/library)
  const { data: existingSettings } = useQuery<Record<string, string>>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (existingSettings?.library_path && !libraryPath) {
      setLibraryPath(existingSettings.library_path);
    }
  }, [existingSettings?.library_path, libraryPath]);

  // Step labels using translations
  const stepLabels = [
    t('onboarding.language'),
    t('onboarding.welcome'),
    t('onboarding.features'),
    t('onboarding.librarySetup'),
    t('onboarding.ready'),
  ];

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          library_path: libraryPath,
          ui_language: locale,
          onboarding_completed: 'true',
        }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast({
        type: 'success',
        title: t('onboarding.toastTitle'),
        description: t('onboarding.toastDesc'),
      });
    },
  });

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  // Library path is required on step 3 (Library Setup)
  const canProceed = step !== 3 || libraryPath.trim().length > 0;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-surface overflow-hidden">
      {/* ── Artist Images Background ── */}
      <ArtistImagesBackground />

      {/* ── Atmospheric Background ── */}

      {/* Primary amber orb — top right, warm glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '50rem',
          height: '50rem',
          top: '-18rem',
          right: '-14rem',
          background: 'radial-gradient(circle, rgba(232,168,73,0.05) 0%, rgba(232,168,73,0.015) 40%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
        }}
      />

      {/* Secondary orb — bottom left, cooler amber */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '40rem',
          height: '40rem',
          bottom: '-14rem',
          left: '-12rem',
          background: 'radial-gradient(circle, rgba(232,168,73,0.035) 0%, transparent 65%)',
          filter: 'blur(40px)',
          zIndex: 1,
        }}
      />

      {/* Faint center orb for depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '30rem',
          height: '30rem',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(232,168,73,0.02) 0%, transparent 60%)',
          filter: 'blur(60px)',
          zIndex: 1,
        }}
      />

      {/* Vertical hairlines */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: '12%',
          width: '1px',
          background: 'linear-gradient(180deg, transparent 5%, rgba(255,255,255,0.018) 30%, rgba(255,255,255,0.018) 70%, transparent 95%)',
          zIndex: 1,
        }}
      />
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          right: '12%',
          width: '1px',
          background: 'linear-gradient(180deg, transparent 5%, rgba(255,255,255,0.018) 30%, rgba(255,255,255,0.018) 70%, transparent 95%)',
          zIndex: 1,
        }}
      />

      {/* Horizontal hairline */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: '18%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.015) 30%, rgba(255,255,255,0.015) 70%, transparent 90%)',
          zIndex: 1,
        }}
      />

      {/* ── Wizard Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT_QUART }}
        className="relative w-full rounded-2xl border border-border-subtle overflow-hidden"
        style={{
          maxWidth: '38rem',
          margin: '0 1.5rem',
          background: 'linear-gradient(180deg, #131317 0%, #0E0E12 100%)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025), inset 0 1px 0 rgba(255,255,255,0.02)',
          zIndex: 2,
        }}
      >
        {/* Top filament line */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 5%, rgba(232,168,73,0.15) 30%, rgba(232,168,73,0.25) 50%, rgba(232,168,73,0.15) 70%, transparent 95%)',
          }}
        />

        {/* ── Progress Bar ── */}
        <div style={{ padding: '1.5rem 2rem 0' }}>
          <div className="flex items-center" style={{ gap: '0.375rem' }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full overflow-hidden"
                style={{ height: '2.5px', background: 'rgba(255,255,255,0.04)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={false}
                  animate={{ width: i <= step ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
                  style={{
                    background: i <= step
                      ? 'linear-gradient(90deg, var(--color-accent-dark), var(--color-accent))'
                      : 'transparent',
                    boxShadow: i <= step ? '0 0 8px rgba(232,168,73,0.35)' : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Step label row */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-foreground-tertiary font-mono tabular-nums">
              {step + 1} / {TOTAL_STEPS}
            </span>
            <span className="text-[11px] text-foreground-tertiary tracking-wide uppercase">
              {stepLabels[step]}
            </span>
          </div>
        </div>

        {/* ── Step Content ── */}
        <div
          className="relative overflow-hidden"
          style={{ padding: '1.25rem 2rem', minHeight: '21rem' }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              {step === 0 && (
                <StepLanguage
                  locale={locale}
                  setLocale={setLocale}
                  onContinue={goNext}
                />
              )}
              {step === 1 && <StepWelcome />}
              {step === 2 && <StepFeatures />}
              {step === 3 && (
                <StepLibrary
                  libraryPath={libraryPath}
                  setLibraryPath={setLibraryPath}
                />
              )}
              {step === 4 && <StepReady libraryPath={libraryPath} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Separator ── */}
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.05) 70%, transparent 95%)',
          }}
        />

        {/* ── Navigation Footer ── */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '1.25rem 2rem' }}
        >
          {step > 0 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-foreground-tertiary
                         hover:text-foreground-secondary transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('onboarding.back')}
            </button>
          ) : (
            <div />
          )}

          {step === 0 ? (
            /* Language step: no Next button — user picks a language card which auto-advances */
            <div />
          ) : step < TOTAL_STEPS - 1 ? (
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold
                         transition-all duration-200
                         disabled:opacity-25 disabled:cursor-not-allowed"
              style={{
                height: '2.75rem',
                padding: '0 1.5rem',
                background: canProceed
                  ? 'linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)'
                  : 'var(--color-surface-tertiary)',
                color: canProceed ? 'var(--color-surface)' : 'var(--color-foreground-tertiary)',
                border: canProceed ? '1px solid rgba(232,168,73,0.4)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: canProceed
                  ? '0 0 20px rgba(232,168,73,0.12), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : 'none',
              }}
            >
              {step === 3 ? t('onboarding.continue') : t('onboarding.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold
                         transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                height: '2.75rem',
                padding: '0 1.5rem',
                background: 'linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)',
                color: 'var(--color-surface)',
                border: '1px solid rgba(232,168,73,0.4)',
                boxShadow: '0 0 20px rgba(232,168,73,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {completeMutation.isPending ? t('onboarding.settingUp') : t('onboarding.launch')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Step 0 — Language Selection
// ═══════════════════════════════════════════════════════

function StepLanguage({
  locale,
  setLocale,
  onContinue,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();

  const selectLanguage = useCallback(
    (lang: Locale) => {
      setLocale(lang);
      // Small delay so the user sees the selection highlight before advancing
      setTimeout(() => onContinue(), 250);
    },
    [setLocale, onContinue],
  );

  return (
    <div className="flex flex-col items-center text-center">
      {/* Globe icon */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          width: '4.5rem',
          height: '4.5rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(232,168,73,0.14) 0%, rgba(232,168,73,0.04) 100%)',
          border: '1px solid rgba(232,168,73,0.12)',
          boxShadow: '0 0 40px rgba(232,168,73,0.06), inset 0 1px 0 rgba(232,168,73,0.08)',
        }}
      >
        <Globe className="w-7 h-7 text-accent" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: EASE_OUT_QUART }}
        className="font-heading text-foreground"
        style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}
      >
        {t('onboarding.chooseLanguage')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.5, ease: EASE_OUT_QUART }}
        className="text-sm text-foreground-secondary leading-relaxed"
        style={{ marginBottom: '2rem', maxWidth: '24rem' }}
      >
        {t('onboarding.chooseLanguageDesc')}
      </motion.p>

      {/* Language cards */}
      <div className="flex w-full" style={{ gap: '0.75rem' }}>
        {([
          { code: 'en' as Locale, label: 'English', flag: 'EN', sub: 'Continue in English' },
          { code: 'de' as Locale, label: 'Deutsch', flag: 'DE', sub: 'Weiter auf Deutsch' },
        ]).map((lang, i) => {
          const isSelected = locale === lang.code;
          return (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.45, ease: EASE_OUT_QUART }}
              onClick={() => selectLanguage(lang.code)}
              className="flex-1 flex flex-col items-center rounded-xl cursor-pointer
                         transition-all duration-200"
              style={{
                padding: '1.5rem 1rem',
                background: isSelected
                  ? 'rgba(232,168,73,0.06)'
                  : 'rgba(255,255,255,0.015)',
                border: isSelected
                  ? '1px solid rgba(232,168,73,0.2)'
                  : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isSelected
                  ? '0 0 20px rgba(232,168,73,0.06), inset 0 1px 0 rgba(232,168,73,0.04)'
                  : 'none',
              }}
              whileHover={{
                borderColor: isSelected ? 'rgba(232,168,73,0.3)' : 'rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(232,168,73,0.08)' : 'rgba(255,255,255,0.03)',
              }}
            >
              {/* Flag badge */}
              <div
                className="flex items-center justify-center rounded-lg font-mono text-xs font-bold tracking-wider"
                style={{
                  width: '3rem',
                  height: '2.25rem',
                  marginBottom: '0.75rem',
                  background: isSelected ? 'rgba(232,168,73,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? '1px solid rgba(232,168,73,0.15)'
                    : '1px solid rgba(255,255,255,0.06)',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-foreground-secondary)',
                }}
              >
                {lang.flag}
              </div>
              <span
                className="font-medium"
                style={{
                  fontSize: '0.9375rem',
                  marginBottom: '0.25rem',
                  color: isSelected ? 'var(--color-foreground)' : 'var(--color-foreground-secondary)',
                }}
              >
                {lang.label}
              </span>
              <span className="text-xs text-foreground-tertiary">
                {lang.sub}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Step 1 — Welcome
// ═══════════════════════════════════════════════════════

function StepWelcome() {
  const { t } = useTranslation();

  const pills = [
    t('onboarding.pillLocal'),
    t('onboarding.pillMetadata'),
    t('onboarding.pillCovers'),
    t('onboarding.pillLyrics'),
  ];

  return (
    <div className="flex flex-col items-center text-center">
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          width: '5rem',
          height: '5rem',
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, rgba(232,168,73,0.14) 0%, rgba(232,168,73,0.04) 100%)',
          border: '1px solid rgba(232,168,73,0.12)',
          boxShadow: '0 0 40px rgba(232,168,73,0.06), inset 0 1px 0 rgba(232,168,73,0.08)',
        }}
      >
        <Music className="w-8 h-8 text-accent" />
        {/* Inner glow ring */}
        <div
          className="absolute inset-1 rounded-xl pointer-events-none"
          style={{ border: '1px solid rgba(232,168,73,0.04)' }}
        />
      </motion.div>

      {/* App name */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT_QUART }}
        className="flex items-baseline"
        style={{ gap: '0.3rem', marginBottom: '0.5rem' }}
      >
        <span
          className="font-heading text-foreground"
          style={{ fontSize: '2.25rem', letterSpacing: '-0.02em' }}
        >
          Sonic
        </span>
        <span
          className="font-heading text-accent"
          style={{ fontSize: '2.25rem', letterSpacing: '-0.02em' }}
        >
          Vault
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5, ease: EASE_OUT_QUART }}
        className="text-sm text-foreground-secondary leading-relaxed"
        style={{ marginBottom: '2rem', maxWidth: '26rem' }}
      >
        {t('onboarding.tagline')}
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.5, ease: EASE_OUT_QUART }}
        className="flex flex-wrap items-center justify-center"
        style={{ gap: '0.5rem' }}
      >
        {pills.map((tag) => (
          <span
            key={tag}
            className="rounded-full text-[11px] font-medium text-foreground-tertiary"
            style={{
              padding: '0.375rem 0.875rem',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {tag}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Step 2 — Features
// ═══════════════════════════════════════════════════════

function StepFeatures() {
  const { t } = useTranslation();

  const features = [
    {
      icon: ScanSearch,
      title: t('onboarding.scanTitle'),
      description: t('onboarding.scanDesc'),
    },
    {
      icon: Sparkles,
      title: t('onboarding.enrichTitle'),
      description: t('onboarding.enrichDesc'),
    },
    {
      icon: ArrowRightLeft,
      title: t('onboarding.organizeTitle'),
      description: t('onboarding.organizeDesc'),
    },
  ];

  return (
    <div>
      <h2
        className="font-heading text-foreground text-center"
        style={{ fontSize: '1.35rem', marginBottom: '0.375rem' }}
      >
        {t('onboarding.featuresTitle')}
      </h2>
      <p
        className="text-sm text-foreground-tertiary text-center"
        style={{ marginBottom: '1.5rem' }}
      >
        {t('onboarding.featuresSubtitle')}
      </p>

      <div className="flex flex-col" style={{ gap: '0.625rem' }}>
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.1,
                duration: 0.45,
                ease: EASE_OUT_QUART,
              }}
              className="flex items-start gap-3 rounded-xl"
              style={{
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.035)',
              }}
            >
              <div
                className="rounded-lg flex items-center justify-center shrink-0"
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  background: 'rgba(232,168,73,0.06)',
                  border: '1px solid rgba(232,168,73,0.08)',
                }}
              >
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <h3
                  className="text-sm font-medium text-foreground"
                  style={{ marginBottom: '0.2rem' }}
                >
                  {feature.title}
                </h3>
                <p className="text-xs text-foreground-tertiary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Step 3 — Library Setup
// ═══════════════════════════════════════════════════════

function StepLibrary({
  libraryPath,
  setLibraryPath,
}: {
  libraryPath: string;
  setLibraryPath: (v: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div
        className="flex flex-col items-center text-center"
        style={{ marginBottom: '1.75rem' }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
          className="rounded-xl flex items-center justify-center"
          style={{
            width: '3.25rem',
            height: '3.25rem',
            marginBottom: '1rem',
            background: 'rgba(232,168,73,0.06)',
            border: '1px solid rgba(232,168,73,0.08)',
          }}
        >
          <FolderOpen className="w-5 h-5 text-accent" />
        </motion.div>
        <h2
          className="font-heading text-foreground"
          style={{ fontSize: '1.35rem', marginBottom: '0.375rem' }}
        >
          {t('onboarding.setLibraryPath')}
        </h2>
        <p
          className="text-sm text-foreground-secondary leading-relaxed"
          style={{ maxWidth: '24rem' }}
        >
          {t('onboarding.setLibraryPathDesc')}
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: '1rem' }}>
        <label
          className="block text-[11px] text-foreground-tertiary font-medium uppercase tracking-wider"
          style={{ marginBottom: '0.5rem' }}
        >
          {t('onboarding.libraryFolder')}
        </label>
        <input
          type="text"
          value={libraryPath}
          onChange={(e) => setLibraryPath(e.target.value)}
          placeholder="/music/library or D:\Music\Library"
          className="w-full rounded-lg bg-surface-tertiary text-sm text-foreground font-mono
                     placeholder:text-foreground-tertiary/40
                     focus:outline-none transition-all duration-200"
          style={{
            height: '2.875rem',
            padding: '0 1rem',
            border: libraryPath.trim()
              ? '1px solid rgba(232,168,73,0.2)'
              : '1px solid rgba(255,255,255,0.06)',
            boxShadow: libraryPath.trim()
              ? '0 0 12px rgba(232,168,73,0.04), inset 0 0 0 1px rgba(232,168,73,0.05)'
              : 'none',
          }}
          autoFocus
        />
      </div>

      {/* Hint box */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          padding: '0.75rem 0.875rem 0.75rem 1.125rem',
          background: 'rgba(232,168,73,0.015)',
          border: '1px solid rgba(232,168,73,0.06)',
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '3px',
            background: 'linear-gradient(to bottom, rgba(232,168,73,0.5) 0%, rgba(232,168,73,0.08) 100%)',
          }}
        />
        <p className="text-xs text-foreground-tertiary leading-relaxed">
          {t('onboarding.libraryHint')}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Step 4 — Ready
// ═══════════════════════════════════════════════════════

function StepReady({ libraryPath }: { libraryPath: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center text-center">
      {/* Success badge */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: '4.5rem',
          height: '4.5rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(74,222,128,0.1) 0%, rgba(74,222,128,0.03) 100%)',
          border: '1px solid rgba(74,222,128,0.12)',
          boxShadow: '0 0 32px rgba(74,222,128,0.05)',
        }}
      >
        <CheckCircle2 className="w-7 h-7 text-success" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT_QUART }}
        className="font-heading text-foreground"
        style={{ fontSize: '1.35rem', marginBottom: '0.375rem' }}
      >
        {t('onboarding.allSet')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT_QUART }}
        className="text-sm text-foreground-secondary leading-relaxed"
        style={{ marginBottom: '1.5rem', maxWidth: '24rem' }}
      >
        {t('onboarding.allSetDesc')}
      </motion.p>

      {/* Path display */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4, ease: EASE_OUT_QUART }}
        className="w-full rounded-xl text-left"
        style={{
          padding: '1rem 1.25rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span className="text-[10px] text-foreground-tertiary font-medium uppercase tracking-widest">
          {t('onboarding.libraryPathLabel')}
        </span>
        <p
          className="text-sm font-mono text-accent break-all"
          style={{ marginTop: '0.375rem', lineHeight: 1.5 }}
        >
          {libraryPath}
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: EASE_OUT_QUART }}
        className="text-xs text-foreground-tertiary leading-relaxed"
        style={{ marginTop: '1.5rem', maxWidth: '22rem' }}
      >
        {t('onboarding.readyHint')}
      </motion.p>
    </div>
  );
}
