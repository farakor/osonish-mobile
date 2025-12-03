export * from './navigation';

// User Types
export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string; // ISO date string
  profileImage?: string;
  role: 'customer' | 'worker';
  city?: string;
  preferredLanguage?: 'ru' | 'uz'; // Предпочитаемый язык интерфейса
  isVerified: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Поля для типа пользователя и компании
  userType?: 'individual' | 'company'; // Тип пользователя: физ. или юр. лицо
  companyName?: string; // Название компании (только для юр. лиц)
  // Поля для профессиональных мастеров
  workerType?: 'daily_worker' | 'professional' | 'job_seeker';
  aboutMe?: string;
  specializations?: Specialization[];
  workPhotos?: string[];
  profileViewsCount?: number; // Количество просмотров профиля
  // Поля для ищущих вакансию
  education?: Education[]; // Образование
  skills?: string[]; // Навыки
  workExperience?: WorkExperience[]; // Опыт работы
  willingToRelocate?: boolean; // Готов к переездам
  desiredSalary?: number; // Желаемая зарплата
  // Дополнительные поля для резюме
  gender?: 'male' | 'female'; // Пол
  employmentTypes?: string[]; // Типы занятости (полная, частичная, проектная, стажировка)
  workSchedules?: string[]; // Графики работы (удаленная, гибкий, полный день, сменный)
  willingToTravel?: boolean; // Готовность к командировкам
}

// Education Types
export interface Education {
  institution: string; // Название учебного заведения
  degree?: string; // Степень/специальность
  yearStart?: string; // Год начала
  yearEnd?: string; // Год окончания
}

// Work Experience Types
export interface WorkExperience {
  company: string; // Название компании
  position: string; // Должность
  yearStart?: string; // Год начала
  yearEnd?: string; // Год окончания (или "По настоящее время")
  description?: string; // Описание обязанностей
}

// Specialization Types
export interface Specialization {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
}

export interface LoginRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface RegisterRequest {
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  profileImage?: string;
  role: 'customer' | 'worker';
  city?: string;
  // Поля для типа пользователя и компании
  userType?: 'individual' | 'company';
  companyName?: string;
  // Поля для профессиональных мастеров
  workerType?: 'daily_worker' | 'professional' | 'job_seeker';
  aboutMe?: string;
  specializations?: Specialization[];
  workPhotos?: string[];
  // Поля для ищущих вакансию
  education?: Education[];
  skills?: string[];
  workExperience?: WorkExperience[];
  willingToRelocate?: boolean; // Готов к переездам
  desiredSalary?: number; // Желаемая зарплата
  // Дополнительные поля для резюме
  gender?: 'male' | 'female'; // Пол
  employmentTypes?: string[]; // Типы занятости
  workSchedules?: string[]; // Графики работы
  willingToTravel?: boolean; // Готовность к командировкам
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requiresVerification?: boolean;
  requiresProfileInfo?: boolean;
  phone?: string;
}

// Order Type
export type OrderType = 'daily' | 'vacancy';

// Order Status Type
export type OrderStatus = 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

// Order Types
export interface Order {
  id: string;
  type: OrderType; // Тип работы: daily (дневная работа) или vacancy (вакансия)
  title: string;
  description: string;
  category?: string; // Опциональное поле для обратной совместимости
  specializationId?: string; // ID специализации для профессиональных мастеров
  location: string;
  latitude?: number; // широта для расчета дистанции
  longitude?: number; // долгота для расчета дистанции
  budget: number; // изменил на number для удобства вычислений
  workersNeeded: number;
  serviceDate: string; // ISO date string
  photos?: string[]; // массив URL фотографий
  status: OrderStatus;
  customerId: string;
  customerCity?: string; // Город заказчика
  customerUserType?: 'individual' | 'company'; // Тип заказчика
  customerCompanyName?: string; // Название компании заказчика
  applicantsCount: number;
  pendingApplicantsCount?: number; // Количество непринятых откликов (ожидающих рассмотрения)
  viewsCount?: number; // Количество просмотров заказа
  // Дополнительные удобства
  transportPaid?: boolean; // Проезд оплачивается отдельно
  mealIncluded?: boolean; // Питание включено
  mealPaid?: boolean; // Питание оплачивается
  // Поля для вакансий
  jobTitle?: string; // Название вакансии
  experienceLevel?: string; // Уровень опыта
  employmentType?: string; // Тип занятости
  workFormat?: string; // Формат работы
  workSchedule?: string; // График работы
  city?: string; // Город вакансии
  salaryFrom?: number; // Минимальная зарплата
  salaryTo?: number; // Максимальная зарплата
  salaryPeriod?: string; // Период выплаты
  salaryType?: string; // Тип выплаты (до/после налогов)
  paymentFrequency?: string; // Частота выплат
  skills?: string[]; // Требуемые навыки
  languages?: string[]; // Требуемые языки
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// API Request Types
export interface CreateOrderRequest {
  type: OrderType; // Тип работы
  title: string;
  description: string;
  category?: string; // Опциональное поле для обратной совместимости (по умолчанию 'other')
  location: string;
  latitude?: number; // широта места выполнения заказа
  longitude?: number; // долгота места выполнения заказа
  budget: number;
  workersNeeded: number;
  serviceDate: string;
  photos?: string[];
  // Дополнительные удобства
  transportPaid?: boolean; // Проезд оплачивается отдельно
  mealIncluded?: boolean; // Питание включено
  mealPaid?: boolean; // Питание оплачивается
  specializationId?: string; // ID специализации для профессиональных мастеров
  // Поля для вакансий
  jobTitle?: string;
  experienceLevel?: string;
  employmentType?: string;
  workFormat?: string;
  workSchedule?: string;
  city?: string;
  salaryFrom?: number;
  salaryTo?: number;
  salaryPeriod?: string;
  salaryType?: string;
  paymentFrequency?: string;
  skills?: string[];
  languages?: string[];
}

// API Response Types
export interface CreateOrderResponse {
  success: boolean;
  data?: Order;
  error?: string;
}

// Update Order Types
export interface UpdateOrderRequest {
  orderId: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  workersNeeded?: number;
  photos?: string[];
  // Дополнительные удобства
  transportPaid?: boolean;
  mealIncluded?: boolean;
  mealPaid?: boolean;
  // Примечание: serviceDate намеренно исключена - дату нельзя изменять
}

export interface UpdateOrderResponse {
  success: boolean;
  data?: Order;
  error?: string;
}

// Update Vacancy Types
export interface UpdateVacancyRequest {
  vacancyId: string;
  jobTitle?: string;
  description?: string;
  specializationId?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  experienceLevel?: string;
  employmentType?: string;
  workFormat?: string;
  workSchedule?: string;
  salaryFrom?: number;
  salaryTo?: number;
  salaryPeriod?: string;
  salaryType?: string;
  paymentFrequency?: string;
  skills?: string[];
  languages?: string[];
}

export interface UpdateVacancyResponse {
  success: boolean;
  data?: Order;
  error?: string;
}

// Cancel Order Types
export interface CancelOrderResponse {
  success: boolean;
  error?: string;
}

// Applicant Types
export interface Applicant {
  id: string;
  orderId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  rating: number | null;
  completedJobs: number;
  avatar?: string;
  message?: string;
  proposedPrice: number; // предложенная цена исполнителя
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  isAvailable?: boolean; // доступность исполнителя на дату заказа
}

export interface CreateApplicantRequest {
  orderId: string;
  workerId: string;
  message?: string;
  proposedPrice?: number; // предложенная цена исполнителя
}

// Local Storage Types
export interface OrdersState {
  orders: Order[];
  lastUpdated: string;
}

export interface ApplicantsState {
  applicants: Applicant[];
  lastUpdated: string;
}

// Worker Application Types
export interface WorkerApplication {
  id: string;
  orderId: string;
  orderTitle: string;
  orderCategory: string;
  orderDescription: string;
  orderLocation: string;
  orderLatitude?: number;
  orderLongitude?: number;
  orderBudget: number;
  orderServiceDate: string;
  orderStatus: OrderStatus;
  orderType?: OrderType; // Тип заказа: daily или vacancy
  customerName: string;
  customerPhone: string;
  rating?: number;
  completedJobs?: number;
  message?: string;
  proposedPrice?: number;
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
}

// Vacancy Application Types
export type VacancyApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface VacancyApplication {
  id: string;
  vacancyId: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  applicantAvatar?: string;
  applicantRating?: number;
  applicantCompletedJobs?: number;
  coverLetter?: string;
  status: VacancyApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  // Поля соискателя
  applicantEducation?: Education[];
  applicantSkills?: string[];
  applicantWorkExperience?: WorkExperience[];
  applicantWillingToRelocate?: boolean;
  applicantDesiredSalary?: number;
}

export interface CreateVacancyApplicationRequest {
  vacancyId: string;
  coverLetter?: string;
}

export interface CreateVacancyRequest {
  jobTitle: string;
  description: string;
  specializationId: string;
  location: string;
  latitude?: number;
  longitude?: number;
  city: string;
  experienceLevel: string;
  employmentType: string;
  workFormat: string;
  workSchedule: string;
  salaryFrom?: number;
  salaryTo?: number;
  salaryPeriod: string;
  salaryType: string;
  paymentFrequency: string;
  skills: string[];
  languages: string[];
}

export interface UpdateVacancyApplicationStatusRequest {
  applicationId: string;
  status: VacancyApplicationStatus;
}

// Review Types
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  workerId: string;
  rating: number; // 1-5 звезд
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  orderId: string;
  workerId: string;
  rating: number;
  comment?: string;
}

export interface WorkerRating {
  workerId: string;
  averageRating: number;
  totalReviews: number;
}

export interface Review {
  id: string;
  orderId: string;
  workerId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  orderTitle?: string;
}

export interface WorkerProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  averageRating: number;
  totalReviews: number;
  completedJobs: number;
  joinedAt: string;
  reviews: Review[];
  workerType?: 'daily_worker' | 'professional' | 'job_seeker';
  // Поля для job_seeker
  education?: Education[];
  skills?: string[];
  workExperience?: WorkExperience[];
  specializations?: { id: string; isPrimary: boolean }[];
  // Дополнительные поля для резюме
  gender?: 'male' | 'female';
  employmentTypes?: string[];
  workSchedules?: string[];
  willingToTravel?: boolean;
  desiredSalary?: number;
  willingToRelocate?: boolean;
  city?: string;
  birthDate?: string;
  aboutMe?: string;
}

// City Types
export interface City {
  id: string;
  name: string;
  isAvailable: boolean;
}

export interface CitySelectionData {
  selectedCity: City;
}