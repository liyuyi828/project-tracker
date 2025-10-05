'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, Task } from '@/types/domain';
import { ProjectResponse } from '@/types/api';

export function useProjects() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (data: { name: string; description?: string }) => {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create project');
        await fetchProjects();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [fetchProjects]
  );

  return { projects, loading, error, refetch: fetchProjects, createProject };
}

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<(Project & { tasks: Task[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      if (!project) return;

      setProject({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        ),
      });
    },
    [project]
  );

  const addTask = useCallback(
    (task: Task) => {
      if (!project) return;

      setProject({
        ...project,
        tasks: [...project.tasks, task],
      });
    },
    [project]
  );

  const removeTask = useCallback(
    (taskId: string) => {
      if (!project) return;

      setProject({
        ...project,
        tasks: project.tasks.filter((task) => task.id !== taskId),
      });
    },
    [project]
  );

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
    updateTask,
    addTask,
    removeTask,
  };
}
