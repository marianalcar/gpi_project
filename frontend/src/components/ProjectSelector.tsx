import React, { useState } from 'react';
import { ChevronDown, Plus, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { useScrumContext, Project } from '../context/ScrumContext';
import { format, addWeeks } from 'date-fns';

const ProjectSelector = () => {
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    addProject, 
    updateProject, 
    deleteProject 
  } = useScrumContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    estimatedDuration: 12,
    sprintDuration: 2,
    status: 'Active' as const
  });

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        estimatedDuration: project.estimatedDuration,
        sprintDuration: project.sprintDuration,
        status: project.status
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: '',
        description: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        estimatedDuration: 12,
        sprintDuration: 2,
        status: 'Active'
      });
    }
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleSubmit = () => {
    if (editingProject) {
      updateProject({
        ...editingProject,
        ...formData
      });
    } else {
      addProject(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteProject = () => {
    if (editingProject) {
      deleteProject(editingProject.id);
      setIsDeleteConfirmOpen(false);
      setIsModalOpen(false);
    }
  };

  const getProjectStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-500">Current Project</span>
            <span className="font-medium">{currentProject?.title || 'Select Project'}</span>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2">
              <button
                onClick={() => handleOpenModal()}
                className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
              >
                <Plus size={16} className="mr-2" />
                Create New Project
              </button>
            </div>
            <div className="border-t border-gray-200">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="p-2 hover:bg-gray-50 flex items-center justify-between group"
                >
                  <button
                    onClick={() => {
                      setCurrentProject(project.id);
                      setIsDropdownOpen(false);
                    }}
                    className="flex-1 flex items-center text-left px-2"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{project.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[180px]">
                        {project.description}
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getProjectStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center px-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(project);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter project title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter project description"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration (weeks)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sprint Duration (weeks)
                    </label>
                    <input
                      type="number"
                      value={formData.sprintDuration}
                      onChange={(e) => setFormData({ ...formData, sprintDuration: parseInt(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <div>
                  {editingProject && (
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete Project
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle size={24} className="text-red-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Delete Project</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this project? This action cannot be undone and will remove all associated tasks, stories, and sprints.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectSelector;