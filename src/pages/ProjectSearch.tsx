import React, { useEffect, useState } from 'react';
import { Search, Calendar, ArrowRight, ChevronLeft, X } from 'lucide-react';
import { Link, useNavigate, useNavigationType } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function ProjectSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const { allProjects, loading, error, loadAllProjects, loadUserProjects } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  
  // New states for modal and role selection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRole, setSelectedRole] = useState('DEVELOPER');

  // Role options
  const roleOptions = [
    { value: 'SCRUM_MASTER', label: 'Scrum Master' },
    { value: 'PRODUCT_OWNER', label: 'Product Owner' },
    { value: 'DEVELOPER', label: 'Developer' }
  ];

  const filteredProjects = allProjects.filter(project => {
    return project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  useEffect(() => {
    loadAllProjects();
  }, [navigationType]);

  // Open modal instead of directly joining
  const openJoinModal = (project) => {
    setSelectedProject(project);
    setSelectedRole('DEVELOPER'); // Reset to default role
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleJoinProject = async () => {
    if (!selectedProject) return;
    
    try {
      await supabase
        .from('roles')
        .insert({
          project_id: selectedProject.id,
          auth_id: user.id,
          role_type: selectedRole
        });
      
      loadUserProjects();
      closeModal();
      navigate('/');
    } catch (error) {
      console.error('Error joining project:', error);
    }
  }

  // Add a function to check if user already has a role in the project
  const userHasRoleInProject = (project) => {
    if (!project.roles || !user) return false;
    return project.roles.some(role => role.auth_id === user.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <Link to="/" className="group flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500">
              <ChevronLeft className="h-8 w-8 text-white group-hover:text-gray-100" />
          </Link>
          <div className="ml-3">
            <h1 className="text-3xl font-bold">Project Hub</h1>
            <p className="mt-2">Find and join exciting projects that match your interests</p>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error loading projects: {error}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map(project => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <p className="mt-2 text-gray-600">{project.description || "No description provided"}</p>
                  <div className="mt-4 flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={18} />
                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    className={`mt-6 w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 ${
                      userHasRoleInProject(project) 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    onClick={() => userHasRoleInProject(project) ? null : openJoinModal(project)}
                    disabled={userHasRoleInProject(project)}
                  >
                    {userHasRoleInProject(project) ? 'Already Joined' : 'Join Project'}
                    {!userHasRoleInProject(project) && <ArrowRight size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Selection Modal */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Choose Your Role</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-gray-600">Select your role for <span className="font-semibold">{selectedProject.name}</span>:</p>
              
              <div className="space-y-3">
                {roleOptions.map((role) => (
                  <label key={role.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={() => setSelectedRole(role.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-700">{role.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinProject}
                  className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Join Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectSearch;