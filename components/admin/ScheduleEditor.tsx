/**
 * 📁 /components/admin/ScheduleEditor.tsx
 * 
 * 📅 КОМПОНЕНТ ДЛЯ РЕДАКТИРОВАНИЯ РАСПИСАНИЯ
 * 
 * Позволяет:
 * - Выбрать день недели
 * - Добавить примечание
 * - Удалить расписание
 */

'use client';

import { useState } from 'react';

export interface ScheduleDay {
  dayBig: string;
  dayLabel: string;
  note: string;
}

const DAYS = [
  { dayBig: 'ПН', dayLabel: 'Понеділок' },
  { dayBig: 'ВТ', dayLabel: 'Вівторок' },
  { dayBig: 'СР', dayLabel: 'Середа' },
  { dayBig: 'ЧТ', dayLabel: 'Четвер' },
  { dayBig: 'ПТ', dayLabel: "П'ятниця" },
  { dayBig: 'СБ', dayLabel: 'Субота' },
  { dayBig: 'НД', dayLabel: 'Неділя' },
];

interface ScheduleEditorProps {
  scheduleDay?: ScheduleDay | null;
  onSave: (schedule: ScheduleDay | null) => void;
}

export function ScheduleEditor({ scheduleDay, onSave }: ScheduleEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(scheduleDay?.dayBig || '');
  const [note, setNote] = useState(scheduleDay?.note || '');

  const handleSave = () => {
    if (!selectedDay) {
      onSave(null);
    } else {
      const day = DAYS.find(d => d.dayBig === selectedDay);
      if (day) {
        onSave({
          dayBig: day.dayBig,
          dayLabel: day.dayLabel,
          note: note || `Нове оновлення кожного ${day.dayLabel.toLowerCase()}`,
        });
      }
    }
    setIsOpen(false);
  };

  const handleRemove = () => {
    setSelectedDay('');
    setNote('');
    onSave(null);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text-main">
        📅 Расписание выпусков
      </label>

      {scheduleDay ? (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-400">
                {scheduleDay.dayBig} — {scheduleDay.dayLabel}
              </p>
              <p className="text-sm text-text-muted">{scheduleDay.note}</p>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Изменить
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full p-3 border-2 border-dashed border-text-muted/50 hover:border-blue-500 rounded-lg text-text-muted hover:text-blue-400 transition-colors font-semibold"
        >
          + Добавить в расписание
        </button>
      )}

      {/* Модаль */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-alt border border-text-muted/20 rounded-xl w-full max-w-md">
            <div className="border-b border-text-muted/20 p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-main">📅 Добавить в расписание</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-text-main text-2xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Выбор дня */}
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  Выберите день недели
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day.dayBig}
                      onClick={() => setSelectedDay(day.dayBig)}
                      className={`px-3 py-2 rounded font-bold transition-colors ${
                        selectedDay === day.dayBig
                          ? 'bg-blue-600 text-white'
                          : 'bg-text-muted/10 text-text-main hover:bg-text-muted/20'
                      }`}
                    >
                      {day.dayBig}
                    </button>
                  ))}
                </div>
              </div>

              {/* Примечание */}
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  Примечание (опционально)
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Например: Новое обновление каждый понедельник"
                  className="w-full px-3 py-2 bg-bg-main border border-text-muted/30 rounded-lg text-text-main placeholder-text-muted/50 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Preview */}
              {selectedDay && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-text-muted">Превью:</p>
                  <p className="font-bold text-blue-400">
                    {selectedDay} — {DAYS.find(d => d.dayBig === selectedDay)?.dayLabel}
                  </p>
                  <p className="text-sm text-text-muted">
                    {note || `Нове оновлення кожного ${DAYS.find(d => d.dayBig === selectedDay)?.dayLabel.toLowerCase()}`}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 flex gap-3 border-t border-text-muted/20">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-text-muted/20 hover:bg-text-muted/30 text-text-main font-semibold rounded-lg transition-colors"
              >
                Отмена
              </button>

              {scheduleDay && (
                <button
                  onClick={handleRemove}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Удалить расписание
                </button>
              )}

              {selectedDay && (
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Сохранить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}