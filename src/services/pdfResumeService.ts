import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { ProfessionalMaster } from './professionalMasterService';
import { getSpecializationById, getTranslatedSpecializationNameSingular } from '../constants';
import { getCityName } from '../utils/cityUtils';

// Логотип Osonish в base64 (SVG конвертирован)
const OSONISH_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1166 212.65" width="150" height="28">
  <g>
    <g>
      <path fill="#679b00" d="m44.02,156.16c-13.04-7.02-22.96-16.82-29.75-29.4-6.8-12.58-10.19-27.05-10.19-43.41s3.39-30.83,10.19-43.41c6.79-12.58,16.7-22.38,29.75-29.4C57.06,3.52,72.61,0,90.67,0s33.61,3.51,46.65,10.53c13.04,7.02,22.95,16.82,29.75,29.4,6.79,12.58,10.18,27.05,10.18,43.41s-3.4,30.83-10.18,43.41c-6.8,12.58-16.71,22.38-29.75,29.4-13.04,7.02-28.59,10.53-46.65,10.53s-33.61-3.51-46.65-10.53h0Zm87.63-29.63c9.72-10.57,14.59-24.96,14.59-43.17s-5.06-32.79-15.16-43.29c-10.11-10.49-24.35-15.74-42.71-15.74-16.82,0-29.9,5.36-39.24,16.09-9.34,10.73-14.01,25.04-14.01,42.94s4.86,32.61,14.59,43.17c9.72,10.57,23.38,15.86,40.98,15.86s31.25-5.28,40.98-15.86h-.02Z"/>
      <path fill="#679b00" d="m236.52,159.17c-13.28-5.01-24.77-12.23-34.49-21.65-2.32-2.31-3.47-4.94-3.47-7.87,0-3.39,1.54-6.63,4.63-9.72,2.46-2.47,5.17-3.7,8.1-3.7,3.09,0,6.79,1.78,11.11,5.32,7.25,6.64,15.86,11.77,25.81,15.39,9.96,3.63,20.26,5.44,30.9,5.44s18.13-1.74,23.85-5.21,8.57-8.37,8.57-14.7-3.09-12-9.26-16.09-16.66-7.76-31.48-11c-23.3-5.09-40.25-11.81-50.82-20.14s-15.86-19.06-15.86-32.18c0-8.33,2.78-15.78,8.33-22.34s13.31-11.65,23.27-15.28c9.96-3.62,21.33-5.44,34.15-5.44,14.35,0,27.12,2.35,38.31,7.06s19.71,11.31,25.58,19.79c2,3.24,3.01,6.02,3.01,8.33-.16,3.86-2.08,7.18-5.79,9.95-2.01,1.39-4.32,2.08-6.95,2.08-4.79,0-8.72-1.85-11.81-5.56-4.48-5.4-10.46-9.64-17.94-12.73-7.49-3.09-15.63-4.63-24.42-4.63-10.96,0-19.49,1.66-25.58,4.98-6.1,3.32-9.14,7.91-9.14,13.77s2.97,10.69,8.91,14.47,16.24,7.37,30.9,10.77c16.21,3.86,29.24,8.22,39.13,13.08,9.87,4.86,17.09,10.61,21.64,17.25s6.83,14.58,6.83,23.85-2.63,16.55-7.87,23.27c-5.25,6.71-12.66,11.89-22.22,15.51-9.57,3.62-20.69,5.44-33.34,5.44-15.13,0-29.33-2.51-42.6-7.52h.01Z"/>
      <path fill="#679b00" d="m403.78,156.16c-13.05-7.02-22.96-16.82-29.75-29.4s-10.18-27.05-10.18-43.41,3.39-30.83,10.18-43.41c6.79-12.58,16.7-22.38,29.75-29.4C416.82,3.52,432.37,0,450.43,0s33.6,3.51,46.64,10.53c13.04,7.02,22.96,16.82,29.75,29.4s10.18,27.05,10.18,43.41-3.39,30.83-10.18,43.41c-6.79,12.58-16.71,22.38-29.75,29.4s-28.59,10.53-46.64,10.53-33.61-3.51-46.65-10.53Zm87.62-29.63c9.73-10.57,14.59-24.96,14.59-43.17s-5.06-32.79-15.16-43.29c-10.11-10.49-24.35-15.74-42.71-15.74-16.82,0-29.91,5.36-39.24,16.09-9.34,10.73-14.01,25.04-14.01,42.94s4.86,32.61,14.59,43.17c9.72,10.57,23.38,15.86,40.98,15.86s31.25-5.28,40.97-15.86h-.01Z"/>
      <path fill="#679b00" d="m557.84,162.99c-2.78-2.47-4.17-5.86-4.17-10.19v-87.28c0-20.52,6.41-36.58,19.22-48.15C585.7,5.8,603.45,0,626.14,0s40.43,5.79,53.24,17.36c12.81,11.58,19.22,27.63,19.22,48.15v87.28c0,4.32-1.39,7.72-4.17,10.19-2.78,2.47-6.48,3.7-11.11,3.7s-8.37-1.27-11.23-3.82c-2.86-2.55-4.28-5.9-4.28-10.07v-87.97c0-13.12-3.55-23.15-10.65-30.1-7.1-6.94-17.44-10.42-31.02-10.42s-23.93,3.47-31.03,10.42c-7.1,6.95-10.65,16.98-10.65,30.1v87.97c0,4.17-1.43,7.52-4.28,10.07-2.86,2.55-6.6,3.82-11.23,3.82s-8.33-1.24-11.11-3.7h0Z"/>
      <path fill="#679b00" d="m796.52,162.99c-2.78-2.47-4.17-5.86-4.17-10.19V13.9c0-4.32,1.39-7.72,4.17-10.19,2.78-2.47,6.48-3.7,11.11-3.7s8.18,1.24,11.11,3.7c2.93,2.47,4.4,5.87,4.4,10.19v138.9c0,4.32-1.47,7.72-4.4,10.19-2.94,2.47-6.64,3.7-11.11,3.7s-8.33-1.24-11.11-3.7Z"/>
      <path fill="#679b00" d="m891.67,159.17c-13.28-5.01-24.77-12.23-34.5-21.65-2.31-2.31-3.47-4.94-3.47-7.87,0-3.39,1.54-6.63,4.63-9.72,2.47-2.47,5.17-3.7,8.11-3.7s6.79,1.78,11.11,5.32c7.25,6.64,15.86,11.77,25.81,15.39,9.96,3.63,20.26,5.44,30.91,5.44s18.13-1.74,23.85-5.21c5.71-3.47,8.56-8.37,8.56-14.7s-3.09-12-9.26-16.09-16.67-7.76-31.48-11c-23.31-5.09-40.25-11.81-50.82-20.14s-15.86-19.06-15.86-32.18c0-8.33,2.78-15.78,8.33-22.34,5.56-6.56,13.31-11.65,23.27-15.28,9.96-3.62,21.34-5.44,34.15-5.44,14.35,0,27.12,2.35,38.31,7.06s19.71,11.31,25.58,19.79c2.01,3.24,3.01,6.02,3.01,8.33-.16,3.86-2.08,7.18-5.78,9.95-2.01,1.39-4.32,2.08-6.95,2.08-4.79,0-8.72-1.85-11.81-5.56-4.48-5.4-10.46-9.64-17.94-12.73-7.49-3.09-15.62-4.63-24.42-4.63-10.96,0-19.49,1.66-25.58,4.98-6.1,3.32-9.14,7.91-9.14,13.77s2.97,10.69,8.91,14.47,16.24,7.37,30.91,10.77c16.2,3.86,29.24,8.22,39.12,13.08,9.88,4.86,17.09,10.61,21.64,17.25s6.83,14.58,6.83,23.85-2.62,16.55-7.87,23.27c-5.25,6.71-12.65,11.89-22.22,15.51s-20.68,5.44-33.33,5.44c-15.13,0-29.33-2.51-42.6-7.52h-.01Z"/>
      <path fill="#679b00" d="m1025.48,162.99c-2.78-2.47-4.17-5.86-4.17-10.19V13.9c0-4.32,1.39-7.72,4.17-10.19S1031.96,0,1036.59,0s8.37,1.27,11.23,3.82c2.85,2.55,4.28,5.9,4.28,10.07v55.33h83.11V13.9c0-4.17,1.43-7.52,4.28-10.07,2.85-2.55,6.6-3.82,11.23-3.82s8.33,1.24,11.11,3.7c2.78,2.47,4.17,5.87,4.17,10.19v138.9c0,4.32-1.39,7.72-4.17,10.19s-6.48,3.7-11.11,3.7-8.37-1.27-11.23-3.82c-2.86-2.55-4.28-5.9-4.28-10.07v-59.73h-83.11v59.73c0,4.17-1.43,7.52-4.28,10.07-2.86,2.55-6.6,3.82-11.23,3.82s-8.33-1.24-11.11-3.7Z"/>
    </g>
    <path fill="#ffaf00" d="m170.31,212.54c-52.68-8.34-106.13-8.34-158.81,0-5.21.82-10.15-3.17-10.99-8.99-.13-.93-.26-1.85-.39-2.78-.83-5.82,2.92-11.38,8.36-12.24,54.68-8.66,110.17-8.66,164.85,0,5.44.86,9.2,6.42,8.36,12.24-.13.93-.26,1.85-.39,2.78-.84,5.82-5.78,9.81-10.99,8.99h0Z"/>
  </g>
</svg>`;

// Фирменные цвета
const COLORS = {
  primary: '#679B00',
  secondary: '#FFAF00',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  border: '#E0E0E0',
  background: '#F5F5F5',
  white: '#FFFFFF',
};

// Иконки для PDF
const ICONS = {
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#679B00"><path d="M19,4H17.9A5.009,5.009,0,0,0,13,0H11A5.009,5.009,0,0,0,6.1,4H5A5.006,5.006,0,0,0,0,9V19a5.006,5.006,0,0,0,5,5H19a5.006,5.006,0,0,0,5-5V9A5.006,5.006,0,0,0,19,4ZM11,2h2a3,3,0,0,1,2.816,2H8.184A3,3,0,0,1,11,2ZM5,6H19a3,3,0,0,1,3,3v3H2V9A3,3,0,0,1,5,6ZM19,22H5a3,3,0,0,1-3-3V14h9v1a1,1,0,0,0,2,0V14h9v5A3,3,0,0,1,19,22Z"/></svg>`,
  graduationCap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20" fill="#F59E0B"><path d="M470.549,111.573L313.237,36.629c-34.628-20.684-77.728-21.051-112.704-0.96L41.451,111.573c-0.597,0.299-1.216,0.619-1.792,0.96c-37.752,21.586-50.858,69.689-29.272,107.441c7.317,12.798,18.08,23.284,31.064,30.266l43.883,20.907V375.68c0.026,46.743,30.441,88.039,75.072,101.931c31.059,8.985,63.264,13.384,95.595,13.056c32.326,0.362,64.531-4,95.595-12.949c44.631-13.891,75.046-55.188,75.072-101.931V271.104l42.667-20.395v175.957c0,11.782,9.551,21.333,21.333,21.333c11.782,0,21.333-9.551,21.333-21.333v-256C512.143,145.615,492.363,122.473,470.549,111.573z M384,375.787c0.011,27.959-18.129,52.69-44.8,61.077c-27.046,7.728-55.073,11.479-83.2,11.136c-28.127,0.343-56.154-3.408-83.2-11.136c-26.671-8.388-44.811-33.118-44.8-61.077v-84.309l70.763,33.707c17.46,10.368,37.401,15.816,57.707,15.765c19.328,0.137,38.331-4.98,54.976-14.805L384,291.477V375.787z M452.267,211.733l-160.896,76.8c-22.434,13.063-50.241,12.693-72.32-0.96l-157.419-74.88c-17.547-9.462-24.101-31.357-14.639-48.903c3.2-5.934,7.998-10.853,13.85-14.201l159.893-76.373c22.441-13.034,50.233-12.665,72.32,0.96l157.312,74.944c11.569,6.424,18.807,18.555,18.965,31.787C469.354,193.441,462.9,205.097,452.267,211.733L452.267,211.733z"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#6366F1"><path d="M23.836,8.794a3.179,3.179,0,0,0-3.067-2.226H16.4L15.073,2.432a3.227,3.227,0,0,0-6.146,0L7.6,6.568H3.231a3.227,3.227,0,0,0-1.9,5.832L4.887,15,3.535,19.187A3.178,3.178,0,0,0,4.719,22.8a3.177,3.177,0,0,0,3.8-.019L12,20.219l3.482,2.559a3.227,3.227,0,0,0,4.983-3.591L19.113,15l3.56-2.6A3.177,3.177,0,0,0,23.836,8.794Zm-2.343,1.991-4.144,3.029a1,1,0,0,0-.362,1.116L18.562,19.8a1.227,1.227,0,0,1-1.895,1.365l-4.075-3a1,1,0,0,0-1.184,0l-4.075,3a1.227,1.227,0,0,1-1.9-1.365L7.013,14.93a1,1,0,0,0-.362-1.116L2.507,10.785a1.227,1.227,0,0,1,.724-2.217h5.1a1,1,0,0,0,.952-.694l1.55-4.831a1.227,1.227,0,0,1,2.336,0l1.55,4.831a1,1,0,0,0,.952.694h5.1a1.227,1.227,0,0,1,.724,2.217Z"/></svg>`,
  cv: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#679B00"><path d="m12.76,10.469l-1.072-5.253c-.101-.496.278-.96.784-.96.38,0,.708.268.784.64l1.072,5.253c.013.065.031.117.05.159.02-.047.042-.109.057-.188l1.053-5.222c.075-.373.403-.642.784-.642.505,0,.884.463.784.958l-1.051,5.211c-.126.647-.609,1.575-1.628,1.575s-1.51-.97-1.618-1.531Zm-4.26-4.869c.408,0,.753.272.863.645.024.081.027.755.833.755s.815-.699.804-.796c-.146-1.241-1.219-2.204-2.5-2.204-1.381,0-2.5,1.119-2.5,2.5v3c0,1.381,1.119,2.5,2.5,2.5,1.278,0,2.35-.958,2.5-2.196.012-.1-.032-.804-.799-.804s-.813.669-.835.747c-.108.376-.455.653-.866.653-.496,0-.9-.404-.9-.9v-3c0-.496.404-.9.9-.9Zm13.5-.6v8.515c0,1.869-.728,3.627-2.05,4.95l-3.486,3.484c-1.321,1.322-3.079,2.051-4.95,2.051h-4.515c-2.757,0-5-2.243-5-5V5C2,2.243,4.243,0,7,0h10c2.757,0,5,2.243,5,5Zm-10.485,17c.165,0,.323-.032.485-.047v-4.953c0-1.654,1.346-3,3-3h4.953c.016-.162.047-.321.047-.485V5c0-1.654-1.346-3-3-3H7c-1.654,0-3,1.346-3,3v14c0,1.654,1.346,3,3,3h4.515Zm7.021-4.949c.315-.315.564-.675.781-1.051h-4.316c-.551,0-1,.448-1,1v4.316c.376-.217.735-.466,1.05-.781l3.486-3.484Z"/></svg>`,
  about: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#6B7280"><path d="M19,0H5C2.24,0,0,2.24,0,5v14c0,2.76,2.24,5,5,5h14c2.76,0,5-2.24,5-5V5c0-2.76-2.24-5-5-5Zm3,19c0,1.65-1.35,3-3,3H5c-1.65,0-3-1.35-3-3V5c0-1.65,1.35-3,3-3h14c1.65,0,3,1.35,3,3v14ZM5,10c0-.55,.45-1,1-1H15c.55,0,1,.45,1,1s-.45,1-1,1H6c-.55,0-1-.45-1-1Zm0-4c0-.55,.45-1,1-1h6c.55,0,1,.45,1,1s-.45,1-1,1H6c-.55,0-1-.45-1-1Zm14,8c0,.55-.45,1-1,1H6c-.55,0-1-.45-1-1s.45-1,1-1h12c.55,0,1,.45,1,1Zm-9,4c0,.55-.45,1-1,1h-3c-.55,0-1-.45-1-1s.45-1,1-1h3c.55,0,1,.45,1,1Z"/></svg>`,
};

// Функция для форматирования даты рождения и вычисления возраста
function formatBirthDateAndAge(birthDate: string): { age: number; formattedDate: string } {
  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  const day = date.getDate();
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return {
    age,
    formattedDate: `${day} ${month} ${year}`,
  };
}

// Функция для склонения слова "год"
function getAgeText(age: number): string {
  const lastDigit = age % 10;
  const lastTwoDigits = age % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${age} лет`;
  }
  
  if (lastDigit === 1) {
    return `${age} год`;
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${age} года`;
  }
  
  return `${age} лет`;
}

// Функция для форматирования пола
function formatGender(gender?: 'male' | 'female'): string {
  if (!gender) return '';
  return gender === 'male' ? 'Мужчина' : 'Женщина';
}

// Функция для форматирования типов занятости
function formatEmploymentTypes(types?: string[]): string {
  if (!types || types.length === 0) return '';
  
  const typeMap: Record<string, string> = {
    'full_time': 'полная занятость',
    'part_time': 'частичная занятость',
    'project': 'проектная работа',
    'internship': 'стажировка',
  };
  
  return types.map(t => typeMap[t] || t).join(', ');
}

// Функция для форматирования графиков работы
function formatWorkSchedules(schedules?: string[]): string {
  if (!schedules || schedules.length === 0) return '';
  
  const scheduleMap: Record<string, string> = {
    'remote': 'удаленная работа',
    'flexible': 'гибкий график',
    'full_day': 'полный день',
    'shift': 'сменный график',
  };
  
  return schedules.map(s => scheduleMap[s] || s).join(', ');
}

// Функция для форматирования зарплаты
function formatSalary(salary?: number): string {
  if (!salary) return '';
  return salary.toLocaleString('ru-RU') + ' сум';
}

// Функция для вычисления общего опыта работы
function calculateTotalExperience(workExperience?: { yearStart?: string; yearEnd?: string }[]): string {
  if (!workExperience || workExperience.length === 0) return '';
  
  let totalMonths = 0;
  
  workExperience.forEach(exp => {
    const startYear = parseInt(exp.yearStart || '0');
    const endYear = exp.yearEnd ? parseInt(exp.yearEnd) : new Date().getFullYear();
    
    if (startYear > 0) {
      totalMonths += (endYear - startYear) * 12;
    }
  });
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  if (years === 0 && months === 0) return '';
  
  let result = '';
  if (years > 0) {
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      result = `${years} лет`;
    } else if (lastDigit === 1) {
      result = `${years} год`;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      result = `${years} года`;
    } else {
      result = `${years} лет`;
    }
  }
  
  if (months > 0) {
    const monthWord = months === 1 ? 'месяц' : (months >= 2 && months <= 4 ? 'месяца' : 'месяцев');
    result += result ? ` ${months} ${monthWord}` : `${months} ${monthWord}`;
  }
  
  return result;
}

// Функция для конвертации изображения в base64
async function imageToBase64(imageUrl: string): Promise<string | null> {
  try {
    if (!imageUrl) return null;
    
    // Если уже base64
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    
    // Скачиваем изображение и конвертируем в base64
    const response = await FileSystem.downloadAsync(
      imageUrl,
      FileSystem.cacheDirectory + 'temp_profile_image.jpg'
    );
    
    const base64 = await FileSystem.readAsStringAsync(response.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Определяем тип изображения
    const extension = imageUrl.split('.').pop()?.toLowerCase() || 'jpeg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('[pdfResumeService] Ошибка конвертации изображения:', error);
    return null;
  }
}

// Основная функция генерации HTML для резюме
async function generateResumeHTML(
  applicant: ProfessionalMaster,
  t: (key: string) => string
): Promise<string> {
  // Конвертируем фото профиля
  const profileImageBase64 = applicant.profileImage 
    ? await imageToBase64(applicant.profileImage) 
    : null;
  
  // Получаем основную специализацию
  const primarySpecialization = applicant.specializations?.find(s => s.isPrimary);
  const primarySpecName = primarySpecialization 
    ? getTranslatedSpecializationNameSingular(primarySpecialization.id, t as any)
    : '';
  
  // Форматируем данные
  const birthInfo = applicant.birthDate 
    ? formatBirthDateAndAge(applicant.birthDate) 
    : null;
  const genderText = formatGender(applicant.gender);
  const cityName = applicant.city ? getCityName(applicant.city) : '';
  const totalExperience = calculateTotalExperience(applicant.workExperience);
  const employmentTypesText = formatEmploymentTypes(applicant.employmentTypes);
  const workSchedulesText = formatWorkSchedules(applicant.workSchedules);
  
  // Текущая дата для футера
  const now = new Date();
  const updateDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Резюме - ${applicant.firstName} ${applicant.lastName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: ${COLORS.text};
      background: ${COLORS.white};
      padding: 40px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    /* Header with logo */
    .header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${COLORS.primary};
    }
    
    .logo {
      height: 28px;
    }
    
    /* Profile section */
    .profile-section {
      display: flex;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .profile-photo {
      flex-shrink: 0;
    }
    
    .profile-photo img {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid ${COLORS.border};
    }
    
    .profile-photo-placeholder {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      background: linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.secondary}20);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
      color: ${COLORS.primary};
      border: 2px solid ${COLORS.border};
    }
    
    .profile-info {
      flex: 1;
    }
    
    .profile-info p {
      margin-bottom: 6px;
      color: ${COLORS.textSecondary};
    }
    
    /* Position and salary */
    .position-section {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${COLORS.border};
    }
    
    .section-title {
      font-size: 11px;
      color: ${COLORS.text};
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .position-title {
      font-size: 14px;
      font-weight: bold;
      color: ${COLORS.text};
      margin-bottom: 6px;
    }
    
    .salary {
      font-size: 14px;
      font-weight: bold;
      color: ${COLORS.text};
    }
    
    .salary-currency {
      font-size: 14px;
      font-weight: normal;
      color: ${COLORS.textSecondary};
    }
    
    /* Employment info */
    .employment-info {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${COLORS.border};
      font-size: 13px;
    }
    
    .employment-info p {
      margin-bottom: 5px;
      color: ${COLORS.textSecondary};
    }
    
    /* Section styles */
    .section {
      margin-bottom: 24px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${COLORS.border};
    }
    
    .section-header .section-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: #F3F4F6;
    }
    
    .section-header h2 {
      font-size: 15px;
      color: ${COLORS.text};
      font-weight: 600;
    }
    
    .section-header .total {
      font-size: 12px;
      color: ${COLORS.textSecondary};
      margin-left: 8px;
    }
    
    /* Work experience */
    .experience-item {
      margin-bottom: 18px;
      padding-left: 12px;
      border-left: 3px solid ${COLORS.primary};
    }
    
    .experience-period {
      font-size: 11px;
      color: ${COLORS.textSecondary};
      margin-bottom: 4px;
    }
    
    .experience-company {
      font-size: 14px;
      font-weight: bold;
      color: ${COLORS.text};
      margin-bottom: 3px;
    }
    
    .experience-position {
      font-size: 13px;
      font-weight: 500;
      color: ${COLORS.textSecondary};
      margin-bottom: 6px;
    }
    
    .experience-description {
      color: ${COLORS.textSecondary};
      line-height: 1.5;
      font-size: 12px;
    }
    
    .experience-description ul {
      margin-left: 16px;
      margin-top: 6px;
    }
    
    .experience-description li {
      margin-bottom: 4px;
    }
    
    /* Education */
    .education-item {
      margin-bottom: 14px;
      padding-left: 12px;
      border-left: 3px solid ${COLORS.secondary};
    }
    
    .education-period {
      font-size: 11px;
      color: ${COLORS.textSecondary};
      margin-bottom: 3px;
    }
    
    .education-institution {
      font-size: 13px;
      font-weight: bold;
      color: ${COLORS.text};
      margin-bottom: 3px;
    }
    
    .education-degree {
      color: ${COLORS.textSecondary};
      font-size: 12px;
    }
    
    /* Skills */
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .skill-tag {
      background: ${COLORS.background};
      color: ${COLORS.text};
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid ${COLORS.border};
    }
    
    /* About section */
    .about-text {
      color: ${COLORS.textSecondary};
      line-height: 1.6;
      font-size: 12px;
    }
    
    /* Specializations */
    .specializations-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .spec-tag {
      background: ${COLORS.background};
      color: ${COLORS.text};
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 11px;
      border: 1px solid ${COLORS.border};
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${COLORS.primary};
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: ${COLORS.textSecondary};
      font-size: 12px;
    }
    
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .footer-brand svg {
      height: 20px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with logo -->
    <div class="header">
      ${OSONISH_LOGO_SVG}
    </div>
    
    <!-- Profile section -->
    <div class="profile-section">
      <div class="profile-photo">
        ${profileImageBase64 
          ? `<img src="${profileImageBase64}" alt="Фото профиля">`
          : `<div class="profile-photo-placeholder">${applicant.firstName.charAt(0)}${applicant.lastName.charAt(0)}</div>`
        }
      </div>
      <div class="profile-info">
        ${genderText && birthInfo ? `<p>${genderText}, ${getAgeText(birthInfo.age)}, родился ${birthInfo.formattedDate}</p>` : ''}
        ${!genderText && birthInfo ? `<p>${getAgeText(birthInfo.age)}, родился ${birthInfo.formattedDate}</p>` : ''}
        ${cityName ? `<p>Проживает: ${cityName}</p>` : ''}
        ${applicant.willingToRelocate ? `<p>Готов к переезду</p>` : '<p>Не готов к переезду</p>'}
        ${applicant.willingToTravel ? `<p>Готов к командировкам</p>` : ''}
      </div>
    </div>
    
    <!-- Position and salary -->
    <div class="position-section">
      <div class="section-title">Желаемая должность и зарплата</div>
      <div class="position-title">${primarySpecName || 'Специалист'}</div>
      ${applicant.desiredSalary 
        ? `<div class="salary">${formatSalary(applicant.desiredSalary)} <span class="salary-currency"></span></div>` 
        : ''
      }
    </div>
    
    <!-- Employment info -->
    ${(employmentTypesText || workSchedulesText) ? `
    <div class="employment-info">
      ${employmentTypesText ? `<p>Занятость: ${employmentTypesText}</p>` : ''}
      ${workSchedulesText ? `<p>График работы: ${workSchedulesText}</p>` : ''}
    </div>
    ` : ''}
    
    <!-- Work Experience -->
    ${applicant.workExperience && applicant.workExperience.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">${ICONS.briefcase}</div>
        <h2>Опыт работы</h2>
        ${totalExperience ? `<span class="total">— ${totalExperience}</span>` : ''}
      </div>
      ${applicant.workExperience.map(exp => `
        <div class="experience-item">
          <div class="experience-period">${exp.yearStart || '?'} — ${exp.yearEnd || 'настоящее время'}</div>
          <div class="experience-company">${exp.company}</div>
          <div class="experience-position">${exp.position}</div>
          ${exp.description ? `
            <div class="experience-description">
              ${exp.description.includes('\n') || exp.description.includes('- ') 
                ? `<ul>${exp.description.split(/\n|(?=- )/).filter(Boolean).map(item => 
                    `<li>${item.replace(/^- /, '')}</li>`
                  ).join('')}</ul>`
                : exp.description
              }
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Education -->
    ${applicant.education && applicant.education.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">${ICONS.graduationCap}</div>
        <h2>Образование</h2>
      </div>
      ${applicant.education.map(edu => `
        <div class="education-item">
          <div class="education-period">${edu.yearStart || '?'} — ${edu.yearEnd || 'настоящее время'}</div>
          <div class="education-institution">${edu.institution}</div>
          ${edu.degree ? `<div class="education-degree">${edu.degree}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Skills -->
    ${applicant.skills && applicant.skills.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">${ICONS.star}</div>
        <h2>Ключевые навыки</h2>
      </div>
      <div class="skills-list">
        ${applicant.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>
    </div>
    ` : ''}
    
    <!-- Specializations -->
    ${applicant.specializations && applicant.specializations.length > 1 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">${ICONS.cv}</div>
        <h2>Специализации</h2>
      </div>
      <div class="specializations-list">
        ${applicant.specializations.map(spec => {
          const specName = getTranslatedSpecializationNameSingular(spec.id, t as any);
          return `<span class="spec-tag">${specName}</span>`;
        }).join('')}
      </div>
    </div>
    ` : ''}
    
    <!-- About -->
    ${applicant.aboutMe ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">${ICONS.about}</div>
        <h2>О себе</h2>
      </div>
      <p class="about-text">${applicant.aboutMe}</p>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">
        <span>Создано в</span>
        ${OSONISH_LOGO_SVG.replace('width="150"', 'width="80"').replace('height="28"', 'height="16"')}
      </div>
      <div>Резюме обновлено ${updateDate}</div>
    </div>
  </div>
</body>
</html>
  `;
}

// Экспортируемая функция генерации PDF
export async function generateResumePDF(
  applicant: ProfessionalMaster,
  t: (key: string) => string
): Promise<{ uri: string; fileName: string } | null> {
  try {
    console.log('[pdfResumeService] Начинаем генерацию PDF резюме для:', applicant.firstName, applicant.lastName);
    
    // Генерируем HTML
    const html = await generateResumeHTML(applicant, t);
    
    // Генерируем PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    
    // Создаем имя файла
    const fileName = `Резюме_${applicant.firstName}_${applicant.lastName}.pdf`;
    
    // Перемещаем файл с правильным именем
    const newUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });
    
    console.log('[pdfResumeService] PDF успешно создан:', newUri);
    
    return {
      uri: newUri,
      fileName,
    };
  } catch (error) {
    console.error('[pdfResumeService] Ошибка генерации PDF:', error);
    return null;
  }
}

export default {
  generateResumePDF,
};

