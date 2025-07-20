import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from './StatusBadge';

interface StatusDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const PROJECT_STATUSES = [
  'Planning',
  'Active', 
  'Building',
  'Completed',
  'Delayed'
] as const;

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  onValueChange,
  disabled = false
}) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-auto min-w-[100px] h-auto p-0 border-0 bg-transparent">
        <SelectValue asChild>
          <StatusBadge status={value as any} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PROJECT_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <StatusBadge status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};