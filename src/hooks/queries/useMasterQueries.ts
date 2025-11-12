import { useQuery } from '@tanstack/react-query';
import { professionalMasterService } from '../../services/professionalMasterService';
import { queryKeys } from '../../config/queryClient';

/**
 * Hook для получения списка мастеров с фильтрами
 */
export const useMasters = (filters?: {
  specializationId?: string;
  cityId?: string;
  searchQuery?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.masters.list(filters),
    queryFn: async () => {
      const masters = await professionalMasterService.getProfessionalMasters(
        filters?.specializationId,
        filters?.cityId,
        filters?.searchQuery
      );
      return masters;
    },
    staleTime: 5 * 60 * 1000, // 5 минут - список мастеров обновляется редко
  });
};

/**
 * Hook для получения деталей мастера
 */
export const useMasterDetails = (masterId: string) => {
  return useQuery({
    queryKey: queryKeys.masters.detail(masterId),
    queryFn: async () => {
      const master = await professionalMasterService.getProfessionalMasterById(masterId);
      return master;
    },
    enabled: !!masterId,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

/**
 * Hook для получения отзывов мастера
 */
export const useMasterReviews = (masterId: string) => {
  return useQuery({
    queryKey: queryKeys.masters.reviews(masterId),
    queryFn: async () => {
      const reviews = await professionalMasterService.getMasterReviews(masterId);
      return reviews;
    },
    enabled: !!masterId,
    staleTime: 10 * 60 * 1000, // 10 минут - отзывы обновляются редко
  });
};









