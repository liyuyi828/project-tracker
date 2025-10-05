import { TaskConfiguration } from '@/types/domain';

interface PriorityBadgeProps {
  priority: TaskConfiguration['priority'];
  size?: 'sm' | 'md';
}

const PRIORITY_COLORS: Record<TaskConfiguration['priority'], string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

  return (
    <span
      className={`${sizeClasses} rounded-full font-medium ${PRIORITY_COLORS[priority]}`}
    >
      {priority}
    </span>
  );
}
