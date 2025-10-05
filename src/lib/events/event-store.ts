import { nanoid } from 'nanoid';
import { execute, query } from '../db/client';
import { DomainEvent, AggregateType, EventType } from '@/types/events';

export class EventStore {
  /**
   * Append an event to the event store
   * Note: Should be called within a transaction
   */
  static append(event: Omit<DomainEvent, 'id' | 'timestamp' | 'version'>): DomainEvent {
    const timestamp = new Date().toISOString();

    // Get current version for this aggregate
    const result = query<{ max_version: number }>(
      `SELECT COALESCE(MAX(version), 0) as max_version
       FROM events
       WHERE aggregate_type = ? AND aggregate_id = ?`,
      [event.aggregateType, event.aggregateId]
    );

    const version = (result[0]?.max_version || 0) + 1;

    const fullEvent: DomainEvent = {
      ...event,
      id: nanoid(),
      timestamp,
      version,
    } as DomainEvent;

    // Insert into event store
    execute(
      `INSERT INTO events (id, aggregate_type, aggregate_id, event_type, payload, timestamp, version)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fullEvent.id,
        fullEvent.aggregateType,
        fullEvent.aggregateId,
        fullEvent.eventType,
        JSON.stringify(fullEvent.payload),
        fullEvent.timestamp,
        fullEvent.version,
      ]
    );

    return fullEvent;
  }

  /**
   * Get all events for a specific aggregate
   */
  static getEventsForAggregate(
    aggregateType: AggregateType,
    aggregateId: string
  ): DomainEvent[] {
    const rows = query<{
      id: string;
      aggregate_type: string;
      aggregate_id: string;
      event_type: string;
      payload: string;
      timestamp: string;
      version: number;
    }>(
      `SELECT * FROM events
       WHERE aggregate_type = ? AND aggregate_id = ?
       ORDER BY version ASC`,
      [aggregateType, aggregateId]
    );

    return rows.map((row) => ({
      id: row.id,
      aggregateType: row.aggregate_type as AggregateType,
      aggregateId: row.aggregate_id,
      eventType: row.event_type as EventType,
      payload: JSON.parse(row.payload),
      timestamp: row.timestamp,
      version: row.version,
    })) as DomainEvent[];
  }

  /**
   * Get events after a specific timestamp (for catching up)
   */
  static getEventsSince(projectId: string, since: string): DomainEvent[] {
    const rows = query<{
      id: string;
      aggregate_type: string;
      aggregate_id: string;
      event_type: string;
      payload: string;
      timestamp: string;
      version: number;
    }>(
      `SELECT e.* FROM events e
       LEFT JOIN tasks t ON e.aggregate_id = t.id AND e.aggregate_type = 'task'
       LEFT JOIN comments c ON e.aggregate_id = c.id AND e.aggregate_type = 'comment'
       LEFT JOIN tasks ct ON c.task_id = ct.id
       WHERE (
         (e.aggregate_type = 'project' AND e.aggregate_id = ?)
         OR (e.aggregate_type = 'task' AND t.project_id = ?)
         OR (e.aggregate_type = 'comment' AND ct.project_id = ?)
       )
       AND e.timestamp > ?
       ORDER BY e.timestamp ASC`,
      [projectId, projectId, projectId, since]
    );

    return rows.map((row) => ({
      id: row.id,
      aggregateType: row.aggregate_type as AggregateType,
      aggregateId: row.aggregate_id,
      eventType: row.event_type as EventType,
      payload: JSON.parse(row.payload),
      timestamp: row.timestamp,
      version: row.version,
    })) as DomainEvent[];
  }

  /**
   * Get all events (primarily for debugging)
   */
  static getAllEvents(): DomainEvent[] {
    const rows = query<{
      id: string;
      aggregate_type: string;
      aggregate_id: string;
      event_type: string;
      payload: string;
      timestamp: string;
      version: number;
    }>(`SELECT * FROM events ORDER BY timestamp ASC`);

    return rows.map((row) => ({
      id: row.id,
      aggregateType: row.aggregate_type as AggregateType,
      aggregateId: row.aggregate_id,
      eventType: row.event_type as EventType,
      payload: JSON.parse(row.payload),
      timestamp: row.timestamp,
      version: row.version,
    })) as DomainEvent[];
  }
}
