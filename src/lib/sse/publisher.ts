import { sseManager } from './manager';
import { SSEMessage, SSEMessageType } from '@/types/api';

export class SSEPublisher {
  /**
   * Publish a change notification to all clients subscribed to a project
   */
  static publish(
    projectId: string,
    type: SSEMessageType,
    entityId: string,
    delta?: Record<string, any>,
    version?: number
  ): void {
    const message: SSEMessage = {
      type,
      projectId,
      entityId,
      delta,
      version,
      timestamp: new Date().toISOString(),
    };

    sseManager.broadcast(projectId, message);
  }

  /**
   * Notify task created
   */
  static notifyTaskCreated(projectId: string, task: any): void {
    this.publish(projectId, 'TASK_CREATED', task.id, task);
  }

  /**
   * Notify task updated
   */
  static notifyTaskUpdated(
    projectId: string,
    taskId: string,
    delta: Record<string, any>,
    version?: number
  ): void {
    this.publish(projectId, 'TASK_UPDATED', taskId, delta, version);
  }

  /**
   * Notify task deleted
   */
  static notifyTaskDeleted(projectId: string, taskId: string): void {
    this.publish(projectId, 'TASK_DELETED', taskId);
  }

  /**
   * Notify project updated
   */
  static notifyProjectUpdated(
    projectId: string,
    delta: Record<string, any>
  ): void {
    this.publish(projectId, 'PROJECT_UPDATED', projectId, delta);
  }

  /**
   * Notify comment added
   */
  static notifyCommentAdded(projectId: string, comment: any): void {
    this.publish(projectId, 'COMMENT_ADDED', comment.id, comment);
  }

  /**
   * Notify comment deleted
   */
  static notifyCommentDeleted(projectId: string, commentId: string): void {
    this.publish(projectId, 'COMMENT_DELETED', commentId);
  }
}
