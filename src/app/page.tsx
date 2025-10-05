'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/use-projects';
import Link from 'next/link';
import { ProjectResponse } from '@/types/api';

function CreateProjectForm({
  name,
  setName,
  description,
  setDescription,
  onSubmit,
}: {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project name..."
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project description..."
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Create Project
        </button>
      </form>
    </div>
  );
}

// Internal component for individual project cards
function ProjectCard({ project }: { project: ProjectResponse }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-400"
    >
      <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
      {project.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{project.taskCount || 0} tasks</span>
        <span className="text-blue-600">View →</span>
      </div>
    </Link>
  );
}

// Main component
export default function Home() {
  const { projects, loading, createProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createProject({ name, description });
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Project Tracker</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        </div>

        {/* Create Project Form */}
        {showForm && (
          <CreateProjectForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            onSubmit={handleSubmit}
          />
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-gray-600 mb-4">
              Get started by creating your first project
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
