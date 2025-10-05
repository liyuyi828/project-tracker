import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/lib/db/repositories/project';
import { TaskRepository } from '@/lib/db/repositories/task';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = ProjectRepository.findAll();

    // Add task count to each project
    const projectsWithCount = projects.map((project) => {
      const tasks = TaskRepository.findByProjectId(project.id);
      return {
        ...project,
        taskCount: tasks.length,
      };
    });

    return NextResponse.json(projectsWithCount);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = ProjectRepository.create({
      name: body.name,
      description: body.description,
      metadata: body.metadata,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create project' },
      { status: 500 }
    );
  }
}
