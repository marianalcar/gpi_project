import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Settings, LogOut, Users, Calendar, Clock, ChevronRight, Filter, Edit3, UserPlus, AlertCircle, ChevronLeft } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

function ProjectOverview() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // Project modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [role, setRole] = useState("DEVELOPER");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitationError, setInvitationError] = useState(null);
  
  // Form data for project creation/editing
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    estimatedDuration: 12,
    sprintDuration: 2,
    status: "Active",
  });
  
  const { 
    currentProject, 
    userProjects, 
    loading, 
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    projectUsers,
    loadUserProjects,
    fetchInvitations
  } = useProject();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const otherProjects = userProjects.filter(project => project.id !== currentProject?.id);
  
  // Filter projects based on search criteria
  const filteredProjects = otherProjects.filter(project => {
    const nameMatch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const durationMatch = !filterDuration || project.sprintDuration.toString() === filterDuration;
    const roleMatch = !filterRole || (project.roles && project.roles.some(r => r.role_type === filterRole));
    return nameMatch && durationMatch && roleMatch;
  });

  // Function to handle creating/editing a project
  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        startDate: project.startDate || format(new Date(), "yyyy-MM-dd"),
        estimatedDuration: project.estimatedDuration || 12,
        sprintDuration: project.sprintDuration || 2,
        status: project.status || "Active",
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        estimatedDuration: 12,
        sprintDuration: 2,
        status: "Active",
      });
    }
    setIsModalOpen(true);
  };

  // Function to handle opening the invite modal
  const handleOpenInviteModal = (project) => {
    setEditingProject(project);
    setIsInviteModalOpen(true);
    setInviteEmail('');
    setInvitationError(null);
  };

  // Function to handle form submission for project creation/editing
  const handleSubmit = async () => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData.name, formData.description);
        
        // Update sprint duration directly via Supabase as it might not be in the updateProject function
        await supabase
          .from("projects")
          .update({ 
            sprintDuration: formData.sprintDuration,
            status: formData.status
          })
          .eq("id", editingProject.id);
      } else {
        await createProject(formData.name, formData.description);
        
        // Update sprint duration for the newly created project
        const newProject = userProjects[0]; // Assuming the new project is added to the beginning
        if (newProject) {
          await supabase
            .from("projects")
            .update({ 
              sprintDuration: formData.sprintDuration,
              status: formData.status
            })
            .eq("id", newProject.id);
        }
      }

      setIsModalOpen(false);
      loadUserProjects();
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  // Function to handle inviting a user
  const handleInvite = async () => {
    // Validate if the email is not the same as the current user's email
    if (inviteEmail === user?.email) {
      setInvitationError("You cannot invite yourself.");
      return;
    }
    
    try {
      const { error } = await supabase.from("project_invitations").insert([
        {
          project_id: editingProject?.id,
          status: "pending",
          created_at: new Date().toISOString(),
          expires_at: new Date(
            new Date().setDate(new Date().getDate() + 7)
          ).toISOString(),
          invited_user: inviteEmail,
          inviter_user: user?.id,
          project_name: editingProject?.name,
          role: role,
        },
      ]);

      if (error) {
        switch (error.message) {
          case "insert or update on table \"project_invitations\" violates foreign key constraint \"project_invitations_invited_user_fkey\"":
            setInvitationError("User not found.");
            break;
          case "insert or update on table \"project_invitations\" violates foreign key constraint \"project_invitations_project_id_fkey\"":
            setInvitationError("Project not found.");
            break;
          default:
            console.error("Error inserting invitation:", error);
            setInvitationError("Failed to send invitation. Please try again.");
        }
        return;
      }

      setIsInviteModalOpen(false);
      setInviteEmail("");
      fetchInvitations();
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  // Function to handle project deletion
  const handleDeleteProject = async () => {
    if (editingProject) {
      try {
        await deleteProject(editingProject.id);
        setIsDeleteConfirmOpen(false);
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  // Function to select a project
  const handleSelectProject = (project) => {
    setCurrentProject(project);
    localStorage.setItem("currentProject", JSON.stringify(project));
  };
  
  // Format date function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Actions */}
        <div className="flex justify-between items-center mb-6">
            {/* Implement a back button with a hover darkening the button and a big chevronright*/}
            <div className='flex items-center space-x-2 '>

            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-white rounded-lg px-4 py-2 hover:bg-indigo-500 transition duration-200"
                >
                <ChevronLeft className="h-5 w-5 mr-2" size={18} />
            </button>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
                </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/project-search')}
              className="flex items-center px-4 py-2 bg-white text-purple-800 rounded-lg hover:bg-purple-50"
            >
              <Filter className="h-5 w-5 mr-2" />
              Search Projects
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </button>
          </div>
        </div>

        {/* Search Panel */}
        {showSearch && (
          <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-purple-200 px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Duration</label>
                <select 
                  className="w-full rounded-md border border-purple-200 px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                  value={filterDuration}
                  onChange={(e) => setFilterDuration(e.target.value)}
                >
                  <option value="">Any duration</option>
                  <option value="7">1 week</option>
                  <option value="14">2 weeks</option>
                  <option value="21">3 weeks</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full rounded-md border border-purple-200 px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">Any role</option>
                  <option value="SCRUM_MASTER">Scrum Master</option>
                  <option value="PRODUCT_OWNER">Product Owner</option>
                  <option value="DEVELOPER">Developer</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Current Project Card */}
        {currentProject ? (
          <div className="bg-white rounded-lg shadow-lg border border-purple-200 p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-gray-900">{currentProject.name}</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    Current Project
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{currentProject.description || 'No description provided'}</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleOpenInviteModal(currentProject)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium flex items-center"
                >
                  <UserPlus size={18} className="mr-2" />
                  Invite
                </button>
                <button 
                  onClick={() => handleOpenModal(currentProject)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium flex items-center"
                >
                  <Edit3 size={18} className="mr-2" />
                  Edit
                </button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-auto flex-shrink-0">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Project Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                    Created on {formatDate(currentProject.createdAt)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-purple-500" />
                    {currentProject.sprintDuration || 14} days sprint
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-purple-500" />
                    {projectUsers.length} team members
                  </div>
                </div>
              </div>
              
              <div className="md:flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Team Members</h4>
                <div className="flex flex-wrap gap-2">
                  {projectUsers.map((user, index) => (
                    <div key={index} className="flex items-center bg-purple-50 rounded-full px-3 py-1 border border-purple-100">
                      <div className="h-6 w-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-medium mr-2">
                        {user.display_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.display_name}</p>
                        <p className="text-xs text-purple-500">{user.role.toLowerCase().replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border border-purple-200 p-6 mb-8 text-center">
            <p className="text-gray-600">No project selected. Please create or select a project.</p>
          </div>
        )}

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Other Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 
                      className="text-lg font-semibold text-gray-900 hover:text-purple-700"
                      onClick={() => handleSelectProject(project)}
                    >
                      {project.name}
                    </h3>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInviteModal(project);
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600"
                        title="Invite team members"
                      >
                        <UserPlus size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(project);
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600"
                        title="Edit project"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                  <p 
                    className="text-gray-600 text-sm mb-4"
                    onClick={() => handleSelectProject(project)}
                  >
                    {project.description || 'No description'}
                  </p>
                  <div 
                    className="space-y-3"
                    onClick={() => handleSelectProject(project)}
                  >
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                      Created on {formatDate(project.createdAt)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2 text-purple-500" />
                      {project.sprintDuration || 14} days sprint
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      {project.roles?.length || 0} team members
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {otherProjects.length === 0 && (
          <div className="bg-white rounded-lg border border-purple-200 p-6 text-center">
            <p className="text-gray-600">You don't have any other projects.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter project description"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sprint Duration (weeks)
                    </label>
                    <input
                      type="number"
                      value={formData.sprintDuration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sprintDuration: parseInt(e.target.value),
                        })
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
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
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    {editingProject ? "Update Project" : "Create Project"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="PRODUCT_OWNER">Product Owner</option>
                    <option value="SCRUM_MASTER">Scrum Master</option>
                    <option value="DEVELOPER">Developer</option>
                  </select>
                </div>
                {invitationError && (
                  <div className="mt-2 text-red-600 text-sm flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {invitationError}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setInviteEmail("");
                    setInvitationError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Send Invitation
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
                <h2 className="text-xl font-semibold text-gray-800">
                  Delete Project
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this project? This action cannot
                be undone and will remove all associated tasks, stories, and
                sprints.
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
    </div>
  );
}

export default ProjectOverview;