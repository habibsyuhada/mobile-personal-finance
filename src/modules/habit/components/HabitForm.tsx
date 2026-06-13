import { useEffect, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonText,
  IonChip,
} from '@ionic/react';
import type { Habit, HabitType, NewHabit, Polarity, ScheduleType } from '../data/models';
import { useHabitStore } from '../store/habit.store';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n';

const COLORS = ['#6366f1', '#0ea5e9', '#16a34a', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
const WEEKDAY_KEYS: TranslationKey[] = [
  'habit.weekday.mon',
  'habit.weekday.tue',
  'habit.weekday.wed',
  'habit.weekday.thu',
  'habit.weekday.fri',
  'habit.weekday.sat',
  'habit.weekday.sun',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing?: Habit | null;
}

export default function HabitForm({ isOpen, onClose, editing }: Props) {
  const addHabit = useHabitStore((s) => s.addHabit);
  const editHabit = useHabitStore((s) => s.editHabit);
  const tr = useT();

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<HabitType>('binary');
  const [polarity, setPolarity] = useState<Polarity>('good');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [timesPerWeek, setTimesPerWeek] = useState('3');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setName(editing.name);
      setColor(editing.color ?? COLORS[0]);
      setType(editing.type);
      setPolarity(editing.polarity);
      setTarget(editing.target != null ? String(editing.target) : '');
      setUnit(editing.unit ?? '');
      setScheduleType(editing.scheduleType);
      setWeekdays(editing.weekdays ?? []);
      setTimesPerWeek(editing.timesPerWeek != null ? String(editing.timesPerWeek) : '3');
    } else {
      setName('');
      setColor(COLORS[0]);
      setType('binary');
      setPolarity('good');
      setTarget('');
      setUnit('');
      setScheduleType('daily');
      setWeekdays([]);
      setTimesPerWeek('3');
    }
    setError(null);
  }, [isOpen, editing]);

  const toggleWeekday = (wd: number) => {
    setWeekdays((prev) =>
      prev.includes(wd) ? prev.filter((d) => d !== wd) : [...prev, wd].sort()
    );
  };

  const save = async () => {
    const input: NewHabit = {
      name: name.trim(),
      color,
      icon: null,
      type,
      polarity,
      target: type === 'quantifiable' ? Number(target) || 0 : null,
      unit: type === 'quantifiable' ? unit || null : null,
      scheduleType,
      weekdays: scheduleType === 'weekdays' ? weekdays : null,
      timesPerWeek: scheduleType === 'times_per_week' ? Number(timesPerWeek) || 0 : null,
      reminderTime: null,
    };
    try {
      if (editing) await editHabit(editing.id, input);
      else await addHabit(input);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{editing ? tr('habit.editHabit') : tr('habit.newHabit')}</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>{tr('common.cancel')}</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton strong onClick={save}>
              {tr('common.save')}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">{tr('habit.name')}</IonLabel>
          <IonInput
            value={name}
            placeholder={tr('habit.namePlaceholder')}
            onIonInput={(e) => setName(e.detail.value ?? '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">{tr('habit.type')}</IonLabel>
          <IonSelect value={type} onIonChange={(e) => setType(e.detail.value)}>
            <IonSelectOption value="binary">{tr('habit.type.binary')}</IonSelectOption>
            <IonSelectOption value="quantifiable">{tr('habit.type.quantifiable')}</IonSelectOption>
          </IonSelect>
        </IonItem>

        {type === 'quantifiable' && (
          <>
            <IonItem>
              <IonLabel position="stacked">{tr('habit.target')}</IonLabel>
              <IonInput
                type="number"
                value={target}
                placeholder="8"
                onIonInput={(e) => setTarget(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{tr('habit.unit')}</IonLabel>
              <IonInput
                value={unit}
                placeholder={tr('habit.unitPlaceholder')}
                onIonInput={(e) => setUnit(e.detail.value ?? '')}
              />
            </IonItem>
          </>
        )}

        <IonItem>
          <IonLabel position="stacked">{tr('habit.polarity')}</IonLabel>
          <IonSelect value={polarity} onIonChange={(e) => setPolarity(e.detail.value)}>
            <IonSelectOption value="good">{tr('habit.polarity.good')}</IonSelectOption>
            <IonSelectOption value="bad">{tr('habit.polarity.bad')}</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">{tr('habit.schedule')}</IonLabel>
          <IonSelect value={scheduleType} onIonChange={(e) => setScheduleType(e.detail.value)}>
            <IonSelectOption value="daily">{tr('habit.schedule.daily')}</IonSelectOption>
            <IonSelectOption value="weekdays">{tr('habit.schedule.weekdays')}</IonSelectOption>
            <IonSelectOption value="times_per_week">{tr('habit.schedule.timesPerWeek')}</IonSelectOption>
          </IonSelect>
        </IonItem>

        {scheduleType === 'weekdays' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 16px' }}>
            {WEEKDAY_KEYS.map((key, i) => {
              const wd = i + 1;
              const active = weekdays.includes(wd);
              return (
                <IonChip
                  key={wd}
                  color={active ? 'primary' : undefined}
                  outline={!active}
                  onClick={() => toggleWeekday(wd)}
                >
                  {tr(key)}
                </IonChip>
              );
            })}
          </div>
        )}

        {scheduleType === 'times_per_week' && (
          <IonItem>
            <IonLabel position="stacked">{tr('habit.timesPerWeek')}</IonLabel>
            <IonInput
              type="number"
              value={timesPerWeek}
              onIonInput={(e) => setTimesPerWeek(e.detail.value ?? '')}
            />
          </IonItem>
        )}

        <IonItem lines="none">
          <IonLabel position="stacked">{tr('cat.color')}</IonLabel>
        </IonItem>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '0 16px' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: c,
                border: color === c ? '3px solid var(--ion-color-dark)' : '2px solid #fff',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {error && (
          <IonText color="danger">
            <p style={{ padding: '8px 16px' }}>{error}</p>
          </IonText>
        )}
      </IonContent>
    </IonModal>
  );
}
