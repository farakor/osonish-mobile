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
}

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
  },
  {
    id: 'plumber',
    name: 'Сантехники',
    icon: '🔧',
    iconComponent: FaucetIcon,
  },
  {
    id: 'electrician',
    name: 'Электрики',
    icon: '⚡',
    iconComponent: ElectricPowerIcon,
  },
  {
    id: 'painter',
    name: 'Маляр-Штукатур',
    icon: '🎨',
    iconComponent: PaintRollerIcon,
  },
  {
    id: 'boiler_installation',
    name: 'Установка котлов',
    icon: '🔥',
    iconComponent: GasKotelIcon,
  },
  {
    id: 'gas_electric_stoves',
    name: 'Газовые и электроплиты',
    icon: '🍳',
    iconComponent: GasStoveIcon,
  },
  {
    id: 'carpenter',
    name: 'Плотники',
    icon: '🪚',
    iconComponent: SawIcon,
  },
  {
    id: 'gardener',
    name: 'Садовник',
    icon: '🌱',
    iconComponent: GardeningIcon,
  },
  {
    id: 'air_conditioner',
    name: 'Кондиционеры',
    icon: '❄️',
    iconComponent: AirConditionerIcon,
  },
  {
    id: 'washing_machine',
    name: 'Стиральные машины',
    icon: '🧺',
    iconComponent: LaundryIcon,
  },
  {
    id: 'turnkey_renovation',
    name: 'Ремонт под ключ',
    icon: '🏠',
    iconComponent: RenovationIcon,
  },
  {
    id: 'lock_repair',
    name: 'Ремонт замков',
    icon: '🔐',
    iconComponent: PadlockIcon,
  },
  {
    id: 'refrigerator',
    name: 'Холодильники',
    icon: '🧊',
    iconComponent: SmartRefrigeratorIcon,
  },
  {
    id: 'doors',
    name: 'Двери',
    icon: '🚪',
    iconComponent: DoorIcon,
  },
  {
    id: 'plastic_windows',
    name: 'Пластиковые окна',
    icon: '🪟',
    iconComponent: WindowIcon,
  },
  {
    id: 'bricklaying',
    name: 'Кладка кирпича',
    icon: '🧱',
    iconComponent: ConstructionIcon,
  },
  {
    id: 'custom_furniture',
    name: 'Мебель на заказ',
    icon: '🪑',
    iconComponent: BedIcon,
  },
  {
    id: 'welder',
    name: 'Сварщики',
    icon: '🔨',
    iconComponent: WelderIcon,
  },
  {
    id: 'roofer',
    name: 'Кровельщики',
    icon: '🏗️',
    iconComponent: RooftileIcon,
  },
  {
    id: 'tiler',
    name: 'Плиточники',
    icon: '🟦',
    iconComponent: TileIcon,
  },
];

// Получить специализацию по ID
export const getSpecializationById = (id: string): SpecializationOption | undefined => {
  return SPECIALIZATIONS.find(spec => spec.id === id);
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

