import { Task } from '@/types/domain';
import Link from 'next/link';
import StatusBadge from './status-badge';
import PriorityBadge from './priority-badge';

interface DependencyCardProps {
  task: Task;
  onRemove?: (taskId: string) => void;
}

export default function DependencyCard({ task, onRemove }: DependencyCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 relative group">
      {onRemove && (
        <button
          onClick={() => onRemove(task.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
          title="Remove dependency"
        >
          ✕
        </button>
      )}
      <Link href={`/tasks/${task.id}`} className="block hover:text-blue-600">
        <div className="flex items-start justify-between mb-2 pr-6">
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          <StatusBadge status={task.status} />
        </div>
        {task.configuration.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {task.configuration.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
            {task.configuration.priority}
          </span>
          <span className="text-xs text-gray-500">🔗 Dependency</span>
        </div>
      </Link>
    </div>
  );
}
