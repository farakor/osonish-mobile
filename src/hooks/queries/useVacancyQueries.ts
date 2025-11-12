import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vacancyService } from '../../services/vacancyService';
import {
  Order,
  VacancyApplication,
  CreateVacancyApplicationRequest,
  UpdateVacancyApplicationStatusRequest,
} from '../../types';

// Query keys для вакансий
export const vacancyQueryKeys = {
  all: ['vacancies'] as const,
  lists: () => [...vacancyQueryKeys.all, 'list'] as const,
  list: (filters?: any) => [...vacancyQueryKeys.lists(), filters] as const,
  details: () => [...vacancyQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...vacancyQueryKeys.details(), id] as const,
  applications: () => [...vacancyQueryKeys.all, 'applications'] as const,
  vacancyApplications: (vacancyId: string) => [...vacancyQueryKeys.applications(), 'vacancy', vacancyId] as const,
  myApplications: () => [...vacancyQueryKeys.applications(), 'my'] as const,
};

/**
 * Hook для получения списка вакансий
 */
export const useVacancies = () => {
  return useQuery({
    queryKey: vacancyQueryKeys.list(),
    queryFn: () => vacancyService.getVacancies(),
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

/**
 * Hook для получения деталей вакансии
 */
export const useVacancyDetails = (vacancyId: string) => {
  return useQuery({
    queryKey: vacancyQueryKeys.detail(vacancyId),
    queryFn: () => vacancyService.getVacancyById(vacancyId),
    enabled: !!vacancyId,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

/**
 * Hook для получения откликов на вакансию (для работодателя)
 */
export const useVacancyApplications = (vacancyId: string) => {
  return useQuery({
    queryKey: vacancyQueryKeys.vacancyApplications(vacancyId),
    queryFn: () => vacancyService.getVacancyApplications(vacancyId),
    enabled: !!vacancyId,
    staleTime: 1000 * 60 * 2, // 2 минуты
  });
};

/**
 * Hook для получения моих откликов на вакансии (для соискателя)
 */
export const useMyVacancyApplications = () => {
  return useQuery({
    queryKey: vacancyQueryKeys.myApplications(),
    queryFn: () => vacancyService.getMyVacancyApplications(),
    staleTime: 1000 * 60 * 2, // 2 минуты
  });
};

/**
 * Hook для проверки, откликался ли пользователь на вакансию
 */
export const useHasAppliedToVacancy = (vacancyId: string) => {
  return useQuery({
    queryKey: [...vacancyQueryKeys.applications(), 'hasApplied', vacancyId],
    queryFn: () => vacancyService.hasAppliedToVacancy(vacancyId),
    enabled: !!vacancyId,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

/**
 * Hook для отклика на вакансию
 */
export const useApplyToVacancy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateVacancyApplicationRequest) =>
      vacancyService.applyToVacancy(request),
    onSuccess: (_, variables) => {
      // Инвалидируем кэш откликов
      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.myApplications() });
      queryClient.invalidateQueries({
        queryKey: vacancyQueryKeys.vacancyApplications(variables.vacancyId),
      });
      queryClient.invalidateQueries({
        queryKey: [...vacancyQueryKeys.applications(), 'hasApplied', variables.vacancyId],
      });
    },
  });
};

/**
 * Hook для обновления статуса отклика на вакансию
 */
export const useUpdateVacancyApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateVacancyApplicationStatusRequest) =>
      vacancyService.updateVacancyApplicationStatus(request),
    onSuccess: () => {
      // Инвалидируем кэш всех откликов
      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.applications() });
    },
  });
};

