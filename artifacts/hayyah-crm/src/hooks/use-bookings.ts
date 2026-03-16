import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListBookings,
  useCreateBooking as useGeneratedCreateBooking,
  useUpdateBooking as useGeneratedUpdateBooking,
  getListBookingsQueryKey
} from "@workspace/api-client-react";

export function useBookings(params?: { status?: any; date?: string }) {
  return useListBookings(params);
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedCreateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        toast({ title: "Booking created successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to create booking", variant: "destructive" });
        console.error(err);
      }
    }
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useGeneratedUpdateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        toast({ title: "Booking updated successfully" });
      },
      onError: (err) => {
        toast({ title: "Failed to update booking", variant: "destructive" });
        console.error(err);
      }
    }
  });
}
