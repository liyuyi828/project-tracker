import { Project, Task, Comment } from './domain';

export type AggregateType = 'project' | 'task' | 'comment';

export type EventType =
  // Project events
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  // Task events
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_MOVED'
  | 'TASK_ASSIGNED'
  | 'TASK_DEPENDENCY_ADDED'
  | 'TASK_DEPENDENCY_REMOVED'
  | 'TASK_DELETED'
  // Comment events
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_DELETED';

export interface BaseEvent {
  id: string;
  aggregateType: AggregateType;
  aggregateId: string;
  eventType: EventType;
  timestamp: string;
  version: number;
}

export interface ProjectCreatedEvent extends BaseEvent {
  eventType: 'PROJECT_CREATED';
  payload: Project;
}

export interface ProjectUpdatedEvent extends BaseEvent {
  eventType: 'PROJECT_UPDATED';
  payload: Partial<Project>;
}

export interface ProjectDeletedEvent extends BaseEvent {
  eventType: 'PROJECT_DELETED';
  payload: { id: string };
}

export interface TaskCreatedEvent extends BaseEvent {
  eventType: 'TASK_CREATED';
  payload: Task;
}

export interface TaskUpdatedEvent extends BaseEvent {
  eventType: 'TASK_UPDATED';
  payload: Partial<Task> & { id: string };
}

export interface TaskDeletedEvent extends BaseEvent {
  eventType: 'TASK_DELETED';
  payload: { id: string; projectId: string };
}

export interface CommentAddedEvent extends BaseEvent {
  eventType: 'COMMENT_ADDED';
  payload: Comment;
}

export interface CommentDeletedEvent extends BaseEvent {
  eventType: 'COMMENT_DELETED';
  payload: { id: string; taskId: string };
}

export type DomainEvent =
  | ProjectCreatedEvent
  | ProjectUpdatedEvent
  | ProjectDeletedEvent
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskDeletedEvent
  | CommentAddedEvent
  | CommentDeletedEvent;

// Change Feed Types
export type ChangeType = 'CREATED' | 'UPDATED' | 'DELETED';
export type EntityType = 'project' | 'task' | 'comment';

export interface ChangeFeedEntry {
  id: string;
  projectId: string;
  changeType: ChangeType;
  entityType: EntityType;
  entityId: string;
  delta: Record<string, any>;
  timestamp: string;
  version: number;
}
