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
  roles?: Role_data[];
}

export enum Role {
  Scrum_master = 'SCRUM_MASTER',
  Developer = 'DEVELOPER',
  Product_owner = 'PRODUCT_OWNER',
}

export enum FetchMode {
  ALL_PROJECTS = 'ALL_PROJECTS',
  USER_PROJECTS = 'USER_PROJECTS',
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (name: string, description?: string) => Promise<void>;
  updateProject: (id: string, name: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  currentRole: Role | null;
  setCurrentRole: (role: Role | null) => void;
  fetchMode: FetchMode;
  setFetchMode: (mode: FetchMode) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [fetchMode, setFetchMode] = useState<FetchMode>(FetchMode.USER_PROJECTS);

  // Load projects and set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const loadProjects = async () => {
      try {
        setLoading(true);
        let query;
        
        if (fetchMode === FetchMode.USER_PROJECTS) {
          // Load only user's projects
          query = await supabase
            .from('projects')
            .select('*, roles!inner (project_id, auth_id, role_type)')
            .eq('roles.auth_id', user.id)
            .order('createdAt', { ascending: false });
        } else {
          // Load all projects
          query = await supabase
            .from('projects')
            .select('*, roles!left (project_id, auth_id, role_type)')
            .order('createdAt', { ascending: false });
        }

        const { data, error } = query;
        
        if (error) throw error;

        setProjects(data);
        
        // Set first project as current if none selected
        if (data.length > 0 && currentProject === null){
          setCurrentProject(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

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
            setProjects(prev => [...prev, payload.new as Project]);
            break;
          case 'UPDATE':
            setProjects(prev => prev.map(project => 
              project.id === payload.new.id ? payload.new as Project : project
            ));
            setCurrentProject(prev => prev?.id === payload.new.id ? payload.new as Project : prev);
            break;
          case 'DELETE':
            setProjects(prev => prev.filter(project => project.id !== payload.old.id));
            setCurrentProject(prev => prev?.id === payload.old.id ? projects[0] || null : prev);
            break;
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchMode]);

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
          console.log(loadRole[0].role_type);
          console.log(errorRole, "errorRole");
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load role');
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
      if (projects.length === 0) {
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
        .eq('id', id);

      if (error) throw error;
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
      setProjects(prev => prev.filter(project => project.id !== id));
      setCurrentProject(prev => prev?.id === id ? projects[0] || null : prev);
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
        projects,
        loading,
        error,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        fetchMode,
        setFetchMode
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