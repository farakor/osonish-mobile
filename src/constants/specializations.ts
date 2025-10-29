import React from 'react';
import FaucetIcon from '../../assets/cats/faucet.svg';
import ManagementIcon from '../../assets/cats/management.svg';
import ElectricPowerIcon from '../../assets/cats/electric-power.svg';
import PaintRollerIcon from '../../assets/cats/paint-roller.svg';
import GasKotelIcon from '../../assets/cats/gas-kotel.svg';
import GasStoveIcon from '../../assets/cats/gas-stove.svg';
import SawIcon from '../../assets/cats/saw.svg';
import GardeningIcon from '../../assets/cats/gardening.svg';
import AirConditionerIcon from '../../assets/cats/air-conditioner.svg';
import LaundryIcon from '../../assets/cats/laundry.svg';
import RenovationIcon from '../../assets/cats/renovation.svg';
import PadlockIcon from '../../assets/cats/padlock.svg';
import SmartRefrigeratorIcon from '../../assets/cats/smart-refrigirator.svg';
import DoorIcon from '../../assets/cats/door.svg';
import WindowIcon from '../../assets/cats/window.svg';
import ConstructionIcon from '../../assets/cats/construction.svg';
import BedIcon from '../../assets/cats/bed.svg';
import WelderIcon from '../../assets/cats/welder.svg';
import RooftileIcon from '../../assets/cats/rooftile.svg';
import TileIcon from '../../assets/cats/tile.svg';
import CalendarOneDayIcon from '../../assets/cats/calendar-one-day.svg';

export interface SpecializationOption {
  id: string;
  name: string;
  icon: string; // emoji иконка (используется если нет iconComponent)
  iconComponent?: React.ComponentType<any>; // SVG компонент (приоритет над emoji)
  parentId?: string; // ID родительской категории (если это подкатегория)
  isParent?: boolean; // Является ли это родительской категорией
}

export const PARENT_CATEGORIES: SpecializationOption[] = [
  {
    id: 'repair_construction',
    name: 'Ремонт и строительство',
    icon: '🏗️',
    iconComponent: ConstructionIcon,
    isParent: true,
  },
  {
    id: 'auto_business',
    name: 'Автомобильный бизнес',
    icon: '🚗',
    isParent: true,
  },
  {
    id: 'administrative_staff',
    name: 'Административный персонал',
    icon: '📋',
    isParent: true,
  },
  {
    id: 'security',
    name: 'Безопасность',
    icon: '🛡️',
    isParent: true,
  },
  {
    id: 'senior_management',
    name: 'Высший и средний менеджмент',
    icon: '👔',
    isParent: true,
  },
  {
    id: 'raw_materials_extraction',
    name: 'Добыча сырья',
    icon: '⛏️',
    isParent: true,
  },
  {
    id: 'household_service_staff',
    name: 'Домашний, обслуживающий персонал',
    icon: '🏠',
    isParent: true,
  },
  {
    id: 'procurement',
    name: 'Закупки',
    icon: '📦',
    isParent: true,
  },
  {
    id: 'information_technology',
    name: 'Информационные технологии',
    icon: '💻',
    isParent: true,
  },
  {
    id: 'arts_entertainment_media',
    name: 'Искусство, развлечения, массмедиа',
    icon: '🎭',
    isParent: true,
  },
  {
    id: 'marketing_advertising_pr',
    name: 'Маркетинг, реклама, PR',
    icon: '📢',
    isParent: true,
  },
  {
    id: 'medicine_pharma',
    name: 'Медицина, фармацевтика',
    icon: '⚕️',
    isParent: true,
  },
  {
    id: 'science_education',
    name: 'Наука, образование',
    icon: '📚',
    isParent: true,
  },
  {
    id: 'sales_customer_service',
    name: 'Продажи, обслуживание клиентов',
    icon: '💼',
    isParent: true,
  },
  {
    id: 'production_service',
    name: 'Производство, сервисное обслуживание',
    icon: '⚙️',
    isParent: true,
  },
  {
    id: 'working_personnel',
    name: 'Рабочий персонал',
    icon: '🔧',
    isParent: true,
  },
  {
    id: 'retail',
    name: 'Розничная торговля',
    icon: '🛍️',
    isParent: true,
  },
  {
    id: 'agriculture',
    name: 'Сельское хозяйство',
    icon: '🌾',
    isParent: true,
  },
  {
    id: 'sports_fitness_beauty',
    name: 'Спортивные клубы, фитнес, салоны красоты',
    icon: '💪',
    isParent: true,
  },
  {
    id: 'strategy_investment_consulting',
    name: 'Стратегия, инвестиции, консалтинг',
    icon: '📈',
    isParent: true,
  },
  {
    id: 'insurance',
    name: 'Страхование',
    icon: '🛡️',
    isParent: true,
  },
  {
    id: 'transport_logistics',
    name: 'Транспорт, логистика, перевозки',
    icon: '🚚',
    isParent: true,
  },
  {
    id: 'tourism_hotels_restaurants',
    name: 'Туризм, гостиницы, рестораны',
    icon: '🏨',
    isParent: true,
  },
  {
    id: 'hr_training',
    name: 'Управление персоналом, тренинги',
    icon: '👥',
    isParent: true,
  },
  {
    id: 'finance_accounting',
    name: 'Финансы, бухгалтерия',
    icon: '💰',
    isParent: true,
  },
  {
    id: 'legal',
    name: 'Юристы',
    icon: '⚖️',
    isParent: true,
  },
  {
    id: 'other',
    name: 'Другое',
    icon: '📋',
    isParent: true,
  },
];

export const SPECIALIZATIONS: SpecializationOption[] = [
  {
    id: 'one_day_job',
    name: 'Работа на 1 день',
    icon: '📅',
    iconComponent: CalendarOneDayIcon,
  },
  {
    id: 'brigades',
    name: 'Бригады',
    icon: '👷',
    iconComponent: ManagementIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'plumber',
    name: 'Сантехники',
    icon: '🔧',
    iconComponent: FaucetIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'electrician',
    name: 'Электрики',
    icon: '⚡',
    iconComponent: ElectricPowerIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'painter',
    name: 'Маляр-Штукатур',
    icon: '🎨',
    iconComponent: PaintRollerIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'boiler_installation',
    name: 'Установка котлов',
    icon: '🔥',
    iconComponent: GasKotelIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'gas_electric_stoves',
    name: 'Газовые и электроплиты',
    icon: '🍳',
    iconComponent: GasStoveIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'carpenter',
    name: 'Плотники',
    icon: '🪚',
    iconComponent: SawIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'gardener',
    name: 'Садовник',
    icon: '🌱',
    iconComponent: GardeningIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'air_conditioner',
    name: 'Кондиционеры',
    icon: '❄️',
    iconComponent: AirConditionerIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'washing_machine',
    name: 'Стиральные машины',
    icon: '🧺',
    iconComponent: LaundryIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'turnkey_renovation',
    name: 'Ремонт под ключ',
    icon: '🏠',
    iconComponent: RenovationIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'lock_repair',
    name: 'Ремонт замков',
    icon: '🔐',
    iconComponent: PadlockIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'refrigerator',
    name: 'Холодильники',
    icon: '🧊',
    iconComponent: SmartRefrigeratorIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'doors',
    name: 'Двери',
    icon: '🚪',
    iconComponent: DoorIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'plastic_windows',
    name: 'Пластиковые окна',
    icon: '🪟',
    iconComponent: WindowIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'bricklaying',
    name: 'Кладка кирпича',
    icon: '🧱',
    iconComponent: ConstructionIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'custom_furniture',
    name: 'Мебель на заказ',
    icon: '🪑',
    iconComponent: BedIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'welder',
    name: 'Сварщики',
    icon: '🔨',
    iconComponent: WelderIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'roofer',
    name: 'Кровельщики',
    icon: '🏗️',
    iconComponent: RooftileIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'tiler',
    name: 'Плиточники',
    icon: '🟦',
    iconComponent: TileIcon,
    parentId: 'repair_construction',
  },
  {
    id: 'car_washer',
    name: 'Автомойщик',
    icon: '🚿',
    parentId: 'auto_business',
  },
  {
    id: 'auto_mechanic',
    name: 'Автослесарь, автомеханик',
    icon: '🔧',
    parentId: 'auto_business',
  },
  {
    id: 'service_advisor',
    name: 'Мастер-приемщик',
    icon: '📋',
    parentId: 'auto_business',
  },
  {
    id: 'sales_manager',
    name: 'Менеджер по продажам, менеджер по работе с клиентами',
    icon: '💼',
    parentId: 'auto_business',
  },
  {
    id: 'administrator',
    name: 'Администратор',
    icon: '👔',
    parentId: 'administrative_staff',
  },
  {
    id: 'records_clerk',
    name: 'Делопроизводитель, архивариус',
    icon: '📁',
    parentId: 'administrative_staff',
  },
  {
    id: 'courier',
    name: 'Курьер',
    icon: '📦',
    parentId: 'administrative_staff',
  },
  {
    id: 'facility_manager',
    name: 'Менеджер/руководитель АХО',
    icon: '🏢',
    parentId: 'administrative_staff',
  },
  {
    id: 'data_operator',
    name: 'Оператор ПК, оператор базы данных',
    icon: '💻',
    parentId: 'administrative_staff',
  },
  {
    id: 'office_manager',
    name: 'Офис-менеджер',
    icon: '🗂️',
    parentId: 'administrative_staff',
  },
  {
    id: 'translator',
    name: 'Переводчик',
    icon: '🌐',
    parentId: 'administrative_staff',
  },
  {
    id: 'secretary',
    name: 'Секретарь, помощник руководителя, ассистент',
    icon: '📝',
    parentId: 'administrative_staff',
  },
  {
    id: 'security_guard',
    name: 'Охранник',
    icon: '🛡️',
    parentId: 'security',
  },
  {
    id: 'it_security_specialist',
    name: 'Специалист по информационной безопасности',
    icon: '🔒',
    parentId: 'security',
  },
  {
    id: 'security_service_specialist',
    name: 'Специалист службы безопасности',
    icon: '👮',
    parentId: 'security',
  },
  {
    id: 'ceo',
    name: 'Генеральный директор, исполнительный директор (CEO)',
    icon: '🎯',
    parentId: 'senior_management',
  },
  {
    id: 'cio',
    name: 'Директор по информационным технологиям (CIO)',
    icon: '💻',
    parentId: 'senior_management',
  },
  {
    id: 'cmo',
    name: 'Директор по маркетингу и PR (CMO)',
    icon: '📢',
    parentId: 'senior_management',
  },
  {
    id: 'hrd',
    name: 'Директор по персоналу (HRD)',
    icon: '👥',
    parentId: 'senior_management',
  },
  {
    id: 'clo',
    name: 'Директор юридического департамента (CLO)',
    icon: '⚖️',
    parentId: 'senior_management',
  },
  {
    id: 'cco',
    name: 'Коммерческий директор (CCO)',
    icon: '💰',
    parentId: 'senior_management',
  },
  {
    id: 'production_manager',
    name: 'Начальник производства',
    icon: '🏭',
    parentId: 'senior_management',
  },
  {
    id: 'coo',
    name: 'Операционный директор (COO)',
    icon: '⚙️',
    parentId: 'senior_management',
  },
  {
    id: 'analytics_head',
    name: 'Руководитель отдела аналитики',
    icon: '📊',
    parentId: 'senior_management',
  },
  {
    id: 'logistics_head',
    name: 'Руководитель отдела логистики',
    icon: '🚚',
    parentId: 'senior_management',
  },
  {
    id: 'marketing_head',
    name: 'Руководитель отдела маркетинга и рекламы',
    icon: '📈',
    parentId: 'senior_management',
  },
  {
    id: 'hr_head',
    name: 'Руководитель отдела персонала',
    icon: '👔',
    parentId: 'senior_management',
  },
  {
    id: 'branch_manager',
    name: 'Руководитель филиала',
    icon: '🏢',
    parentId: 'senior_management',
  },
  {
    id: 'cto',
    name: 'Технический директор (CTO)',
    icon: '🔧',
    parentId: 'senior_management',
  },
  {
    id: 'cfo',
    name: 'Финансовый директор (CFO)',
    icon: '💵',
    parentId: 'senior_management',
  },
  {
    id: 'geodesist',
    name: 'Геодезист',
    icon: '🗺️',
    parentId: 'raw_materials_extraction',
  },
  {
    id: 'geologist',
    name: 'Геолог',
    icon: '🪨',
    parentId: 'raw_materials_extraction',
  },
  {
    id: 'laboratory_assistant',
    name: 'Лаборант',
    icon: '🧪',
    parentId: 'raw_materials_extraction',
  },
  {
    id: 'machinist',
    name: 'Машинист',
    icon: '🚜',
    parentId: 'raw_materials_extraction',
  },
  {
    id: 'research_specialist',
    name: 'Научный специалист, исследователь',
    icon: '🔬',
    parentId: 'raw_materials_extraction',
  },
  {
    id: 'shift_supervisor',
    name: 'Начальник смены, мастер участка',
    icon: '👷',
    parentId: 'raw_materials_extraction',
  },
  {
    id: 'technologist',
    name: 'Технолог',
    icon: '⚗️',
    parentId: 'raw_materials_extraction',
  },
  {
    id: 'household_administrator',
    name: 'Администратор',
    icon: '👨‍💼',
    parentId: 'household_service_staff',
  },
  {
    id: 'driver',
    name: 'Водитель',
    icon: '🚗',
    parentId: 'household_service_staff',
  },
  {
    id: 'nanny',
    name: 'Воспитатель, няня',
    icon: '👶',
    parentId: 'household_service_staff',
  },
  {
    id: 'janitor',
    name: 'Дворник',
    icon: '🧹',
    parentId: 'household_service_staff',
  },
  {
    id: 'household_courier',
    name: 'Курьер',
    icon: '📦',
    parentId: 'household_service_staff',
  },
  {
    id: 'waiter',
    name: 'Официант, бармен, бариста',
    icon: '☕',
    parentId: 'household_service_staff',
  },
  {
    id: 'household_security',
    name: 'Охранник',
    icon: '🛡️',
    parentId: 'household_service_staff',
  },
  {
    id: 'cleaner',
    name: 'Уборщица, уборщик',
    icon: '🧽',
    parentId: 'household_service_staff',
  },
  {
    id: 'procurement_manager',
    name: 'Менеджер по закупкам',
    icon: '🛒',
    parentId: 'procurement',
  },
  {
    id: 'tender_specialist',
    name: 'Специалист по тендерам',
    icon: '📋',
    parentId: 'procurement',
  },
  {
    id: 'bi_analyst',
    name: 'BI-аналитик, аналитик данных',
    icon: '📊',
    parentId: 'information_technology',
  },
  {
    id: 'devops_engineer',
    name: 'DevOps-инженер',
    icon: '🔧',
    parentId: 'information_technology',
  },
  {
    id: 'it_analyst',
    name: 'Аналитик',
    icon: '📈',
    parentId: 'information_technology',
  },
  {
    id: 'art_director',
    name: 'Арт-директор, креативный директор',
    icon: '🎨',
    parentId: 'information_technology',
  },
  {
    id: 'business_analyst',
    name: 'Бизнес-аналитик',
    icon: '💼',
    parentId: 'information_technology',
  },
  {
    id: 'game_designer',
    name: 'Гейм-дизайнер',
    icon: '🎮',
    parentId: 'information_technology',
  },
  {
    id: 'data_scientist',
    name: 'Дата-сайентист',
    icon: '🔬',
    parentId: 'information_technology',
  },
  {
    id: 'designer',
    name: 'Дизайнер, художник',
    icon: '🖌️',
    parentId: 'information_technology',
  },
  {
    id: 'it_cio',
    name: 'Директор по информационным технологиям (CIO)',
    icon: '💻',
    parentId: 'information_technology',
  },
  {
    id: 'product_manager',
    name: 'Менеджер продукта',
    icon: '📱',
    parentId: 'information_technology',
  },
  {
    id: 'methodologist',
    name: 'Методолог',
    icon: '📚',
    parentId: 'information_technology',
  },
  {
    id: 'software_developer',
    name: 'Программист, разработчик',
    icon: '👨‍💻',
    parentId: 'information_technology',
  },
  {
    id: 'product_analyst',
    name: 'Продуктовый аналитик',
    icon: '📊',
    parentId: 'information_technology',
  },
  {
    id: 'dev_team_lead',
    name: 'Руководитель группы разработки',
    icon: '👥',
    parentId: 'information_technology',
  },
  {
    id: 'it_analytics_head',
    name: 'Руководитель отдела аналитики',
    icon: '📊',
    parentId: 'information_technology',
  },
  {
    id: 'project_manager',
    name: 'Руководитель проектов',
    icon: '📋',
    parentId: 'information_technology',
  },
  {
    id: 'network_engineer',
    name: 'Сетевой инженер',
    icon: '🌐',
    parentId: 'information_technology',
  },
  {
    id: 'system_administrator',
    name: 'Системный администратор',
    icon: '🖥️',
    parentId: 'information_technology',
  },
  {
    id: 'system_analyst',
    name: 'Системный аналитик',
    icon: '🔍',
    parentId: 'information_technology',
  },
  {
    id: 'system_engineer',
    name: 'Системный инженер',
    icon: '⚙️',
    parentId: 'information_technology',
  },
  {
    id: 'it_security_specialist',
    name: 'Специалист по информационной безопасности',
    icon: '🔒',
    parentId: 'information_technology',
  },
  {
    id: 'tech_support',
    name: 'Специалист технической поддержки',
    icon: '🛠️',
    parentId: 'information_technology',
  },
  {
    id: 'qa_tester',
    name: 'Тестировщик',
    icon: '🧪',
    parentId: 'information_technology',
  },
  {
    id: 'it_cto',
    name: 'Технический директор (CTO)',
    icon: '🔧',
    parentId: 'information_technology',
  },
  {
    id: 'technical_writer',
    name: 'Технический писатель',
    icon: '📝',
    parentId: 'information_technology',
  },
  {
    id: 'arts_art_director',
    name: 'Арт-директор, креативный директор',
    icon: '🎨',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'artist_actor',
    name: 'Артист, актер, аниматор',
    icon: '🎭',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'videographer',
    name: 'Видеооператор, видеомонтажер',
    icon: '🎬',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'arts_game_designer',
    name: 'Гейм-дизайнер',
    icon: '🎮',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'arts_designer',
    name: 'Дизайнер, художник',
    icon: '🖌️',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'journalist',
    name: 'Журналист, корреспондент',
    icon: '📰',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'copywriter',
    name: 'Копирайтер, редактор, корректор',
    icon: '✍️',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'producer',
    name: 'Продюсер',
    icon: '🎥',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'director',
    name: 'Режиссер, сценарист',
    icon: '🎬',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'photographer',
    name: 'Фотограф, ретушер',
    icon: '📷',
    parentId: 'arts_entertainment_media',
  },
  {
    id: 'event_manager',
    name: 'Event-менеджер',
    icon: '🎉',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'pr_manager',
    name: 'PR-менеджер',
    icon: '📣',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'smm_manager',
    name: 'SMM-менеджер, контент-менеджер',
    icon: '📱',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_analyst',
    name: 'Аналитик',
    icon: '📊',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_art_director',
    name: 'Арт-директор, креативный директор',
    icon: '🎨',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_designer',
    name: 'Дизайнер, художник',
    icon: '🖌️',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_cmo',
    name: 'Директор по маркетингу и PR (CMO)',
    icon: '📢',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_copywriter',
    name: 'Копирайтер, редактор, корректор',
    icon: '✍️',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_analytics_specialist',
    name: 'Маркетолог-аналитик',
    icon: '📈',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_manager',
    name: 'Менеджер по маркетингу, интернет-маркетолог',
    icon: '💼',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_sales_manager',
    name: 'Менеджер по продажам, менеджер по работе с клиентами',
    icon: '🤝',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'partner_manager',
    name: 'Менеджер по работе с партнерами',
    icon: '🤝',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'promoter',
    name: 'Промоутер',
    icon: '📢',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'marketing_department_head',
    name: 'Руководитель отдела маркетинга и рекламы',
    icon: '👔',
    parentId: 'marketing_advertising_pr',
  },
  {
    id: 'medical_administrator',
    name: 'Администратор',
    icon: '📋',
    parentId: 'medicine_pharma',
  },
  {
    id: 'medical_assistant',
    name: 'Ассистент врача',
    icon: '👨‍⚕️',
    parentId: 'medicine_pharma',
  },
  {
    id: 'veterinarian',
    name: 'Ветеринарный врач',
    icon: '🐾',
    parentId: 'medicine_pharma',
  },
  {
    id: 'doctor',
    name: 'Врач',
    icon: '👨‍⚕️',
    parentId: 'medicine_pharma',
  },
  {
    id: 'chief_doctor',
    name: 'Главный врач, заведующий отделением',
    icon: '🩺',
    parentId: 'medicine_pharma',
  },
  {
    id: 'pharmacy_manager',
    name: 'Заведующий аптекой',
    icon: '💊',
    parentId: 'medicine_pharma',
  },
  {
    id: 'medical_laboratory_assistant',
    name: 'Лаборант',
    icon: '🧪',
    parentId: 'medicine_pharma',
  },
  {
    id: 'nurse',
    name: 'Медицинская сестра, медицинский брат',
    icon: '👩‍⚕️',
    parentId: 'medicine_pharma',
  },
  {
    id: 'medical_rep',
    name: 'Медицинский представитель',
    icon: '💼',
    parentId: 'medicine_pharma',
  },
  {
    id: 'medical_researcher',
    name: 'Научный специалист, исследователь',
    icon: '🔬',
    parentId: 'medicine_pharma',
  },
  {
    id: 'certification_specialist',
    name: 'Специалист по сертификации',
    icon: '📜',
    parentId: 'medicine_pharma',
  },
  {
    id: 'pharmacist',
    name: 'Фармацевт-провизор',
    icon: '💊',
    parentId: 'medicine_pharma',
  },
  {
    id: 'business_trainer',
    name: 'Бизнес-тренер',
    icon: '📊',
    parentId: 'science_education',
  },
  {
    id: 'educator_nanny',
    name: 'Воспитатель, няня',
    icon: '👶',
    parentId: 'science_education',
  },
  {
    id: 'science_laboratory_assistant',
    name: 'Лаборант',
    icon: '🧪',
    parentId: 'science_education',
  },
  {
    id: 'education_methodologist',
    name: 'Методист',
    icon: '📝',
    parentId: 'science_education',
  },
  {
    id: 'science_researcher',
    name: 'Научный специалист, исследователь',
    icon: '🔬',
    parentId: 'science_education',
  },
  {
    id: 'psychologist',
    name: 'Психолог',
    icon: '🧠',
    parentId: 'science_education',
  },
  {
    id: 'teacher',
    name: 'Учитель, преподаватель, педагог',
    icon: '👨‍🏫',
    parentId: 'science_education',
  },
  {
    id: 'real_estate_agent',
    name: 'Агент по недвижимости',
    icon: '🏢',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_analyst',
    name: 'Аналитик',
    icon: '📊',
    parentId: 'sales_customer_service',
  },
  {
    id: 'broker',
    name: 'Брокер',
    icon: '💹',
    parentId: 'sales_customer_service',
  },
  {
    id: 'cashier',
    name: 'Кассир-операционист',
    icon: '💵',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_cco',
    name: 'Коммерческий директор (CCO)',
    icon: '👔',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_coordinator',
    name: 'Координатор отдела продаж',
    icon: '📋',
    parentId: 'sales_customer_service',
  },
  {
    id: 'credit_specialist',
    name: 'Кредитный специалист',
    icon: '💳',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_client_manager',
    name: 'Менеджер по продажам, менеджер по работе с клиентами',
    icon: '🤝',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_partner_manager',
    name: 'Менеджер по работе с партнерами',
    icon: '🤝',
    parentId: 'sales_customer_service',
  },
  {
    id: 'call_center_operator',
    name: 'Оператор call-центра, специалист контактного центра',
    icon: '📞',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_consultant',
    name: 'Продавец-консультант, продавец-кассир',
    icon: '🛒',
    parentId: 'sales_customer_service',
  },
  {
    id: 'customer_service_head',
    name: 'Руководитель отдела клиентского обслуживания',
    icon: '👔',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_head',
    name: 'Руководитель отдела продаж',
    icon: '👔',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_branch_manager',
    name: 'Руководитель филиала',
    icon: '🏢',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_certification_specialist',
    name: 'Специалист по сертификации',
    icon: '📜',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_tech_support',
    name: 'Специалист технической поддержки',
    icon: '🛠️',
    parentId: 'sales_customer_service',
  },
  {
    id: 'insurance_agent',
    name: 'Страховой агент',
    icon: '🛡️',
    parentId: 'sales_customer_service',
  },
  {
    id: 'sales_representative',
    name: 'Торговый представитель',
    icon: '💼',
    parentId: 'sales_customer_service',
  },
  {
    id: 'commissioning_engineer',
    name: 'Инженер ПНР',
    icon: '🔧',
    parentId: 'production_service',
  },
  {
    id: 'quality_engineer',
    name: 'Инженер по качеству',
    icon: '✅',
    parentId: 'production_service',
  },
  {
    id: 'safety_engineer',
    name: 'Инженер по охране труда и технике безопасности, инженер-эколог',
    icon: '🛡️',
    parentId: 'production_service',
  },
  {
    id: 'operation_engineer',
    name: 'Инженер по эксплуатации',
    icon: '⚙️',
    parentId: 'production_service',
  },
  {
    id: 'design_engineer',
    name: 'Инженер-конструктор, инженер-проектировщик',
    icon: '📐',
    parentId: 'production_service',
  },
  {
    id: 'electronic_engineer',
    name: 'Инженер-электроник, инженер-электронщик',
    icon: '🔌',
    parentId: 'production_service',
  },
  {
    id: 'electrical_engineer',
    name: 'Инженер-энергетик, инженер-электрик',
    icon: '⚡',
    parentId: 'production_service',
  },
  {
    id: 'quality_controller',
    name: 'Контролёр ОТК',
    icon: '🔍',
    parentId: 'production_service',
  },
  {
    id: 'production_laboratory_assistant',
    name: 'Лаборант',
    icon: '🧪',
    parentId: 'production_service',
  },
  {
    id: 'equipment_repair_master',
    name: 'Мастер по ремонту оборудования, техники',
    icon: '🔧',
    parentId: 'production_service',
  },
  {
    id: 'production_machinist',
    name: 'Машинист',
    icon: '🚂',
    parentId: 'production_service',
  },
  {
    id: 'metrologist',
    name: 'Метролог',
    icon: '📏',
    parentId: 'production_service',
  },
  {
    id: 'production_mechanic',
    name: 'Механик',
    icon: '🔧',
    parentId: 'production_service',
  },
  {
    id: 'production_researcher',
    name: 'Научный специалист, исследователь',
    icon: '🔬',
    parentId: 'production_service',
  },
  {
    id: 'production_chief',
    name: 'Начальник производства',
    icon: '👔',
    parentId: 'production_service',
  },
  {
    id: 'production_shift_supervisor',
    name: 'Начальник смены, мастер участка',
    icon: '👷',
    parentId: 'production_service',
  },
  {
    id: 'production_line_operator',
    name: 'Оператор производственной линии',
    icon: '🏭',
    parentId: 'production_service',
  },
  {
    id: 'cnc_operator',
    name: 'Оператор станков с ЧПУ',
    icon: '🖥️',
    parentId: 'production_service',
  },
  {
    id: 'production_welder',
    name: 'Сварщик',
    icon: '🔥',
    parentId: 'production_service',
  },
  {
    id: 'service_engineer',
    name: 'Сервисный инженер, инженер-механик',
    icon: '🔧',
    parentId: 'production_service',
  },
  {
    id: 'production_locksmith',
    name: 'Слесарь, сантехник',
    icon: '🔧',
    parentId: 'production_service',
  },
  {
    id: 'production_certification_specialist',
    name: 'Специалист по сертификации',
    icon: '📜',
    parentId: 'production_service',
  },
  {
    id: 'production_technologist',
    name: 'Технолог',
    icon: '⚗️',
    parentId: 'production_service',
  },
  {
    id: 'turner_milling_machine_operator',
    name: 'Токарь, фрезеровщик, шлифовщик',
    icon: '⚙️',
    parentId: 'production_service',
  },
  {
    id: 'seamstress',
    name: 'Швея, портной, закройщик',
    icon: '🧵',
    parentId: 'production_service',
  },
  {
    id: 'production_electrician',
    name: 'Электромонтажник',
    icon: '⚡',
    parentId: 'production_service',
  },
  {
    id: 'worker_auto_mechanic',
    name: 'Автослесарь, автомеханик',
    icon: '🚗',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_driver',
    name: 'Водитель',
    icon: '🚗',
    parentId: 'working_personnel',
  },
  {
    id: 'loader',
    name: 'Грузчик',
    icon: '📦',
    parentId: 'working_personnel',
  },
  {
    id: 'storekeeper',
    name: 'Кладовщик',
    icon: '📦',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_painter',
    name: 'Маляр, штукатур',
    icon: '🎨',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_machinist',
    name: 'Машинист',
    icon: '🚂',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_mechanic',
    name: 'Механик',
    icon: '🔧',
    parentId: 'working_personnel',
  },
  {
    id: 'assembler',
    name: 'Монтажник',
    icon: '🔧',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_production_line_operator',
    name: 'Оператор производственной линии',
    icon: '🏭',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_cnc_operator',
    name: 'Оператор станков с ЧПУ',
    icon: '🖥️',
    parentId: 'working_personnel',
  },
  {
    id: 'general_worker',
    name: 'Разнорабочий',
    icon: '👷',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_welder',
    name: 'Сварщик',
    icon: '🔥',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_service_engineer',
    name: 'Сервисный инженер, инженер-механик',
    icon: '🔧',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_locksmith',
    name: 'Слесарь, сантехник',
    icon: '🔧',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_turner',
    name: 'Токарь, фрезеровщик, шлифовщик',
    icon: '⚙️',
    parentId: 'working_personnel',
  },
  {
    id: 'packer',
    name: 'Упаковщик, комплектовщик',
    icon: '📦',
    parentId: 'working_personnel',
  },
  {
    id: 'worker_electrician',
    name: 'Электромонтажник',
    icon: '⚡',
    parentId: 'working_personnel',
  },
  {
    id: 'store_administrator',
    name: 'Администратор магазина, администратор торгового зала',
    icon: '🏪',
    parentId: 'retail',
  },
  {
    id: 'store_director',
    name: 'Директор магазина, директор сети магазинов',
    icon: '👔',
    parentId: 'retail',
  },
  {
    id: 'merchandiser',
    name: 'Мерчандайзер',
    icon: '📊',
    parentId: 'retail',
  },
  {
    id: 'retail_sales_consultant',
    name: 'Продавец-консультант, продавец-кассир',
    icon: '🛒',
    parentId: 'retail',
  },
  {
    id: 'retail_promoter',
    name: 'Промоутер',
    icon: '📢',
    parentId: 'retail',
  },
  {
    id: 'supervisor',
    name: 'Супервайзер',
    icon: '👁️',
    parentId: 'retail',
  },
  {
    id: 'merchandising_specialist',
    name: 'Товаровед',
    icon: '📋',
    parentId: 'retail',
  },
  {
    id: 'agronomist',
    name: 'Агроном',
    icon: '🌱',
    parentId: 'agriculture',
  },
  {
    id: 'agriculture_veterinarian',
    name: 'Ветеринарный врач',
    icon: '🐾',
    parentId: 'agriculture',
  },
  {
    id: 'zootechnician',
    name: 'Зоотехник',
    icon: '🐄',
    parentId: 'agriculture',
  },
  {
    id: 'agriculture_machinist',
    name: 'Машинист',
    icon: '🚜',
    parentId: 'agriculture',
  },
  {
    id: 'agriculture_service_engineer',
    name: 'Сервисный инженер, инженер-механик',
    icon: '🔧',
    parentId: 'agriculture',
  },
  {
    id: 'agriculture_technologist',
    name: 'Технолог',
    icon: '⚗️',
    parentId: 'agriculture',
  },
  {
    id: 'sports_administrator',
    name: 'Администратор',
    icon: '📋',
    parentId: 'sports_fitness_beauty',
  },
  {
    id: 'cosmetologist',
    name: 'Косметолог',
    icon: '💆',
    parentId: 'sports_fitness_beauty',
  },
  {
    id: 'massage_therapist',
    name: 'Массажист',
    icon: '💆',
    parentId: 'sports_fitness_beauty',
  },
  {
    id: 'nail_technician',
    name: 'Мастер ногтевого сервиса',
    icon: '💅',
    parentId: 'sports_fitness_beauty',
  },
  {
    id: 'sports_sales_manager',
    name: 'Менеджер по продажам, менеджер по работе с клиентами',
    icon: '🤝',
    parentId: 'sports_fitness_beauty',
  },
  {
    id: 'hairdresser',
    name: 'Парикмахер',
    icon: '💇',
    parentId: 'sports_fitness_beauty',
  },
  {
    id: 'fitness_trainer',
    name: 'Фитнес-тренер, инструктор тренажерного зала',
    icon: '🏋️',
    parentId: 'sports_fitness_beauty',
  },
  {
    id: 'strategy_analyst',
    name: 'Аналитик',
    icon: '📊',
    parentId: 'strategy_investment_consulting',
  },
  {
    id: 'strategy_business_analyst',
    name: 'Бизнес-аналитик',
    icon: '📈',
    parentId: 'strategy_investment_consulting',
  },
  {
    id: 'strategy_consultant',
    name: 'Менеджер/консультант по стратегии',
    icon: '💼',
    parentId: 'strategy_investment_consulting',
  },
  {
    id: 'strategy_project_manager',
    name: 'Руководитель проектов',
    icon: '📋',
    parentId: 'strategy_investment_consulting',
  },
  {
    id: 'financial_analyst',
    name: 'Финансовый аналитик, инвестиционный аналитик',
    icon: '💹',
    parentId: 'strategy_investment_consulting',
  },
  {
    id: 'underwriter',
    name: 'Андеррайтер',
    icon: '📝',
    parentId: 'insurance',
  },
  {
    id: 'appraiser',
    name: 'Оценщик',
    icon: '📊',
    parentId: 'insurance',
  },
  {
    id: 'insurance_insurance_agent',
    name: 'Страховой агент',
    icon: '🛡️',
    parentId: 'insurance',
  },
  {
    id: 'flight_attendant',
    name: 'Бортпроводник',
    icon: '✈️',
    parentId: 'transport_logistics',
  },
  {
    id: 'transport_driver',
    name: 'Водитель',
    icon: '🚗',
    parentId: 'transport_logistics',
  },
  {
    id: 'transport_loader',
    name: 'Грузчик',
    icon: '📦',
    parentId: 'transport_logistics',
  },
  {
    id: 'dispatcher',
    name: 'Диспетчер',
    icon: '📞',
    parentId: 'transport_logistics',
  },
  {
    id: 'transport_storekeeper',
    name: 'Кладовщик',
    icon: '📦',
    parentId: 'transport_logistics',
  },
  {
    id: 'transport_courier',
    name: 'Курьер',
    icon: '🚴',
    parentId: 'transport_logistics',
  },
  {
    id: 'transport_machinist',
    name: 'Машинист',
    icon: '🚂',
    parentId: 'transport_logistics',
  },
  {
    id: 'logistics_manager',
    name: 'Менеджер по логистике, менеджер по ВЭД',
    icon: '📋',
    parentId: 'transport_logistics',
  },
  {
    id: 'warehouse_manager',
    name: 'Начальник склада',
    icon: '🏢',
    parentId: 'transport_logistics',
  },
  {
    id: 'logistics_head',
    name: 'Руководитель отдела логистики',
    icon: '👔',
    parentId: 'transport_logistics',
  },
  {
    id: 'transport_packer',
    name: 'Упаковщик, комплектовщик',
    icon: '📦',
    parentId: 'transport_logistics',
  },
  {
    id: 'tourism_administrator',
    name: 'Администратор',
    icon: '📋',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'tourism_manager',
    name: 'Менеджер по туризму',
    icon: '🗺️',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'restaurant_manager',
    name: 'Менеджер ресторана',
    icon: '🍽️',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'tourism_facility_manager',
    name: 'Менеджер/руководитель АХО',
    icon: '🏢',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'tourism_waiter',
    name: 'Официант, бармен, бариста',
    icon: '☕',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'chef',
    name: 'Повар, пекарь, кондитер',
    icon: '👨‍🍳',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'tourism_cleaner',
    name: 'Уборщица, уборщик',
    icon: '🧹',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'hostess',
    name: 'Хостес',
    icon: '💁',
    parentId: 'tourism_hotels_restaurants',
  },
  {
    id: 'hr_business_trainer',
    name: 'Бизнес-тренер',
    icon: '📊',
    parentId: 'hr_training',
  },
  {
    id: 'hr_hrd',
    name: 'Директор по персоналу (HRD)',
    icon: '👔',
    parentId: 'hr_training',
  },
  {
    id: 'compensation_manager',
    name: 'Менеджер по компенсациям и льготам',
    icon: '💰',
    parentId: 'hr_training',
  },
  {
    id: 'hr_manager',
    name: 'Менеджер по персоналу',
    icon: '👥',
    parentId: 'hr_training',
  },
  {
    id: 'hr_head',
    name: 'Руководитель отдела персонала',
    icon: '👔',
    parentId: 'hr_training',
  },
  {
    id: 'hr_specialist',
    name: 'Специалист по кадрам',
    icon: '📋',
    parentId: 'hr_training',
  },
  {
    id: 'recruiter',
    name: 'Специалист по подбору персонала',
    icon: '🔍',
    parentId: 'hr_training',
  },
  {
    id: 'auditor',
    name: 'Аудитор',
    icon: '🔍',
    parentId: 'finance_accounting',
  },
  {
    id: 'finance_broker',
    name: 'Брокер',
    icon: '💹',
    parentId: 'finance_accounting',
  },
  {
    id: 'accountant',
    name: 'Бухгалтер',
    icon: '💼',
    parentId: 'finance_accounting',
  },
  {
    id: 'treasurer',
    name: 'Казначей',
    icon: '💰',
    parentId: 'finance_accounting',
  },
  {
    id: 'compliance_manager',
    name: 'Комплаенс-менеджер',
    icon: '📋',
    parentId: 'finance_accounting',
  },
  {
    id: 'finance_credit_specialist',
    name: 'Кредитный специалист',
    icon: '💳',
    parentId: 'finance_accounting',
  },
  {
    id: 'finance_methodologist',
    name: 'Методолог',
    icon: '📝',
    parentId: 'finance_accounting',
  },
  {
    id: 'debt_collector',
    name: 'Специалист по взысканию задолженности',
    icon: '💸',
    parentId: 'finance_accounting',
  },
  {
    id: 'finance_financial_analyst',
    name: 'Финансовый аналитик, инвестиционный аналитик',
    icon: '💹',
    parentId: 'finance_accounting',
  },
  {
    id: 'cfo',
    name: 'Финансовый директор (CFO)',
    icon: '👔',
    parentId: 'finance_accounting',
  },
  {
    id: 'financial_controller',
    name: 'Финансовый контролер',
    icon: '📊',
    parentId: 'finance_accounting',
  },
  {
    id: 'financial_manager',
    name: 'Финансовый менеджер',
    icon: '💼',
    parentId: 'finance_accounting',
  },
  {
    id: 'economist',
    name: 'Экономист',
    icon: '📈',
    parentId: 'finance_accounting',
  },
  {
    id: 'legal_clo',
    name: 'Директор юридического департамента (CLO)',
    icon: '👔',
    parentId: 'legal',
  },
  {
    id: 'legal_compliance_manager',
    name: 'Комплаенс-менеджер',
    icon: '📋',
    parentId: 'legal',
  },
  {
    id: 'legal_counsel',
    name: 'Юрисконсульт',
    icon: '⚖️',
    parentId: 'legal',
  },
  {
    id: 'lawyer',
    name: 'Юрист',
    icon: '⚖️',
    parentId: 'legal',
  },
  {
    id: 'other_category',
    name: 'Другое',
    icon: '📋',
    parentId: 'other',
  },
];

// Получить специализацию по ID
export const getSpecializationById = (id: string): SpecializationOption | undefined => {
  // Проверяем сначала в родительских категориях
  const parentSpec = PARENT_CATEGORIES.find(spec => spec.id === id);
  if (parentSpec) return parentSpec;
  
  // Затем в обычных специализациях
  return SPECIALIZATIONS.find(spec => spec.id === id);
};

// Получить подкатегории по родительскому ID
export const getSubcategoriesByParentId = (parentId: string): SpecializationOption[] => {
  return SPECIALIZATIONS.filter(spec => spec.parentId === parentId);
};

// Получить категории верхнего уровня (родительские + без родителя)
export const getTopLevelCategories = (): SpecializationOption[] => {
  const topLevelSpecs = SPECIALIZATIONS.filter(spec => !spec.parentId);
  // Сначала показываем топ-уровневые специализации, затем родительские категории
  return [...topLevelSpecs, ...PARENT_CATEGORIES];
};

// Получить имя специализации по ID (без перевода - для обратной совместимости)
export const getSpecializationName = (id: string): string => {
  const spec = getSpecializationById(id);
  return spec ? spec.name : id;
};

// Получить переведенное имя специализации по ID
export const getTranslatedSpecializationName = (
  id: string,
  t: (key: string) => string
): string => {
  const spec = getSpecializationById(id);
  if (!spec) return id;
  
  // Пытаемся получить перевод из категории
  return t(`categories.${spec.id}`);
};

// Получить переведенное имя специализации по ID в единственном числе (для профилей)
export const getTranslatedSpecializationNameSingular = (
  id: string,
  t: (key: string) => string
): string => {
  const spec = getSpecializationById(id);
  if (!spec) return id;
  
  // Пытаемся получить перевод из specializations_singular
  return t(`specializations_singular.${spec.id}`);
};

// Получить иконку специализации по ID
export const getSpecializationIcon = (id: string): string => {
  const spec = getSpecializationById(id);
  return spec ? spec.icon : '🔨';
};

// Получить SVG компонент специализации по ID
export const getSpecializationIconComponent = (id: string): React.ComponentType<any> | undefined => {
  const spec = getSpecializationById(id);
  return spec ? spec.iconComponent : undefined;
};

