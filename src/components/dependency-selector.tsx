'use client';

import { Task } from '@/types/domain';
import { wouldCreateCycle } from '@/lib/utils/dependency-validator';
import StatusBadge from './status-badge';

interface DependencySelectorProps {
  currentTaskId: string;
  allTasks: Task[];
  selectedDependencies: string[];
  onToggle: (taskId: string) => void;
}

export default function DependencySelector({
  currentTaskId,
  allTasks,
  selectedDependencies,
  onToggle,
}: DependencySelectorProps) {
  const availableTasks = allTasks.filter((t) => t.id !== currentTaskId);

  if (availableTasks.length === 0) {
    return <p className="text-sm text-gray-500">No other tasks available</p>;
  }

  return (
    <div className="space-y-2">
      {availableTasks.map((task) => {
        const isDisabled =
          wouldCreateCycle(currentTaskId, task.id, allTasks) &&
          !selectedDependencies.includes(task.id);

        return (
          <label
            key={task.id}
            className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedDependencies.includes(task.id)}
              onChange={() => onToggle(task.id)}
              disabled={isDisabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={task.status} />
                <span className="text-xs text-gray-500">
                  {task.configuration.priority}
                </span>
              </div>
            </div>
            {isDisabled && (
              <span className="text-xs text-red-600">Would create cycle</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
