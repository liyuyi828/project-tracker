'use client';

import { useState } from 'react';
import { Task } from '@/types/domain';
import Link from 'next/link';
import PriorityBadge from './priority-badge';

const STATUS_OPTIONS: Array<{ value: Task['status']; label: string }> = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

interface TaskCardProps {
  task: Task;
  allTasks?: Task[];
}

export default function TaskCard({ task, allTasks = [] }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get dependency task titles
  const dependencyTasks = task.dependencies
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter((t): t is Task => t !== undefined);

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task');
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <Link
          href={`/tasks/${task.id}`}
          className="font-medium text-gray-900 flex-1 hover:text-blue-600 transition-colors"
        >
          {task.title}
        </Link>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge priority={task.configuration.priority} />
      </div>

      {task.configuration.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.configuration.description}
        </p>
      )}

      {dependencyTasks.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-1">
            {dependencyTasks.map((dep) => (
              <span
                key={dep.id}
                className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200"
                title={`Depends on: ${dep.title}`}
              >
                🔗 {dep.title.length > 15 ? dep.title.substring(0, 15) + '...' : dep.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Change Status
            </label>
            <select
              value={task.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as Task['status'])
              }
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {task.assignedTo.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <div className="flex flex-wrap gap-1">
                {task.assignedTo.map((assignee, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {assignee}
                  </span>
                ))}
              </div>
            </div>
          )}

          {task.configuration.tags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {task.configuration.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Delete Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
