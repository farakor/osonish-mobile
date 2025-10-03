import React from 'react';
import FaucetIcon from '../../assets/cats/faucet.svg';
import ManagementIcon from '../../assets/cats/management.svg';
import ElectricPowerIcon from '../../assets/cats/electric-power.svg';
import PaintRollerIcon from '../../assets/cats/paint-roller.svg';
import GasKotelIcon from '../../assets/cats/gas-kotel.svg';
import GasStoveIcon from '../../assets/cats/gas-stove.svg';
import SawIcon from '../../assets/cats/saw.svg';
import GardeningIcon from '../../assets/cats/gardening.svg';

export interface SpecializationOption {
  id: string;
  name: string;
  icon: string; // emoji иконка (используется если нет iconComponent)
  iconComponent?: React.ComponentType<any>; // SVG компонент (приоритет над emoji)
}

export const SPECIALIZATIONS: SpecializationOption[] = [
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
  },
  {
    id: 'washing_machine',
    name: 'Стиральные машины',
    icon: '🧺',
  },
  {
    id: 'turnkey_renovation',
    name: 'Ремонт под ключ',
    icon: '🏠',
  },
  {
    id: 'lock_repair',
    name: 'Ремонт замков',
    icon: '🔐',
  },
  {
    id: 'refrigerator',
    name: 'Холодильники',
    icon: '🧊',
  },
  {
    id: 'doors',
    name: 'Двери',
    icon: '🚪',
  },
  {
    id: 'plastic_windows',
    name: 'Пластиковые окна',
    icon: '🪟',
  },
  {
    id: 'bricklaying',
    name: 'Кладка кирпича',
    icon: '🧱',
  },
  {
    id: 'custom_furniture',
    name: 'Мебель на заказ',
    icon: '🪑',
  },
  {
    id: 'welder',
    name: 'Сварщики',
    icon: '🔨',
  },
  {
    id: 'roofer',
    name: 'Кровельщики',
    icon: '🏗️',
  },
  {
    id: 'tiler',
    name: 'Плиточники',
    icon: '🟦',
  },
];

// Получить специализацию по ID
export const getSpecializationById = (id: string): SpecializationOption | undefined => {
  return SPECIALIZATIONS.find(spec => spec.id === id);
};

// Получить имя специализации по ID
export const getSpecializationName = (id: string): string => {
  const spec = getSpecializationById(id);
  return spec ? spec.name : id;
};

// Получить иконку специализации по ID
export const getSpecializationIcon = (id: string): string => {
  const spec = getSpecializationById(id);
  return spec ? spec.icon : '🔨';
};

