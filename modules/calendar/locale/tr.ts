import type { CalendarMessages } from '../calendar.types';

export const TR_MESSAGES: CalendarMessages = {
  today: 'Bugün',
  previous: 'Önceki',
  next: 'Sonraki',
  month: 'Ay',
  week: 'Hafta',
  day: 'Gün',
  agenda: 'Ajanda',
  resource: 'Kaynak',
  allDay: 'Tüm gün',
  noEvents: 'Etkinlik yok',
  more: (n) => `+${n} daha`,
  edit: 'Düzenle',
  delete: 'Sil',
  confirmDelete: 'Silinsin mi?',
  close: 'Kapat',
  calendars: 'Takvimler',
  noResources: 'Kaynak tanımlı değil',
  search: 'Etkinliklerde ara…',
  showing: (label) => `${label} gösteriliyor`,
  cellLabel: (date, count) =>
    count > 0 ? `${date}, ${count} etkinlik` : `${date}, etkinlik yok`,
};

export const TR_WEEK_START = 1;

export const TR_MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const TR_DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
export const TR_DAY_LONG  = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
