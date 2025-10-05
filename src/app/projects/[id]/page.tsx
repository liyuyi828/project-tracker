'use client';

import { use, useCallback, useState } from 'react';
import { useProject } from '@/hooks/use-projects';
import { useSSE } from '@/hooks/use-sse';
import { SSEMessage } from '@/types/api';
import { Task } from '@/types/domain';
import Link from 'next/link';
import TaskBoard from '@/components/task-board';

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project, loading, updateTask, addTask, removeTask } = useProject(id);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Handle SSE messages
  const handleSSEMessage = useCallback(
    (message: SSEMessage) => {
      console.log('[SSE] Received message:', message);

      switch (message.type) {
        case 'TASK_CREATED':
          if (message.delta) {
            addTask(message.delta as Task);
          }
          break;
        case 'TASK_UPDATED':
          if (message.delta) {
            updateTask(message.entityId, message.delta);
          }
          break;
        case 'TASK_DELETED':
          removeTask(message.entityId);
          break;
        case 'PROJECT_UPDATED':
          // Could update project metadata if needed
          break;
      }
    },
    [updateTask, addTask, removeTask]
  );

  const { connected } = useSSE(id, handleSSEMessage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600 text-sm mt-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 text-sm ${
                  connected ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-600' : 'bg-gray-400'
                  }`}
                />
                {connected ? 'Live' : 'Disconnected'}
              </div>
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <TaskBoard
          projectId={id}
          tasks={project.tasks}
          showTaskForm={showTaskForm}
          setShowTaskForm={setShowTaskForm}
        />
      </div>
    </div>
  );
}
