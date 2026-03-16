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

export function useCreateTechnician() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedCreateTechnician({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTechniciansQueryKey() });
        toast({ title: "Technician created successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to create technician", variant: "destructive" });
        console.error(err);
      }
    }
  });
}
