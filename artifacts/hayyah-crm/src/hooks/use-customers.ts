import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListCustomers,
  useCreateCustomer as useGeneratedCreateCustomer,
  useUpdateCustomer as useGeneratedUpdateCustomer,
  useDeleteCustomer as useGeneratedDeleteCustomer,
  getListCustomersQueryKey
} from "@workspace/api-client-react";

export function useCustomers(params?: { search?: string; status?: string }) {
  // @ts-ignore mapping generic string to specific enum if needed
  return useListCustomers(params);
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedCreateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: "Customer created successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to create customer", variant: "destructive" });
        console.error(err);
      }
    }
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedUpdateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: "Customer updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to update customer", variant: "destructive" });
        console.error(err);
      }
    }
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedDeleteCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
        toast({ title: "Customer deleted successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to delete customer", variant: "destructive" });
        console.error(err);
      }
    }
  });
}
