import { SSEMessage } from '@/types/api';

type SSEClient = {
  id: string;
  projectId: string;
  controller: ReadableStreamDefaultController;
  lastPing: number;
};

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Register a new SSE client
   */
  registerClient(
    clientId: string,
    projectId: string,
    controller: ReadableStreamDefaultController
  ): void {
    this.clients.set(clientId, {
      id: clientId,
      projectId,
      controller,
      lastPing: Date.now(),
    });

    console.log(
      `[SSE] Client ${clientId} registered for project ${projectId}. Total clients: ${this.clients.size}`
    );
  }

  /**
   * Unregister a client
   */
  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(
        `[SSE] Client ${clientId} unregistered. Total clients: ${this.clients.size}`
      );
    }
  }

  /**
   * Broadcast a message to all clients subscribed to a project
   */
  broadcast(projectId: string, message: SSEMessage): void {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(message)}\n\n`;
    const encoded = encoder.encode(data);

    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.projectId === projectId) {
        try {
          client.controller.enqueue(encoded);
          sentCount++;
        } catch (error) {
          console.error(`[SSE] Error sending to client ${clientId}:`, error);
          this.unregisterClient(clientId);
        }
      }
    }

    console.log(
      `[SSE] Broadcast message to ${sentCount} clients for project ${projectId}`
    );
  }

  /**
   * Send heartbeat to all clients
   */
  private sendHeartbeat(): void {
    const encoder = new TextEncoder();
    const now = Date.now();
    const heartbeat: SSEMessage = {
      type: 'HEARTBEAT',
      projectId: '',
      entityId: '',
      timestamp: new Date().toISOString(),
    };
    const data = `data: ${JSON.stringify(heartbeat)}\n\n`;
    const encoded = encoder.encode(data);

    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.controller.enqueue(encoded);
        client.lastPing = now;
      } catch (error) {
        console.error(
          `[SSE] Error sending heartbeat to client ${clientId}:`,
          error
        );
        this.unregisterClient(clientId);
      }
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat interval
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get client count for a project
   */
  getClientCount(projectId: string): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.projectId === projectId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get total client count
   */
  getTotalClientCount(): number {
    return this.clients.size;
  }
}

// Singleton instance
export const sseManager = new SSEManager();
