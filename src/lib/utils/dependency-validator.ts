import { Task } from '@/types/domain';

/**
 * Check if adding a dependency would create a cycle
 * @param taskId - The task that will have a new dependency
 * @param newDependencyId - The task to be added as a dependency
 * @param allTasks - All tasks in the project
 * @returns true if adding this dependency would create a cycle
 */
export function wouldCreateCycle(
  taskId: string,
  newDependencyId: string,
  allTasks: Task[]
): boolean {
  // Can't depend on itself
  if (taskId === newDependencyId) {
    return true;
  }

  // Build adjacency list for the graph
  const graph = new Map<string, string[]>();
  allTasks.forEach((task) => {
    graph.set(task.id, [...task.dependencies]);
  });

  // Add the proposed new dependency
  const currentDeps = graph.get(taskId) || [];
  graph.set(taskId, [...currentDeps, newDependencyId]);

  // Use DFS to detect cycle starting from taskId
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycleDFS(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a back edge - cycle detected
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  return hasCycleDFS(taskId);
}

/**
 * Get all tasks that would create a cycle if selected as dependency
 */
export function getInvalidDependencies(
  taskId: string,
  allTasks: Task[]
): Set<string> {
  const invalid = new Set<string>();

  // The task itself
  invalid.add(taskId);

  // Any task that would create a cycle
  allTasks.forEach((task) => {
    if (task.id !== taskId && wouldCreateCycle(taskId, task.id, allTasks)) {
      invalid.add(task.id);
    }
  });

  return invalid;
}
