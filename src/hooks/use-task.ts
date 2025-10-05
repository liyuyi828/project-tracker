'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, Comment } from '@/types/domain';

export function useTask(taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [allProjectTasks, setAllProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setComments([]);
      setAllProjectTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch task
      const taskResponse = await fetch(`/api/tasks/${taskId}`);
      if (!taskResponse.ok) throw new Error('Failed to fetch task');
      const taskData = await taskResponse.json();
      setTask(taskData);

      // Fetch comments
      const commentsResponse = await fetch(`/api/tasks/${taskId}/comments`);
      if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
      const commentsData = await commentsResponse.json();
      setComments(commentsData);

      // Fetch all project tasks for dependency information
      const projectResponse = await fetch(`/api/projects/${taskData.projectId}`);
      if (!projectResponse.ok) throw new Error('Failed to fetch project tasks');
      const projectData = await projectResponse.json();
      setAllProjectTasks(projectData.tasks || []);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const addComment = useCallback((comment: Comment) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  const removeComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  return {
    task,
    comments,
    allProjectTasks,
    loading,
    error,
    refetch: fetchTask,
    addComment,
    removeComment,
  };
}
