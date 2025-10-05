import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { sseManager } from '@/lib/sse/manager';

// GET /api/projects/:id/events - SSE endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const clientId = nanoid();

  const stream = new ReadableStream({
    start(controller) {
      // Register client
      sseManager.registerClient(clientId, projectId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      const connectMsg = `data: ${JSON.stringify({
        type: 'CONNECTED',
        projectId,
        clientId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));
    },
    cancel() {
      // Cleanup when client disconnects
      sseManager.unregisterClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
