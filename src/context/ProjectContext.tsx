import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase'; // Import Supabase client

export interface Role_data {
  project_id: string;
  auth_id: string;
  role_type: Role;
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

export enum Role {
  Scrum_master = 'SCRUM_MASTER',
  Developer = 'DEVELOPER',
  Product_owner = 'PRODUCT_OWNER',
}


interface ProjectContextType {
  currentProject: Project | null;
  userProjects: Project[];
  allProjects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (name: string, description?: string) => Promise<void>;
  updateProject: (id: string, name: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  currentRole: Role | null;
  setCurrentRole: (role: Role | null) => void;
  loadUserProjects: () => Promise<void>;
  loadAllProjects: () => Promise<void>;
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
  const loadUserProjects = async () => {
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
          if (savedProject) {
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
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect( () => {
    if (!user || !currentProject) return;

    const loadRole = async () => {
        try {
          
          console.log("currentProject", currentProject?.id);
          console.log('user', user.id); 
          const {data:loadRole, error:  errorRole} = await supabase
          .from('roles')
          .select('role_type')
          .eq('auth_id', user.id)
          .eq('project_id', currentProject?.id)
          
          if (errorRole) throw errorRole;
          
          setCurrentRole(loadRole.length > 0 ? loadRole[0].role_type : null);
          console.log(errorRole, "errorRole");
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load role');
          throw err;
        }
      };
      loadRole();
    }, [currentProject, user]);


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

  return (
    <ProjectContext.Provider 
      value={{
        currentProject,
        currentRole,
        userProjects,
        allProjects,
        loading,
        error,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        loadUserProjects,
        loadAllProjects,
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