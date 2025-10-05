# Project Tracker

A real-time collaborative project management system built with Next.js, TypeScript, Tailwind CSS, and SQLite with Server-Sent Events (SSE) for live updates.

## Getting Started

### Prerequisites

- Node.js 24+ (for experimental SQLite support)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5566](http://localhost:5566) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Features

✅ **Core Functionality**
- Create and manage multiple projects
- Add, update, and delete tasks within projects
- Task detail views with full information display
- Task dependencies with cycle detection
- Comment threads on tasks
- Real-time synchronization across multiple clients
- Event sourcing architecture with append-only event log
- Delta-based updates (efficient for large payloads 2MB+)

✅ **Technical Highlights**
- **Event Sourcing**: Append-only event log in SQLite
- **Materialized Views**: Fast queries from current state
- **Server-Sent Events (SSE)**: Real-time updates to all connected clients
- **Delta-based Sync**: Only transmit changed fields, not entire objects
- **Dependency Validation**: DFS-based cycle detection for task dependencies
- **Type-safe API**: Shared TypeScript contracts between frontend and backend
- **Optimistic UI**: Immediate feedback with automatic rollback on errors
- **Component Architecture**: Reusable UI components and internal component extraction

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js SQLite (experimental)
- **Database**: SQLite with WAL mode
- **Real-time**: Server-Sent Events (SSE)

## Architecture

### Database Schema

- **events**: Append-only event log
- **projects**: Current project state
- **tasks**: Current task state
- **comments**: Task comments
- **change_feed**: Track changes for real-time sync

### Real-Time Synchronization

1. Client sends mutation (POST/PATCH/DELETE)
2. Server validates and appends to event store
3. Projector updates materialized views
4. Change feed entry created
5. SSE broadcasts delta to all connected clients
6. Clients apply delta to local state

## API Endpoints

### Projects

- `GET /api/projects` - List all projects (with task counts)
- `POST /api/projects` - Create a new project
  - Body: `{ name: string, description?: string, metadata?: object }`
- `GET /api/projects/:id` - Get project with all tasks
- `PATCH /api/projects/:id` - Update project
  - Body: `{ name?: string, description?: string, metadata?: object }`
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/events` - SSE stream for real-time updates

### Tasks

- `POST /api/projects/:id/tasks` - Create task in project
  - Body: `{ title: string, status?: string, assignedTo?: string[], configuration?: object, dependencies?: string[] }`
- `GET /api/tasks/:id` - Get single task
- `PATCH /api/tasks/:id` - Update task (status, dependencies, title, etc.)
  - Body: `{ title?: string, status?: string, assignedTo?: string[], configuration?: object, dependencies?: string[], position?: number }`
- `DELETE /api/tasks/:id` - Delete task

### Comments

- `GET /api/tasks/:id/comments` - List all comments for a task
- `POST /api/tasks/:id/comments` - Add comment to task
  - Body: `{ content: string, author: string }`

## Real-Time Updates

The app uses Server-Sent Events (SSE) for real-time synchronization:

- Each project has its own SSE channel at `/api/projects/:id/events`
- Changes are broadcast as delta objects (not full state)
- Automatic reconnection with exponential backoff
- Heartbeat every 30 seconds to keep connections alive

### SSE Message Types

All connected clients receive real-time updates via SSE:

- `CONNECTED` - Initial connection confirmation
- `TASK_CREATED` - New task added (includes full task object in delta)
- `TASK_UPDATED` - Task modified (includes only changed fields in delta)
- `TASK_DELETED` - Task removed
- `PROJECT_UPDATED` - Project modified (includes only changed fields in delta)
- `COMMENT_ADDED` - New comment added (includes full comment object in delta)
- `COMMENT_DELETED` - Comment removed

### SSE Message Format

```typescript
{
  type: 'TASK_UPDATED',
  projectId: 'proj-123',
  entityId: 'task-456',
  delta: { status: 'done' },        // Only changed fields
  version?: 42,                      // Optional version number
  timestamp: '2025-10-04T...'
}
```

## Performance Optimization

### Efficient Updates

- **Delta-based sync**: Only changed fields are transmitted
- **Field-level tracking**: Know exactly what changed
- **Compression**: gzip for SSE streams (when supported)
- **Lazy loading**: Paginate tasks, load comments on demand

### Handling Large Payloads

For projects with 2MB+ data:

1. Never send full project state
2. Use delta updates (typically < 5KB)
3. Lazy load tasks and comments
4. Client-side caching with React hooks

## Event Sourcing Benefits

1. **Complete audit trail**: Every change is recorded
2. **Time travel**: Replay events to any point
3. **Debugging**: See exact sequence of operations
4. **Analytics**: Rich event data for insights

## Key Features in Detail

### Task Dependencies

Tasks can depend on other tasks within the same project. The system includes:
- **Cycle Detection**: DFS algorithm prevents circular dependencies
- **Visual Feedback**: UI warns when selections would create cycles
- **Dependency Management**: Add/remove dependencies from task detail page
- **Dependency Grid**: View all dependencies on task detail page

### Real-time Comments

- Add comments to tasks with author attribution
- Real-time updates via SSE - see new comments instantly
- Comments appear on task detail page in chronological order
- Avatar initials and timestamps for each comment

### Status Management

- Edit task status directly from task detail page
- Visual status badges with color coding (Todo, In Progress, Review, Done)
- Real-time status updates across all connected clients

### Code Organization

- **Reusable Components**: StatusBadge, PriorityBadge, DependencySelector, DependencyCard
- **Internal Components**: Page-specific components extracted for cleaner render functions
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Modular Architecture**: Clear separation between presentation, data, and business logic

## Testing

Open multiple browser windows to see real-time synchronization in action:

1. Create a project in window 1
2. Open the same project in window 2
3. Create/update tasks in either window
4. Watch changes appear instantly in both windows
5. Open a task detail page in both windows
6. Add comments or change status/dependencies
7. See updates reflected immediately across all windows

### Testing Dependency Cycle Detection

1. Create tasks A, B, and C
2. Make A depend on B
3. Make B depend on C
4. Try to make C depend on A - system will warn and prevent the cycle

## License

MIT
