// src/hooks/useMetrics.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AtlasAPI } from '../api';

export const useMetrics = (bizId) => {
  return useQuery({
    queryKey: ['metrics', bizId],
    queryFn: () => AtlasAPI.metrics.summary(bizId),
    enabled: !!bizId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    refetchInterval: 300000, // 5 minutes auto-refetch
    retry: 2,
  });
};

export const useInsights = (bizId) => {
  return useQuery({
    queryKey: ['insights', bizId],
    queryFn: () => AtlasAPI.insights.list(bizId),
    enabled: !!bizId,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchInterval: 600000, // 10 minutes auto-refetch
    retry: 2,
  });
};

export const useActions = (bizId) => {
  return useQuery({
    queryKey: ['actions', bizId],
    queryFn: () => AtlasAPI.actions.list(bizId),
    enabled: !!bizId,
    staleTime: 300000,
    gcTime: 600000,
    refetchInterval: 600000,
    retry: 2,
  });
};

export const useAutomations = (bizId) => {
  return useQuery({
    queryKey: ['automations', bizId],
    queryFn: () => AtlasAPI.automations.list(bizId),
    enabled: !!bizId,
    staleTime: 600000,
    gcTime: 900000,
    retry: 2,
  });
};

export const useBusinesses = () => {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: () => AtlasAPI.businesses.list(),
    staleTime: 600000,
    gcTime: 900000,
    retry: 2,
  });
};

export const useBusiness = (bizId) => {
  return useQuery({
    queryKey: ['business', bizId],
    queryFn: () => AtlasAPI.businesses.get(bizId),
    enabled: !!bizId,
    staleTime: 300000,
    gcTime: 600000,
    retry: 2,
  });
};

export const useSettings = (bizId) => {
  return useQuery({
    queryKey: ['settings', bizId],
    queryFn: () => AtlasAPI.settings.get(bizId),
    enabled: !!bizId,
    staleTime: 600000,
    gcTime: 900000,
    retry: 2,
  });
};

// Utility hook to invalidate and refetch metrics
export const useRefreshMetrics = () => {
  const queryClient = useQueryClient();
  return (bizId) => {
    queryClient.invalidateQueries({ queryKey: ['metrics', bizId] });
  };
};

export const useRefreshInsights = () => {
  const queryClient = useQueryClient();
  return (bizId) => {
    queryClient.invalidateQueries({ queryKey: ['insights', bizId] });
  };
};

export const useRefreshActions = () => {
  const queryClient = useQueryClient();
  return (bizId) => {
    queryClient.invalidateQueries({ queryKey: ['actions', bizId] });
  };
};
