'use client';

import { useEffect, useRef, useState } from 'react';
import { SSEMessage } from '@/types/api';

export function useSSE(projectId: string | null, onMessage: (message: SSEMessage) => void) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!projectId) return;

    let shouldReconnect = true;

    const connect = () => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`/api/projects/${projectId}/events`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SSE] Connected to project:', projectId);
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);

          if (message.type === 'HEARTBEAT') {
            console.log('[SSE] Heartbeat received');
            return;
          }

          onMessage(message);
        } catch (error) {
          console.error('[SSE] Error parsing message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        setConnected(false);
        eventSource.close();

        // Reconnect with exponential backoff
        if (shouldReconnect) {
          const delay = 1000 + Math.random() * 2000; // 1-3 seconds
          console.log(`[SSE] Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
    };
  }, [projectId, onMessage]);

  return { connected };
}
