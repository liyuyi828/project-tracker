import { nanoid } from 'nanoid';
import { query, queryOne, transaction } from '../client';
import { Project } from '@/types/domain';
import { EventStore } from '@/lib/events/event-store';
import { Projector } from '@/lib/events/projector';

export class ProjectRepository {
  static create(data: {
    name: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Project {
    return transaction(() => {
      const now = new Date().toISOString();
      const project: Project = {
        id: nanoid(),
        name: data.name,
        description: data.description,
        metadata: data.metadata,
        createdAt: now,
        updatedAt: now,
      };

      // Append event
      const event = EventStore.append({
        aggregateType: 'project',
        aggregateId: project.id,
        eventType: 'PROJECT_CREATED',
        payload: project,
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(
        project.id,
        'CREATED',
        'project',
        project.id,
        project
      );

      return project;
    });
  }

  static findById(id: string): Project | null {
    const row = queryOne<{
      id: string;
      name: string;
      description: string | null;
      metadata: string | null;
      created_at: string;
      updated_at: string;
    }>(`SELECT * FROM projects WHERE id = ?`, [id]);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static findAll(): Project[] {
    const rows = query<{
      id: string;
      name: string;
      description: string | null;
      metadata: string | null;
      created_at: string;
      updated_at: string;
    }>(`SELECT * FROM projects ORDER BY created_at DESC`);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static update(
    id: string,
    data: {
      name?: string;
      description?: string;
      metadata?: Record<string, any>;
    }
  ): Project | null {
    return transaction(() => {
      const existing = this.findById(id);
      if (!existing) return null;

      const now = new Date().toISOString();
      const updates = {
        ...data,
        updatedAt: now,
      };

      // Append event
      const event = EventStore.append({
        aggregateType: 'project',
        aggregateId: id,
        eventType: 'PROJECT_UPDATED',
        payload: { id, ...updates },
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(id, 'UPDATED', 'project', id, updates);

      return this.findById(id);
    });
  }

  static delete(id: string): boolean {
    return transaction(() => {
      const existing = this.findById(id);
      if (!existing) return false;

      // Append event
      const event = EventStore.append({
        aggregateType: 'project',
        aggregateId: id,
        eventType: 'PROJECT_DELETED',
        payload: { id },
      });

      // Update materialized view
      Projector.project(event);

      // Add to change feed
      Projector.addToChangeFeed(id, 'DELETED', 'project', id, { id });

      return true;
    });
  }
}
