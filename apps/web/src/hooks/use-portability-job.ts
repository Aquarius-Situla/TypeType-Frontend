import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../lib/api";
import {
  cancelPortabilityJob,
  deletePortabilityJob,
  getPortabilityJob,
  type PortabilityJob,
} from "../lib/api-portability";
import { shouldPollPortabilityJob } from "../lib/portability-job-polling";

export function usePortabilityJob(id: string | null) {
  const queryClient = useQueryClient();
  const key = ["portability-job", id] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: () => getPortabilityJob(id as string),
    enabled: id !== null,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 2,
    refetchInterval: (current) =>
      shouldPollPortabilityJob(current.state.error, current.state.data?.state) ? 1_000 : false,
  });
  const cancel = useMutation({
    mutationFn: () => cancelPortabilityJob(id as string),
    onSuccess: (job) => queryClient.setQueryData<PortabilityJob>(key, job),
  });
  const remove = useMutation({
    mutationFn: () => deletePortabilityJob(id as string),
    onSuccess: () => queryClient.removeQueries({ queryKey: key }),
  });
  const missing = query.error instanceof ApiError && query.error.status === 404;
  return { ...query, cancel, remove, missing };
}
