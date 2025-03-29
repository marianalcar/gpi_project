import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, Plus, Edit3, Trash2, AlertCircle, Search, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useProject } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  estimatedDuration: number;
  sprintDuration: number;
  status: 'Active' | 'Completed' | 'On Hold';
  createdAt: string;
  createdBy: string;
}

const ProjectSelector = () => {
  const { currentProject, setCurrentProject, userProjects, loadUserProjects } = useProject();
  const [isSlideUpOpen, setIsSlideUpOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [role, setRole] = useState<string>('DEVELOPER');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    estimatedDuration: 12,
    sprintDuration: 2,
    status: 'Active' as const
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject');
    if (savedProject) {
      const parsedProject = JSON.parse(savedProject);
      const foundProject = userProjects.find((p) => p.id === parsedProject.id);
      if (foundProject) {
        setCurrentProject(foundProject);
      }
    } else {
      setCurrentProject(userProjects[0] || null);
    }
  }, [userProjects]);

  const handleProjectChange = (project: Project) => {
    setCurrentProject(project); // Updates global context
    setIsSlideUpOpen(false);
    localStorage.setItem('currentProject', JSON.stringify(project));
  };

  const handleOpenModal = (project: Project | null = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        estimatedDuration: project.estimatedDuration,
        sprintDuration: project.sprintDuration,
        status: project.status
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        estimatedDuration: 12,
        sprintDuration: 2,
        status: 'Active'
      });
    }
    setIsModalOpen(true);
    setIsSlideUpOpen(false);
  };

  const handleOpenInviteModal = (project: Project) => {
    setEditingProject(project);
    setIsInviteModalOpen(true);
    setIsSlideUpOpen(false);
  };

  const handleSubmit = async () => {
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', editingProject.id);

        if (error) throw error;

        // Update current project if it was the one being edited
        if (currentProject?.id === editingProject.id) {
          setCurrentProject({ ...editingProject, ...formData });
        }
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([{ ...formData, createdBy: (await supabase.auth.getUser()).data.user?.id }])
          .select()
          .single();

        if (error) throw error;

        // Set as current project if it's the first one
        if (userProjects.length === 0) {
          setCurrentProject(data);
        }
      }

      setIsModalOpen(false);
      loadUserProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      // Here you would typically show an error message to the user
    }
  };

  const handleInvite = async () => {
    try {
      console.log('Inviting user with email:', inviteEmail);
      
      const { error } = await supabase
        .from('project_invitations')
        .insert([{
          project_id: editingProject?.id,
          status: 'pending', // Assuming the initial status is 'pending'
          created_at: new Date().toISOString(),
          expires_at: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // Assuming the invitation expires in 7 days
          invited_user: inviteEmail, // Use the fetched user email
          inviter_user: (await supabase.auth.getUser()).data.user?.id, // Assuming the inviter is the current authenticated user
          project_name: editingProject?.name,
          role: role
        }]);
  
      if (error) {
        console.error('Error inserting invitation:', error);
        throw error;
      }
  
      console.log('Invitation successfully inserted');
  
      setIsInviteModalOpen(false);
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting user:', error);
      // Here you would typically show an error message to the user
    }
  };

  const handleDeleteProject = async () => {
    if (editingProject) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', editingProject.id);

        if (error) throw error;

        // If deleted project was current, set first remaining project as current
        if (currentProject?.id === editingProject.id) {
          const remainingProjects = userProjects.filter(p => p.id !== editingProject.id);
          setCurrentProject(remainingProjects[0] || null);
        }

        setIsDeleteConfirmOpen(false);
        setIsModalOpen(false);
        loadUserProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        // Here you would typically show an error message to the user
      }
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
          ref={buttonRef}
          onClick={() => setIsSlideUpOpen(!isSlideUpOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 rounded-lg border border-indigo-400 hover:bg-indigo-300"
        >
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-950">Current Project</span>
            <span className="font-medium text-white">{currentProject?.name || 'Select Project'}</span>
          </div>
          <ChevronUp size={16} className="text-black" />
        </button>

        {/* Slide-up Panel with Animation */}
        <div 
          className={`absolute z-50 w-21 bg-white rounded-lg shadow-black shadow-2xl border border-indigo-200 transition-all duration-200 ease-in-out ${isSlideUpOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          style={{ 
            bottom: buttonRef.current ? buttonRef.current.offsetHeight + 10 : '3rem', 
            left: 0,
            transformOrigin: 'bottom' 
          }}
        >
          <div className="p-2">
            <button
              onClick={() => handleOpenModal()}
              className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
            >
              <Plus size={16} className="mr-2" />
              Create New Project
            </button>

            <button 
              className="w-full flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded" 
              onClick={() => {
                navigate('/project-search');
                setIsSlideUpOpen(false);
              }}
            >
              <Search className="mr-2 text-gray-500" size={16} />
              <span className="text-gray-500">Search for a project</span>
            </button>
          </div>
          
          <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
            {userProjects.length > 0 ? (
              userProjects.map(project => (
                <div
                  key={project.id}
                  className="p-2 hover:bg-gray-50 flex items-center justify-between group"
                >
                  <button
                    onClick={() => handleProjectChange(project)}
                    className="flex-1 flex items-center text-left px-2"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[180px]">
                        {project.description}
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center px-2 space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(project);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInviteModal(project);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No projects found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Background Overlay - Only visible when slide-up is open */}
      {isSlideUpOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsSlideUpOpen(false)}
        />
      )}

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter project name"
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

      {/* Invite People Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Invite People to {editingProject?.name}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  >
                    <option value="PRODUCT_OWNER">Product Owner</option>
                    <option value="SCRUM_MASTER">Scrum Master</option>
                    <option value="DEVELOPER">Developer</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Invite
                </button>
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