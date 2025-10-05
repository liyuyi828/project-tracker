import { NextRequest, NextResponse } from 'next/server';
import { TaskRepository } from '@/lib/db/repositories/task';
import { SSEPublisher } from '@/lib/sse/publisher';

// GET /api/tasks/:id - Get a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = TaskRepository.findById(id);

    if (!task) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/:id - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingTask = TaskRepository.findById(id);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Task not found' },
        { status: 404 }
      );
    }

    const task = TaskRepository.update(id, {
      title: body.title,
      status: body.status,
      assignedTo: body.assignedTo,
      configuration: body.configuration,
      dependencies: body.dependencies,
      position: body.position,
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Task not found' },
        { status: 404 }
      );
    }

    // Notify clients via SSE
    SSEPublisher.notifyTaskUpdated(task.projectId, id, body);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/:id - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingTask = TaskRepository.findById(id);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Task not found' },
        { status: 404 }
      );
    }

    const success = TaskRepository.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Task not found' },
        { status: 404 }
      );
    }

    // Notify clients via SSE
    SSEPublisher.notifyTaskDeleted(existingTask.projectId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
