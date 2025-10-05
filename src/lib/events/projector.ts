import { execute, transaction } from '../db/client';
import { DomainEvent } from '@/types/events';
import { nanoid } from 'nanoid';

/**
 * Projector updates materialized views based on events
 */
export class Projector {
  static project(event: DomainEvent): void {
    switch (event.eventType) {
      case 'PROJECT_CREATED':
        this.projectProjectCreated(event);
        break;
      case 'PROJECT_UPDATED':
        this.projectProjectUpdated(event);
        break;
      case 'PROJECT_DELETED':
        this.projectProjectDeleted(event);
        break;
      case 'TASK_CREATED':
        this.projectTaskCreated(event);
        break;
      case 'TASK_UPDATED':
        this.projectTaskUpdated(event);
        break;
      case 'TASK_DELETED':
        this.projectTaskDeleted(event);
        break;
      case 'COMMENT_ADDED':
        this.projectCommentAdded(event);
        break;
      case 'COMMENT_DELETED':
        this.projectCommentDeleted(event);
        break;
      default:
        console.warn('Unknown event type:', event.eventType);
    }
  }

  private static projectProjectCreated(event: DomainEvent): void {
    const payload = event.payload;
    execute(
      `INSERT INTO projects (id, name, description, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.id,
        payload.name,
        payload.description || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
        payload.createdAt,
        payload.updatedAt,
      ]
    );
  }

  private static projectProjectUpdated(event: DomainEvent): void {
    const payload = event.payload;
    const updates: string[] = [];
    const values: any[] = [];

    if (payload.name !== undefined) {
      updates.push('name = ?');
      values.push(payload.name);
    }
    if (payload.description !== undefined) {
      updates.push('description = ?');
      values.push(payload.description);
    }
    if (payload.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(payload.metadata));
    }
    if (payload.updatedAt !== undefined) {
      updates.push('updated_at = ?');
      values.push(payload.updatedAt);
    }

    if (updates.length > 0) {
      values.push(event.aggregateId);
      execute(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  private static projectProjectDeleted(event: DomainEvent): void {
    execute(`DELETE FROM projects WHERE id = ?`, [event.aggregateId]);
  }

  private static projectTaskCreated(event: DomainEvent): void {
    const task = event.payload;
    execute(
      `INSERT INTO tasks (
        id, project_id, title, status, assigned_to,
        priority, description, tags, custom_fields,
        dependencies, position, created_at, updated_at, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.projectId,
        task.title,
        task.status,
        JSON.stringify(task.assignedTo),
        task.configuration.priority,
        task.configuration.description,
        JSON.stringify(task.configuration.tags),
        JSON.stringify(task.configuration.customFields),
        JSON.stringify(task.dependencies),
        task.position,
        task.createdAt,
        task.updatedAt,
        1,
      ]
    );
  }

  private static projectTaskUpdated(event: DomainEvent): void {
    const payload = event.payload;
    const updates: string[] = [];
    const values: any[] = [];

    if (payload.title !== undefined) {
      updates.push('title = ?');
      values.push(payload.title);
    }
    if (payload.status !== undefined) {
      updates.push('status = ?');
      values.push(payload.status);
    }
    if (payload.assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      values.push(JSON.stringify(payload.assignedTo));
    }
    if (payload.configuration !== undefined) {
      if (payload.configuration.priority !== undefined) {
        updates.push('priority = ?');
        values.push(payload.configuration.priority);
      }
      if (payload.configuration.description !== undefined) {
        updates.push('description = ?');
        values.push(payload.configuration.description);
      }
      if (payload.configuration.tags !== undefined) {
        updates.push('tags = ?');
        values.push(JSON.stringify(payload.configuration.tags));
      }
      if (payload.configuration.customFields !== undefined) {
        updates.push('custom_fields = ?');
        values.push(JSON.stringify(payload.configuration.customFields));
      }
    }
    if (payload.dependencies !== undefined) {
      updates.push('dependencies = ?');
      values.push(JSON.stringify(payload.dependencies));
    }
    if (payload.position !== undefined) {
      updates.push('position = ?');
      values.push(payload.position);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    updates.push('version = version + 1');

    if (updates.length > 0) {
      values.push(payload.id);
      execute(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  private static projectTaskDeleted(event: DomainEvent): void {
    execute(`DELETE FROM tasks WHERE id = ?`, [event.payload.id]);
  }

  private static projectCommentAdded(event: DomainEvent): void {
    const comment = event.payload;
    execute(
      `INSERT INTO comments (id, task_id, content, author, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [comment.id, comment.taskId, comment.content, comment.author, comment.timestamp]
    );
  }

  private static projectCommentDeleted(event: DomainEvent): void {
    execute(`DELETE FROM comments WHERE id = ?`, [event.payload.id]);
  }

  /**
   * Add entry to change feed for real-time sync
   */
  static addToChangeFeed(
    projectId: string,
    changeType: 'CREATED' | 'UPDATED' | 'DELETED',
    entityType: 'project' | 'task' | 'comment',
    entityId: string,
    delta: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();

    execute(
      `INSERT INTO change_feed (id, project_id, change_type, entity_type, entity_id, delta, timestamp, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        nanoid(),
        projectId,
        changeType,
        entityType,
        entityId,
        JSON.stringify(delta),
        timestamp,
      ]
    );
  }
}
