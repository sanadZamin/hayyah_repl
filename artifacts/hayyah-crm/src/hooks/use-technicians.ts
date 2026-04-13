import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListTechnicians,
  useCreateTechnician as useGeneratedCreateTechnician,
  getListTechniciansQueryKey
} from "@workspace/api-client-react";

export function useTechnicians() {
  return useListTechnicians();
}

export function useCreateTechnician(options?: {
  successTitle?: string;
  errorTitle?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const successTitle = options?.successTitle ?? "Technician registered";
  const errorTitle = options?.errorTitle ?? "Registration failed";

  return useGeneratedCreateTechnician({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTechniciansQueryKey() });
        toast({ title: successTitle });
      },
      onError: (err) => {
        toast({ title: errorTitle, variant: "destructive" });
        console.error(err);
      },
    },
  });
}
