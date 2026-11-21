"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readPanelAuthSession } from "@/panel/panel-session";
import {
  assignPlatformDomain,
  checkDomainDns,
  deletePlatformDomain,
  fetchPlatformDomains,
  verifyPlatformDomain,
} from "@/panel/site-api";

export const PLATFORM_DOMAINS_QUERY_KEY = ["platform", "domains"] as const;

export function usePlatformDomains() {
  const queryClient = useQueryClient();
  const session = readPanelAuthSession();

  const isPlatform = session?.user.role === "platform";
  const query = useQuery({
    queryKey: PLATFORM_DOMAINS_QUERY_KEY,
    queryFn: () => fetchPlatformDomains(),
    enabled: isPlatform,
    retry: false,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const assignMutation = useMutation({
    mutationFn: (input: { slug: string; domain: string }) =>
      assignPlatformDomain({
        slug: input.slug,
        domain: input.domain,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PLATFORM_DOMAINS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: ["platform", "sites"] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (domain: string) =>
      verifyPlatformDomain({
        domain,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PLATFORM_DOMAINS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: ["platform", "sites"] });
    },
  });

  const scanMutation = useMutation({
    mutationFn: (domain: string) =>
      checkDomainDns({
        domain,
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (input: { domain: string; slug?: string }) =>
      deletePlatformDomain({
        domain: input.domain,
        slug: input.slug,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PLATFORM_DOMAINS_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: ["platform", "sites"] });
    },
  });

  return {
    domains: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
    refetch: query.refetch,
    assignDomain: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    verifyDomain: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    removeDomain: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    scanDomain: scanMutation.mutateAsync,
    isScanning: scanMutation.isPending,
  };
}
