'use client';

import { use, useCallback, useState } from 'react';
import { useTask } from '@/hooks/use-task';
import { useSSE } from '@/hooks/use-sse';
import { SSEMessage } from '@/types/api';
import { Comment, Task } from '@/types/domain';
import Link from 'next/link';
import { wouldCreateCycle } from '@/lib/utils/dependency-validator';
import PriorityBadge from '@/components/priority-badge';
import DependencySelector from '@/components/dependency-selector';
import DependencyCard from '@/components/dependency-card';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

// Internal Components
function TaskDetailsSection({
  task,
  isEditingStatus,
  setIsEditingStatus,
  handleStatusChange,
}: {
  task: Task;
  isEditingStatus: boolean;
  setIsEditingStatus: (value: boolean) => void;
  handleStatusChange: (status: Task['status']) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
        <PriorityBadge priority={task.configuration.priority} size="md" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Status
          </label>
          {isEditingStatus ? (
            <div className="flex items-center gap-2">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              <button
                onClick={() => setIsEditingStatus(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-medium">
                {STATUS_LABELS[task.status]}
              </p>
              <button
                onClick={() => setIsEditingStatus(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {task.assignedTo.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Assigned To
            </label>
            <div className="flex flex-wrap gap-2">
              {task.assignedTo.map((assignee, index) => (
                <span
                  key={index}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                >
                  {assignee}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {task.configuration.description && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Description
          </label>
          <p className="text-gray-700">{task.configuration.description}</p>
        </div>
      )}

      {task.configuration.tags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {task.configuration.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DependenciesSection({
  task,
  allProjectTasks,
  isEditingDependencies,
  setIsEditingDependencies,
  selectedDependencies,
  setSelectedDependencies,
  handleToggleDependency,
  handleSaveDependencies,
  handleRemoveDependency,
}: {
  task: Task;
  allProjectTasks: Task[];
  isEditingDependencies: boolean;
  setIsEditingDependencies: (value: boolean) => void;
  selectedDependencies: string[];
  setSelectedDependencies: (value: string[]) => void;
  handleToggleDependency: (taskId: string) => void;
  handleSaveDependencies: () => void;
  handleRemoveDependency: (depId: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Dependencies ({task.dependencies.length})
        </h2>
        {!isEditingDependencies && (
          <button
            onClick={() => {
              setSelectedDependencies(task.dependencies);
              setIsEditingDependencies(true);
            }}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Manage Dependencies
          </button>
        )}
      </div>

      {isEditingDependencies ? (
        <div className="space-y-4">
          <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-600 mb-3">
              Select tasks that this task depends on:
            </p>
            <DependencySelector
              currentTaskId={task.id}
              allTasks={allProjectTasks}
              selectedDependencies={selectedDependencies}
              onToggle={handleToggleDependency}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDependencies}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingDependencies(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : task.dependencies.length === 0 ? (
        <p className="text-gray-500">No dependencies yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {task.dependencies.map((depId) => {
            const depTask = allProjectTasks.find((t) => t.id === depId);
            if (!depTask) return null;

            return (
              <DependencyCard
                key={depId}
                task={depTask}
                onRemove={handleRemoveDependency}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentsSection({
  comments,
  author,
  setAuthor,
  commentContent,
  setCommentContent,
  submitting,
  handleSubmitComment,
}: {
  comments: Comment[];
  author: string;
  setAuthor: (value: string) => void;
  commentContent: string;
  setCommentContent: (value: string) => void;
  submitting: boolean;
  handleSubmitComment: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Name
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name..."
              required
            />
          </div>
          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Add a comment
            </label>
            <textarea
              id="comment"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your comment..."
              rows={3}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {comment.author}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 ml-10">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { task, comments, allProjectTasks, loading, addComment, removeComment, refetch } = useTask(id);
  const [commentContent, setCommentContent] = useState('');
  const [author, setAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingDependencies, setIsEditingDependencies] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  // Handle SSE messages
  const handleSSEMessage = useCallback(
    (message: SSEMessage) => {
      if (message.type === 'COMMENT_ADDED' && message.delta) {
        addComment(message.delta as Comment);
      } else if (message.type === 'COMMENT_DELETED') {
        removeComment(message.entityId);
      }
    },
    [addComment, removeComment]
  );

  const { connected } = useSSE(task?.projectId || null, handleSSEMessage);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !author.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/tasks/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent, author }),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      setCommentContent('');
      // Keep author for convenience
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      await refetch();
      setIsEditingStatus(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveDependencies = async () => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependencies: selectedDependencies }),
      });

      if (!response.ok) throw new Error('Failed to update dependencies');

      await refetch();
      setIsEditingDependencies(false);
    } catch (error) {
      console.error('Failed to update dependencies:', error);
    }
  };

  const handleToggleDependency = (taskId: string) => {
    if (!task) return;

    // Check if adding this would create a cycle
    if (!selectedDependencies.includes(taskId)) {
      if (wouldCreateCycle(task.id, taskId, allProjectTasks)) {
        alert('Cannot add this dependency: it would create a circular dependency!');
        return;
      }
    }

    setSelectedDependencies((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleRemoveDependency = async (depId: string) => {
    if (!task) return;

    const newDeps = task.dependencies.filter((id) => id !== depId);

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependencies: newDeps }),
      });

      if (!response.ok) throw new Error('Failed to remove dependency');

      await refetch();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Task not found</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <Link
              href={`/projects/${task.projectId}`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to project
            </Link>
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
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {/* Task Details */}
        <TaskDetailsSection
          task={task}
          isEditingStatus={isEditingStatus}
          setIsEditingStatus={setIsEditingStatus}
          handleStatusChange={handleStatusChange}
        />

        {/* Dependencies */}
        <DependenciesSection
          task={task}
          allProjectTasks={allProjectTasks}
          isEditingDependencies={isEditingDependencies}
          setIsEditingDependencies={setIsEditingDependencies}
          selectedDependencies={selectedDependencies}
          setSelectedDependencies={setSelectedDependencies}
          handleToggleDependency={handleToggleDependency}
          handleSaveDependencies={handleSaveDependencies}
          handleRemoveDependency={handleRemoveDependency}
        />

        {/* Comments */}
        <CommentsSection
          comments={comments}
          author={author}
          setAuthor={setAuthor}
          commentContent={commentContent}
          setCommentContent={setCommentContent}
          submitting={submitting}
          handleSubmitComment={handleSubmitComment}
        />
      </div>
    </div>
  );
}
