import { NextRequest, NextResponse } from 'next/server';
import { TaskRepository } from '@/lib/db/repositories/task';
import { ProjectRepository } from '@/lib/db/repositories/project';
import { SSEPublisher } from '@/lib/sse/publisher';

// POST /api/projects/:id/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Verify project exists
    const project = ProjectRepository.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found' },
        { status: 404 }
      );
    }

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Task title is required' },
        { status: 400 }
      );
    }

    const task = TaskRepository.create({
      projectId,
      title: body.title,
      status: body.status,
      assignedTo: body.assignedTo,
      configuration: body.configuration,
      dependencies: body.dependencies,
    });

    // Notify clients via SSE
    SSEPublisher.notifyTaskCreated(projectId, task);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create task' },
      { status: 500 }
    );
  }
}
