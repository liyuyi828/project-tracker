import { Project, Task, Comment } from './domain';

// Request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  assignedTo?: string[];
  configuration?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    description?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  dependencies?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  assignedTo?: string[];
  configuration?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    description?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  dependencies?: string[];
  position?: number;
}

export interface AddCommentRequest {
  content: string;
  author: string;
}

// Response types
export interface ProjectResponse extends Project {
  taskCount?: number;
}

export interface ProjectWithTasksResponse extends Project {
  tasks: Task[];
}

export interface TaskResponse extends Task {}

export interface CommentResponse extends Comment {}

// Paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// API Error
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// SSE Message types
export type SSEMessageType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'PROJECT_UPDATED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED'
  | 'HEARTBEAT';

export interface SSEMessage {
  type: SSEMessageType;
  projectId: string;
  entityId: string;
  delta?: Record<string, any>;
  version?: number;
  timestamp: string;
}
