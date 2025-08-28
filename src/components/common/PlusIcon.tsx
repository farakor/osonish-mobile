import React from 'react';
import { SvgXml } from 'react-native-svg';

const plusSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface PlusIconProps {
  size?: number;
  color?: string;
}

export const PlusIcon: React.FC<PlusIconProps> = ({ size = 16, color = 'white' }) => {
  // Заменяем цвет в SVG на основе пропса
  const coloredSvg = plusSvg.replace(/stroke="white"/g, `stroke="${color}"`);
  
  return (
    <SvgXml 
      xml={coloredSvg} 
      width={size} 
      height={size} 
    />
  );
};
