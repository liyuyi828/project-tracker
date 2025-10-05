import { nanoid } from 'nanoid';
import { query, queryOne, transaction } from '../client';
import { Comment } from '@/types/domain';
import { EventStore } from '@/lib/events/event-store';
import { Projector } from '@/lib/events/projector';

export class CommentRepository {
  static create(data: {
    taskId: string;
    content: string;
    author: string;
  }): Comment {
    return transaction(() => {
      const now = new Date().toISOString();

      const comment: Comment = {
        id: nanoid(),
        taskId: data.taskId,
        content: data.content,
        author: data.author,
        timestamp: now,
      };

      // Get project ID for this task
      const task = queryOne<{ project_id: string }>(
        `SELECT project_id FROM tasks WHERE id = ?`,
        [data.taskId]
      );

      if (!task) {
        throw new Error(`Task ${data.taskId} not found`);
      }

      // Append event
      const event = EventStore.append({
        aggregateType: 'comment',
        aggregateId: comment.id,
        eventType: 'COMMENT_ADDED',
        payload: comment,
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(
        task.project_id,
        'CREATED',
        'comment',
        comment.id,
        comment
      );

      return comment;
    });
  }

  static findById(id: string): Comment | null {
    const row = queryOne<{
      id: string;
      task_id: string;
      content: string;
      author: string;
      timestamp: string;
    }>(`SELECT * FROM comments WHERE id = ?`, [id]);

    if (!row) return null;

    return {
      id: row.id,
      taskId: row.task_id,
      content: row.content,
      author: row.author,
      timestamp: row.timestamp,
    };
  }

  static findByTaskId(taskId: string): Comment[] {
    const rows = query<{
      id: string;
      task_id: string;
      content: string;
      author: string;
      timestamp: string;
    }>(
      `SELECT * FROM comments WHERE task_id = ? ORDER BY timestamp ASC`,
      [taskId]
    );

    return rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      content: row.content,
      author: row.author,
      timestamp: row.timestamp,
    }));
  }

  static delete(id: string): boolean {
    return transaction(() => {
      const existing = this.findById(id);
      if (!existing) return false;

      // Get project ID for this task
      const task = queryOne<{ project_id: string }>(
        `SELECT project_id FROM tasks WHERE id = ?`,
        [existing.taskId]
      );

      if (!task) {
        throw new Error(`Task ${existing.taskId} not found`);
      }

      // Append event
      const event = EventStore.append({
        aggregateType: 'comment',
        aggregateId: id,
        eventType: 'COMMENT_DELETED',
        payload: { id, taskId: existing.taskId },
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(
        task.project_id,
        'DELETED',
        'comment',
        id,
        { id }
      );

      return true;
    });
  }
}
