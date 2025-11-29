import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList, WorkerStackParamList } from '../types/navigation';

/**
 * Утилита для навигации к профилю исполнителя
 * Автоматически определяет правильный экран в зависимости от типа исполнителя
 */
export const navigateToWorkerProfile = (
  navigation: 
    | NativeStackNavigationProp<CustomerStackParamList>
    | NativeStackNavigationProp<WorkerStackParamList>,
  masterId: string,
  workerType?: 'professional' | 'daily_worker' | 'job_seeker'
) => {
  // Для job_seeker открываем экран резюме
  if (workerType === 'job_seeker') {
    navigation.navigate('JobSeekerProfile' as any, { masterId });
  } else {
    // Для professional и daily_worker открываем стандартный профиль
    navigation.navigate('ProfessionalMasterProfile' as any, { masterId });
  }
};
















