'use client';

import { useState } from 'react';
import { Task } from '@/types/domain';
import TaskCard from './task-card';

const STATUSES: Array<Task['status']> = ['todo', 'in_progress', 'review', 'done'];

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

interface TaskBoardProps {
  projectId: string;
  tasks: Task[];
  showTaskForm: boolean;
  setShowTaskForm: (show: boolean) => void;
}

export default function TaskBoard({
  projectId,
  tasks,
  showTaskForm,
  setShowTaskForm,
}: TaskBoardProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          status: 'todo',
          configuration: {
            priority,
            description,
            tags: [],
            customFields: {},
          },
          dependencies: selectedDependencies,
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      setTitle('');
      setDescription('');
      setPriority('medium');
      setSelectedDependencies([]);
      setShowTaskForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleToggleDependency = (taskId: string) => {
    setSelectedDependencies((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const tasksByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    },
    {} as Record<Task['status'], Task[]>
  );

  return (
    <div>
      {showTaskForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Create New Task</h2>
            <button
              onClick={() => setShowTaskForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Task Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title..."
                required
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task description..."
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as typeof priority)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Dependencies (optional)
              </label>
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No existing tasks to depend on
                </p>
              ) : (
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {tasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(task.id)}
                        onChange={() => handleToggleDependency(task.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{task.title}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedDependencies.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedDependencies.length} task(s) selected
                </p>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create Task
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUSES.map((status) => (
          <div key={status} className="flex flex-col">
            <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
              <h3 className="font-semibold text-gray-700">
                {STATUS_LABELS[status]}
              </h3>
              <span className="text-sm text-gray-500">
                {tasksByStatus[status].length} tasks
              </span>
            </div>
            <div className="flex-1 space-y-3">
              {tasksByStatus[status].map((task) => (
                <TaskCard key={task.id} task={task} allTasks={tasks} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
