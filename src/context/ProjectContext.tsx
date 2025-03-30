import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase'; // Import Supabase client

export interface Role_data {
  project_id: string;
  auth_id: string;
  role_type: Role;
}

export interface ProjectUser {
  auth_id: string;
  display_name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdBy: string;
  sprintDuration: number;
  roles?: Role_data[];
}

export interface Invitation {
  id: string;
  project_name: string;
  created_at: string;
  role: string;
}

export enum Role {
  Scrum_master = 'SCRUM_MASTER',
  Developer = 'DEVELOPER',
  Product_owner = 'PRODUCT_OWNER',
}


interface ProjectContextType {
  projectUsers: ProjectUser[];
  fetchProjectUsers: () => Promise<void>;
  updateOwnDisplayName: (userId: string, newName: string) => Promise<void>;
  currentProject: Project | null;
  userProjects: Project[];
  allProjects: Project[];
  loading: boolean;
  invitations: Invitation[];
  error: string | null;
  createProject: (name: string, description?: string) => Promise<void>;
  updateProject: (id: string, name: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  currentRole: Role | null;
  setCurrentRole: (role: Role | null) => void;
  loadUserProjects: (projectId?:String) => Promise<void>;
  loadAllProjects: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
}



const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const loadAllProjects = async () => {
    try {
          // Load all projects
          let query = await supabase
          .from('projects')
          .select('*, roles!left (project_id, auth_id, role_type)')
          .order('createdAt', { ascending: false });

          const { data, error } = query;

          if (error) throw error;

          setAllProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allProjects');
    }
  };

  // Load projects and set up real-time subscription
  const loadUserProjects = async (projectId?: String) => {
    if (!user) return;

    try {
      setLoading(true);
      let query;
      
      // Load only user's projects
      query = await supabase
        .from('projects')
        .select('*, roles!inner (project_id, auth_id, role_type)')
        .eq('roles.auth_id', user.id)
        .order('createdAt', { ascending: false });

      const { data, error } = query;
      
      if (error) throw error;

        setUserProjects(data);
        
        // Set first project as current if none selected
        //if (data.length > 0 && !currentProject) {
          const savedProject = localStorage.getItem('currentProject');
          const foundProject = data.find((p) => p.id === projectId ? projectId : null);
          if (projectId && foundProject) {
              setCurrentProject(foundProject);
          } else if (savedProject) {
            const parsedProject = JSON.parse(savedProject);
            const foundProject = data.find((p) => p.id === parsedProject.id);
            if (foundProject) {
              setCurrentProject(foundProject);
            } else if (data.length > 0 && currentProject === null) {
              setCurrentProject(data[0]);
            }
          }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    if (!user) return;
    loadUserProjects();
    loadAllProjects();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('projects_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projects' 
      }, (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            setUserProjects(prev => [...prev, payload.new as Project]);
            break;
          case 'UPDATE':
            setUserProjects(prev => prev.map(project => 
              project.id === payload.new.id ? payload.new as Project : project
            ));
            setCurrentProject(prev => prev?.id === payload.new.id ? payload.new as Project : prev);
            break;
          case 'DELETE':
            setUserProjects(prev => prev.filter(project => project.id !== payload.old.id));
            setCurrentProject(prev => prev?.id === payload.old.id ? userProjects[0] || null : prev);
            break;
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_invitations' }, fetchInvitations)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // THIS FETCHES USERS FOR THE CURRENT PROJECT and passes it down to current sprint or anywhere needed.
  const fetchProjectUsers = async () => {
    if (!currentProject) return;
  
    //console.log("Fetching users for project:", currentProject.id);
  
    //Fetch auth_id from roles table
    const { data: projectUsersData, error } = await supabase
      .from("roles")
      .select("auth_id, role_type") 
      .eq("project_id", currentProject.id);
  
    if (error) {
      console.error("Error fetching project users:", error);
      return;
    }
  
    //console.log("These users are inside the list:", projectUsersData);
  
    //Get display names from 'users' table using auth_id
    const authIds = projectUsersData.map((user) => user.auth_id);
  
    const { data: usersTableData, error: usersTableError } = await supabase
      .from("users")
      .select("auth_id, display_name")
      .in("auth_id", authIds);
  
    if (usersTableError) {
      console.error("Error fetching display names from users table:", usersTableError);
      return;
    }
  
    //Create a map of auth_id => display_name
    const displayNameMap = new Map(
      usersTableData
        .filter((user) => user.display_name && user.display_name.trim() !== "No Name") // Remove "No Name" users
        .map((user) => [user.auth_id, user.display_name])
    );
  
    //Combine role data with display names
    const usersWithNames: ProjectUser[] = projectUsersData
    .filter((user) => displayNameMap.has(user.auth_id)) // Ensure only users with valid names
    .map((user) => ({
      auth_id: user.auth_id,
      role: user.role_type,
      display_name: displayNameMap.get(user.auth_id) || "Unknown",
    }));
  
    //Save to state
    setProjectUsers(usersWithNames);
    console.log("Final Project Users List:", usersWithNames);
  };
  
  //  Fetch project users when current project changes
  useEffect(() => {
    fetchProjectUsers();
  }, [currentProject]);

  useEffect( () => {
    if (!user || !currentProject) return;

    const loadRole = async () => {
        try {
          const {data:loadRole, error:  errorRole} = await supabase
          .from('roles')
          .select('role_type')
          .eq('auth_id', user.id)
          .eq('project_id', currentProject?.id)
          
          if (errorRole) throw errorRole;
          
          setCurrentRole(loadRole.length > 0 ? loadRole[0].role_type : null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load role');
          throw err;
        }
      };
      loadRole();
    }, [currentProject, user]);
    const updateOwnDisplayName = async (userId: string, newName: string) => {
    if (user?.id === userId) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: newName },
      });

      if (authError) {
        console.error("Error updating auth display name:", authError);
        return;
      }
    }

    const { error: dbError } = await supabase
      .from("users")
      .upsert({ auth_id: userId, display_name: newName }, { onConflict: "auth_id" });

    if (dbError) {
      console.error("Error updating display name in users table:", dbError);
    }
  };

  const createProject = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          { 
            name, 
            description, 
            createdBy: user?.id 
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Set as current project if it's the first one
      if (userProjects.length === 0) {
        setCurrentProject(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  };

  const updateProject = async (id: string, name: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single(); // Ensure we retrieve the updated project

      if (error) throw error;

      // Refresh projects after updating
       
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setUserProjects(prev => prev.filter(project => project.id !== id));
      setCurrentProject(prev => prev?.id === id ? userProjects[0] || null : prev);
      // These 2 lines ensure that if the deleted project was selected, the app switches to another project.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  };

  const fetchInvitations = async () => {
      if (!user) return;
  
      const { data, error } = await supabase
        .from('project_invitations') // Replace with your actual table name
        .select('*')
        .eq('invited_user', user.email)
        .eq('status', 'pending');
  
      if (error) {
        console.error('Error fetching invitations:', error);
      } else {
        setInvitations(data || []);
      }
    };

  return (
    <ProjectContext.Provider 
      value={{
        currentProject,
        currentRole,
        userProjects,
        allProjects,
        projectUsers,
        loading,
        invitations,
        error,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        loadUserProjects,
        loadAllProjects,
        updateOwnDisplayName,
        fetchProjectUsers,
        setCurrentRole,
        fetchInvitations
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};