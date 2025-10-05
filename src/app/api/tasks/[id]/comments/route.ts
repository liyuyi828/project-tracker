import { NextRequest, NextResponse } from 'next/server';
import { CommentRepository } from '@/lib/db/repositories/comment';
import { TaskRepository } from '@/lib/db/repositories/task';
import { SSEPublisher } from '@/lib/sse/publisher';

// GET /api/tasks/:id/comments - Get all comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    // Verify task exists
    const task = TaskRepository.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Task not found' },
        { status: 404 }
      );
    }

    const comments = CommentRepository.findByTaskId(taskId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/:id/comments - Add a comment to a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();

    // Verify task exists
    const task = TaskRepository.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Task not found' },
        { status: 404 }
      );
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (!body.author || typeof body.author !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Comment author is required' },
        { status: 400 }
      );
    }

    const comment = CommentRepository.create({
      taskId,
      content: body.content,
      author: body.author,
    });

    // Notify clients via SSE
    SSEPublisher.notifyCommentAdded(task.projectId, comment);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
