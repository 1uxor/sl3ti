import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useData<T>(key: string, org: string, enabled = true) {
  return useQuery<T>({
    queryKey: [key, org],
    queryFn: () => api<T>(key, {}, org),
    enabled: !!org && enabled,
  });
}
