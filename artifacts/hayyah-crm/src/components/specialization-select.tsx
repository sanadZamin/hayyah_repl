import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_SPECIALIZATION_OPTIONS } from "@/lib/service-specializations";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
};

export function SpecializationSelect({
  value,
  onValueChange,
  id,
  className,
  disabled,
}: Props) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full rounded-xl", className)}>
        <SelectValue placeholder="Select specialization" />
      </SelectTrigger>
      <SelectContent>
        {SERVICE_SPECIALIZATION_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Map stored API value to dropdown label for display in lists/cards. */
export function specializationLabel(value: string): string {
  const found = SERVICE_SPECIALIZATION_OPTIONS.find((o) => o.value === value);
  return found?.label ?? value;
}
