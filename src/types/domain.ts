export interface Project {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskConfiguration {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignedTo: string[];
  configuration: TaskConfiguration;
  dependencies: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  timestamp: string;
}
