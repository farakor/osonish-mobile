// Константы для опций вакансий

export interface VacancyOption {
  id: string;
  label: string;
  translationKey: string;
}

// Уровни опыта работы
export const EXPERIENCE_LEVELS: VacancyOption[] = [
  {
    id: 'no_experience',
    label: 'Нет опыта',
    translationKey: 'vacancy.experience_level.no_experience',
  },
  {
    id: '1_to_3_years',
    label: 'От 1 года до 3 лет',
    translationKey: 'vacancy.experience_level.1_to_3_years',
  },
  {
    id: '3_to_6_years',
    label: 'От 3 до 6 лет',
    translationKey: 'vacancy.experience_level.3_to_6_years',
  },
  {
    id: 'more_than_6_years',
    label: 'Более 6 лет',
    translationKey: 'vacancy.experience_level.more_than_6_years',
  },
];

// Типы занятости
export const EMPLOYMENT_TYPES: VacancyOption[] = [
  {
    id: 'full_time',
    label: 'Полная занятость',
    translationKey: 'vacancy.employment_type.full_time',
  },
  {
    id: 'part_time',
    label: 'Частичная занятость',
    translationKey: 'vacancy.employment_type.part_time',
  },
  {
    id: 'project',
    label: 'Проектная работа',
    translationKey: 'vacancy.employment_type.project',
  },
  {
    id: 'shift_work',
    label: 'Вахта',
    translationKey: 'vacancy.employment_type.shift_work',
  },
];

// Форматы работы
export const WORK_FORMATS: VacancyOption[] = [
  {
    id: 'on_site',
    label: 'На месте',
    translationKey: 'vacancy.work_format.on_site',
  },
  {
    id: 'remote',
    label: 'Удалённо',
    translationKey: 'vacancy.work_format.remote',
  },
  {
    id: 'hybrid',
    label: 'Гибрид',
    translationKey: 'vacancy.work_format.hybrid',
  },
  {
    id: 'traveling',
    label: 'Разъездной',
    translationKey: 'vacancy.work_format.traveling',
  },
];

// Графики работы
export const WORK_SCHEDULES: VacancyOption[] = [
  {
    id: '8_to_17',
    label: 'с 8:00 до 17:00',
    translationKey: 'vacancy.work_schedule.8_to_17',
  },
  {
    id: '9_to_18',
    label: 'с 9:00 до 18:00',
    translationKey: 'vacancy.work_schedule.9_to_18',
  },
  {
    id: '8_to_20',
    label: 'с 8:00 до 20:00',
    translationKey: 'vacancy.work_schedule.8_to_20',
  },
  {
    id: 'flexible',
    label: 'Гибкий график',
    translationKey: 'vacancy.work_schedule.flexible',
  },
  {
    id: 'shift',
    label: 'Сменный график',
    translationKey: 'vacancy.work_schedule.shift',
  },
  {
    id: 'other',
    label: 'Другое',
    translationKey: 'vacancy.work_schedule.other',
  },
];

// Периоды оплаты
export const SALARY_PERIODS: VacancyOption[] = [
  {
    id: 'per_month',
    label: 'За месяц',
    translationKey: 'vacancy.salary_period.per_month',
  },
  {
    id: 'per_week',
    label: 'За неделю',
    translationKey: 'vacancy.salary_period.per_week',
  },
  {
    id: 'per_day',
    label: 'За день',
    translationKey: 'vacancy.salary_period.per_day',
  },
  {
    id: 'per_shift',
    label: 'За смену',
    translationKey: 'vacancy.salary_period.per_shift',
  },
  {
    id: 'per_project',
    label: 'За проект',
    translationKey: 'vacancy.salary_period.per_project',
  },
];

// Типы выплат (до/после налогов)
export const SALARY_TYPES: VacancyOption[] = [
  {
    id: 'before_tax',
    label: 'До вычета налогов',
    translationKey: 'vacancy.salary_type.before_tax',
  },
  {
    id: 'after_tax',
    label: 'На руки',
    translationKey: 'vacancy.salary_type.after_tax',
  },
];

// Частота выплат
export const PAYMENT_FREQUENCIES: VacancyOption[] = [
  {
    id: 'daily',
    label: 'Ежедневно',
    translationKey: 'vacancy.payment_frequency.daily',
  },
  {
    id: 'weekly',
    label: 'Раз в неделю',
    translationKey: 'vacancy.payment_frequency.weekly',
  },
  {
    id: 'bi_monthly',
    label: 'Два раза в месяц',
    translationKey: 'vacancy.payment_frequency.bi_monthly',
  },
  {
    id: 'monthly',
    label: 'Раз в месяц',
    translationKey: 'vacancy.payment_frequency.monthly',
  },
  {
    id: 'per_project',
    label: 'За проект',
    translationKey: 'vacancy.payment_frequency.per_project',
  },
];

// Популярные навыки (можно расширить)
export const COMMON_SKILLS: string[] = [
  'Коммуникабельность',
  'Работа в команде',
  'Ответственность',
  'Пунктуальность',
  'Внимательность',
  'Стрессоустойчивость',
  'Обучаемость',
  'Организованность',
  'Аналитическое мышление',
  'Решение проблем',
  'Microsoft Office',
  'Excel',
  'Word',
  'PowerPoint',
  'Google Docs',
  'CRM системы',
  '1C',
  'Английский язык',
  'Русский язык',
  'Узбекский язык',
  'Водительские права',
  'Опыт продаж',
  'Опыт работы с клиентами',
  'Управление проектами',
  'Делопроизводство',
];

// Языки
export const COMMON_LANGUAGES: VacancyOption[] = [
  {
    id: 'uzbek',
    label: 'Узбекский',
    translationKey: 'vacancy.languages.uzbek',
  },
  {
    id: 'russian',
    label: 'Русский',
    translationKey: 'vacancy.languages.russian',
  },
  {
    id: 'english',
    label: 'Английский',
    translationKey: 'vacancy.languages.english',
  },
  {
    id: 'korean',
    label: 'Корейский',
    translationKey: 'vacancy.languages.korean',
  },
  {
    id: 'chinese',
    label: 'Китайский',
    translationKey: 'vacancy.languages.chinese',
  },
  {
    id: 'turkish',
    label: 'Турецкий',
    translationKey: 'vacancy.languages.turkish',
  },
  {
    id: 'arabic',
    label: 'Арабский',
    translationKey: 'vacancy.languages.arabic',
  },
  {
    id: 'german',
    label: 'Немецкий',
    translationKey: 'vacancy.languages.german',
  },
  {
    id: 'french',
    label: 'Французский',
    translationKey: 'vacancy.languages.french',
  },
];

// Хелперы для получения опций по ID
export const getExperienceLevelLabel = (id: string): string => {
  return EXPERIENCE_LEVELS.find(level => level.id === id)?.label || id;
};

export const getEmploymentTypeLabel = (id: string): string => {
  return EMPLOYMENT_TYPES.find(type => type.id === id)?.label || id;
};

export const getWorkFormatLabel = (id: string): string => {
  return WORK_FORMATS.find(format => format.id === id)?.label || id;
};

export const getWorkScheduleLabel = (id: string): string => {
  return WORK_SCHEDULES.find(schedule => schedule.id === id)?.label || id;
};

export const getSalaryPeriodLabel = (id: string): string => {
  return SALARY_PERIODS.find(period => period.id === id)?.label || id;
};

export const getSalaryTypeLabel = (id: string): string => {
  return SALARY_TYPES.find(type => type.id === id)?.label || id;
};

export const getPaymentFrequencyLabel = (id: string): string => {
  return PAYMENT_FREQUENCIES.find(freq => freq.id === id)?.label || id;
};

export const getLanguageLabel = (id: string): string => {
  return COMMON_LANGUAGES.find(lang => lang.id === id)?.label || id;
};

