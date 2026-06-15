import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonIcon,
} from '@ionic/react';
import {
  rocketOutline,
  notificationsOutline,
  sparklesOutline,
  chevronForward,
  chevronBack,
  checkmarkCircle,
} from 'ionicons/icons';
import { useOnboardingStore } from '@/store/onboarding.store';
import { loadSampleData } from '@/features/sample/seed';
import { useT } from '@/i18n/useT';
import { useSettingsStore } from '@/store/settings.store';
import type { TranslationKey } from '@/i18n';

interface Slide {
  emoji: string;
  icon: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

const SLIDES: Slide[] = [
  {
    emoji: '👋',
    icon: rocketOutline,
    titleKey: 'onboarding.welcome.title',
    bodyKey: 'onboarding.welcome.body',
  },
  {
    emoji: '🔔',
    icon: notificationsOutline,
    titleKey: 'onboarding.notif.title',
    bodyKey: 'onboarding.notif.body',
  },
  {
    emoji: '✨',
    icon: sparklesOutline,
    titleKey: 'onboarding.start.title',
    bodyKey: 'onboarding.start.body',
  },
];

export default function Onboarding() {
  const tr = useT();
  const history = useHistory();
  const finish = useOnboardingStore((s) => s.finish);
  const language = useSettingsStore((s) => s.language);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [withSample, setWithSample] = useState(true);

  // Force RTL handling for languages that need it.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const handleNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    // Submit: load sample data if chosen, then finish.
    setBusy(true);
    try {
      if (withSample) {
        await loadSampleData();
      }
      await finish();
      history.replace('/');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    setBusy(true);
    try {
      await finish();
      history.replace('/');
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        {/* Skip button */}
        {!isLast && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '8px 8px 0',
            }}
          >
            <button
              type="button"
              onClick={handleSkip}
              disabled={busy}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ion-color-medium)',
                fontSize: 14,
                fontWeight: 600,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              {tr('onboarding.skip')}
            </button>
          </div>
        )}

        {/* Carousel card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '24px 16px',
          }}
        >
          <div
            key={step}
            style={{
              fontSize: 96,
              lineHeight: 1,
              animation: 'onb-pop 480ms cubic-bezier(.4,1.6,.5,1)',
              marginBottom: 24,
            }}
          >
            {slide.emoji}
          </div>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--ion-color-primary)',
              color: '#fff',
              marginBottom: 24,
              boxShadow: '0 6px 18px rgba(99,102,241,0.35)',
            }}
          >
            <IonIcon icon={slide.icon} style={{ fontSize: 32 }} />
          </div>
          <h1
            key={`t-${step}`}
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              animation: 'onb-fade-up 380ms ease-out',
            }}
          >
            {tr(slide.titleKey)}
          </h1>
          <p
            key={`b-${step}`}
            style={{
              margin: '12px 0 0',
              color: 'var(--ion-color-medium)',
              maxWidth: 340,
              lineHeight: 1.5,
              animation: 'onb-fade-up 480ms 80ms ease-out backwards',
            }}
          >
            {tr(slide.bodyKey)}
          </p>
        </div>

        {/* Sample data toggle (only on last step) */}
        {isLast && (
          <div
            style={{
              margin: '0 16px 16px',
              padding: 16,
              borderRadius: 16,
              background: 'var(--ion-card-background)',
              boxShadow: 'var(--app-shadow-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 28 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {tr('onboarding.sample.title')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                {tr('onboarding.sample.body')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={withSample}
              onChange={(e) => setWithSample(e.target.checked)}
              style={{ width: 22, height: 22 }}
            />
          </div>
        )}

        {/* Step indicators + actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 24px',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background:
                    i === step ? 'var(--ion-color-primary)' : 'var(--ion-color-step-200, #ccc)',
                  transition: 'width 240ms ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={busy}
                style={actionBtnStyle(false)}
              >
                <IonIcon icon={chevronBack} />
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={busy}
              style={actionBtnStyle(true)}
            >
              {isLast ? (
                <>
                  <IonIcon icon={checkmarkCircle} style={{ marginRight: 6 }} />
                  {tr('onboarding.start.cta')}
                </>
              ) : (
                <>
                  {tr('common.next')}
                  <IonIcon icon={chevronForward} style={{ marginLeft: 6 }} />
                </>
              )}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes onb-pop {
            0% { transform: scale(0.4); opacity: 0; }
            60% { transform: scale(1.08); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes onb-fade-up {
            0% { transform: translateY(12px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
}

const actionBtnStyle = (primary: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 18px',
  borderRadius: 12,
  border: 'none',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  background: primary ? 'var(--ion-color-primary)' : 'var(--ion-color-step-100, #e5e5e5)',
  color: primary ? '#fff' : 'var(--ion-text-color)',
  boxShadow: primary ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
  transition: 'transform 120ms ease',
});
