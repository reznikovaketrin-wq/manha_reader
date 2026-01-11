/**
 * 📁 /components/admin/ScheduleEditor.tsx
 * 
 * 📅 КОМПОНЕНТ ДЛЯ РЕДАКТИРОВАНИЯ РАСПИСАНИЯ
 * 
 * ✅ ИСПРАВЛЕНО: Правильная обработка примечания при смене дня
 */

'use client';

import { useState, useEffect } from 'react';

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
  const [note, setNote] = useState(''); // ✅ ИСПРАВЛЕНО: Не инициализируем со старым значением
  const [hasNoteChanged, setHasNoteChanged] = useState(false);

  // ✅ ИСПРАВЛЕНО: При открытии модали устанавливаем текущее примечание
  const handleOpenModal = () => {
    if (scheduleDay) {
      // Если редактируем существующее расписание
      setSelectedDay(scheduleDay.dayBig);
      setNote(scheduleDay.note); // Установим текущее значение
    } else {
      // Если добавляем новое расписание
      setSelectedDay('');
      setNote('');
    }
    setHasNoteChanged(false);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!selectedDay) {
      onSave(null);
    } else {
      const day = DAYS.find(d => d.dayBig === selectedDay);
      if (day) {
        // ✅ ИСПРАВЛЕНО: Используем примечание как есть, или генерируем дефолтное
        const finalNote = note.trim() 
          ? note 
          : `Нове оновлення кожного ${day.dayLabel.toLowerCase()}`;
        
        console.log('💾 [ScheduleEditor] Saving with:', {
          day: day.dayLabel,
          note: finalNote,
        });

        onSave({
          dayBig: day.dayBig,
          dayLabel: day.dayLabel,
          note: finalNote,
        });
      }
    }
    setIsOpen(false);
  };

  const handleRemove = () => {
    setSelectedDay('');
    setNote('');
    setHasNoteChanged(false);
    onSave(null);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text-main">
        📅 Расписание выпусков
      </label>

      {scheduleDay ? (
        <div className="p-4 bg-gradient-to-br from-[#ff1b6d]/10 to-[#a259ff]/10 border border-accent-gradient/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff1b6d] to-[#a259ff]">
                {scheduleDay.dayBig} — {scheduleDay.dayLabel}
              </p>
              <p className="text-sm text-text-muted">{scheduleDay.note}</p>
            </div>
            <button
              onClick={handleOpenModal}
              className="px-3 py-1 text-sm rounded-lg font-medium text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #FF1B6D, #A259FF)',
              }}
            >
              Изменить
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleOpenModal}
          className="w-full p-3 border-2 border-dashed border-white/10 rounded-xl text-text-muted hover:border-white/20 transition-all font-semibold bg-transparent"
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
                          ? 'bg-[#ff1b6d] text-white'
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
                  onChange={e => {
                    setNote(e.target.value);
                    setHasNoteChanged(true);
                  }}
                  placeholder="Например: Новое обновление каждый понедельник"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-xl text-text-main placeholder-text-muted/50 focus:outline-none focus:border-[#ff1b6d]"
                  rows={3}
                />
              </div>

              {/* Preview */}
              {selectedDay && (
                <div className="p-3 bg-gradient-to-br from-[#ff1b6d]/10 to-[#a259ff]/10 border border-accent-gradient/30 rounded-lg">
                  <p className="text-sm text-text-muted">Превью:</p>
                  <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff1b6d] to-[#a259ff]">
                    {selectedDay} — {DAYS.find(d => d.dayBig === selectedDay)?.dayLabel}
                  </p>
                  <p className="text-sm text-text-muted">
                    {note.trim() || `Нове оновлення кожного ${DAYS.find(d => d.dayBig === selectedDay)?.dayLabel.toLowerCase()}`}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 flex gap-3 border-t border-text-muted/20">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-3 bg-transparent text-white font-semibold rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
              >
                Отмена
              </button>

              {scheduleDay && (
                <button
                  onClick={handleRemove}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
                >
                  Удалить расписание
                </button>
              )}

              {selectedDay && (
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 px-4 relative bg-black text-white font-semibold rounded-xl transition-all overflow-hidden"
                  style={{
                    background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                    border: '2px solid transparent',
                  }}
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