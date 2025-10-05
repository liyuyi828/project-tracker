import { nanoid } from 'nanoid';
import { query, queryOne, transaction } from '../client';
import { Task, TaskConfiguration } from '@/types/domain';
import { EventStore } from '@/lib/events/event-store';
import { Projector } from '@/lib/events/projector';

export class TaskRepository {
  static create(data: {
    projectId: string;
    title: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    assignedTo?: string[];
    configuration?: Partial<TaskConfiguration>;
    dependencies?: string[];
  }): Task {
    return transaction(() => {
      const now = new Date().toISOString();

      // Get max position for this project
      const maxPos = queryOne<{ max_pos: number }>(
        `SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE project_id = ?`,
        [data.projectId]
      );

      const task: Task = {
        id: nanoid(),
        projectId: data.projectId,
        title: data.title,
        status: data.status || 'todo',
        assignedTo: data.assignedTo || [],
        configuration: {
          priority: data.configuration?.priority || 'medium',
          description: data.configuration?.description || '',
          tags: data.configuration?.tags || [],
          customFields: data.configuration?.customFields || {},
        },
        dependencies: data.dependencies || [],
        position: (maxPos?.max_pos ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      };

      // Append event
      const event = EventStore.append({
        aggregateType: 'task',
        aggregateId: task.id,
        eventType: 'TASK_CREATED',
        payload: task,
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(
        task.projectId,
        'CREATED',
        'task',
        task.id,
        task
      );

      return task;
    });
  }

  static findById(id: string): Task | null {
    const row = queryOne<{
      id: string;
      project_id: string;
      title: string;
      status: string;
      assigned_to: string;
      priority: string;
      description: string;
      tags: string;
      custom_fields: string;
      dependencies: string;
      position: number;
      created_at: string;
      updated_at: string;
    }>(`SELECT * FROM tasks WHERE id = ?`, [id]);

    if (!row) return null;

    return this.mapRowToTask(row);
  }

  static findByProjectId(projectId: string): Task[] {
    const rows = query<{
      id: string;
      project_id: string;
      title: string;
      status: string;
      assigned_to: string;
      priority: string;
      description: string;
      tags: string;
      custom_fields: string;
      dependencies: string;
      position: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC`,
      [projectId]
    );

    return rows.map((row) => this.mapRowToTask(row));
  }

  static update(
    id: string,
    data: {
      title?: string;
      status?: 'todo' | 'in_progress' | 'review' | 'done';
      assignedTo?: string[];
      configuration?: Partial<TaskConfiguration>;
      dependencies?: string[];
      position?: number;
    }
  ): Task | null {
    return transaction(() => {
      const existing = this.findById(id);
      if (!existing) return null;

      const updates: any = { id };

      if (data.title !== undefined) updates.title = data.title;
      if (data.status !== undefined) updates.status = data.status;
      if (data.assignedTo !== undefined) updates.assignedTo = data.assignedTo;
      if (data.dependencies !== undefined)
        updates.dependencies = data.dependencies;
      if (data.position !== undefined) updates.position = data.position;

      if (data.configuration !== undefined) {
        updates.configuration = {
          priority:
            data.configuration.priority || existing.configuration.priority,
          description:
            data.configuration.description ||
            existing.configuration.description,
          tags: data.configuration.tags || existing.configuration.tags,
          customFields:
            data.configuration.customFields ||
            existing.configuration.customFields,
        };
      }

      // Append event
      const event = EventStore.append({
        aggregateType: 'task',
        aggregateId: id,
        eventType: 'TASK_UPDATED',
        payload: updates,
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(
        existing.projectId,
        'UPDATED',
        'task',
        id,
        updates
      );

      return this.findById(id);
    });
  }

  static delete(id: string): boolean {
    return transaction(() => {
      const existing = this.findById(id);
      if (!existing) return false;

      // Append event
      const event = EventStore.append({
        aggregateType: 'task',
        aggregateId: id,
        eventType: 'TASK_DELETED',
        payload: { id, projectId: existing.projectId },
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(
        existing.projectId,
        'DELETED',
        'task',
        id,
        { id }
      );

      return true;
    });
  }

  private static mapRowToTask(row: {
    id: string;
    project_id: string;
    title: string;
    status: string;
    assigned_to: string;
    priority: string;
    description: string;
    tags: string;
    custom_fields: string;
    dependencies: string;
    position: number;
    created_at: string;
    updated_at: string;
  }): Task {
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      status: row.status as Task['status'],
      assignedTo: JSON.parse(row.assigned_to),
      configuration: {
        priority: row.priority as TaskConfiguration['priority'],
        description: row.description,
        tags: JSON.parse(row.tags),
        customFields: JSON.parse(row.custom_fields),
      },
      dependencies: JSON.parse(row.dependencies),
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
