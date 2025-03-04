import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays } from 'date-fns';

// Define types
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  storyPoints: number;
  status: 'New' | 'Ready' | 'In Sprint' | 'To Do' | 'In Progress' | 'Review' | 'Done';
  createdAt: string;
  assignee?: string;
  storyId?: string;
  sprintId?: string;
  projectId: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'New' | 'Ready' | 'In Sprint';
  projectId: string;
}

export interface Sprint {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  goal: string;
  capacity: number;
  status: 'Planned' | 'In Progress' | 'Completed';
  tasks: Task[];
  projectId: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: string;
  estimatedDuration: number; // in weeks
  sprintDuration: number; // in weeks
  createdAt: string;
  status: 'Active' | 'Completed' | 'On Hold';
}

interface ScrumContextType {
  // Project operations
  projects: Project[];
  currentProject: Project | null;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  setCurrentProject: (projectId: string) => void;
  
  // Data
  tasks: Task[];
  stories: Story[];
  sprints: Sprint[];
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'projectId'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  assignTaskToStory: (taskId: string, storyId: string) => void;
  removeTaskFromStory: (taskId: string) => void;
  assignTaskToSprint: (taskId: string, sprintId: string) => void;
  removeTaskFromSprint: (taskId: string) => void;
  moveTaskStatus: (taskId: string, newStatus: Task['status']) => void;
  
  // Story operations
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'projectId'>) => void;
  updateStory: (story: Story) => void;
  deleteStory: (storyId: string) => void;
  
  // Sprint operations
  addSprint: (sprint: Omit<Sprint, 'id' | 'tasks' | 'projectId'>) => void;
  updateSprint: (sprint: Sprint) => void;
  deleteSprint: (sprintId: string) => void;
  
  // Bulk operations
  bulkAssignTasksToSprint: (taskIds: string[], sprintId: string) => void;
  
  // Utility functions
  getBacklogTasks: () => Task[];
  getSprintTasks: (sprintId: string) => Task[];
  getCurrentSprint: () => Sprint | undefined;
  getProjectTasks: (projectId: string) => Task[];
  getProjectStories: (projectId: string) => Story[];
  getProjectSprints: (projectId: string) => Sprint[];
}

// Initial data
const initialProjects: Project[] = [
  {
    id: uuidv4(),
    title: 'E-commerce Platform',
    description: 'Building a modern e-commerce platform with React and Node.js',
    startDate: '2025-03-15',
    estimatedDuration: 12,
    sprintDuration: 2,
    createdAt: '2025-03-15',
    status: 'Active'
  }
];

const initialTasks: Task[] = [
  {
    id: uuidv4(),
    title: 'Implement user authentication',
    description: 'Create login and registration functionality with JWT authentication',
    priority: 'High',
    storyPoints: 8,
    status: 'Ready',
    createdAt: '2025-03-15',
    assignee: 'Alex Johnson',
    projectId: initialProjects[0].id
  },
  {
    id: uuidv4(),
    title: 'Design dashboard layout',
    description: 'Create responsive dashboard with key metrics and visualizations',
    priority: 'Medium',
    storyPoints: 5,
    status: 'Ready',
    createdAt: '2025-03-16',
    assignee: 'Emily Davis',
    projectId: initialProjects[0].id
  }
];

const initialStories: Story[] = [
  {
    id: uuidv4(),
    title: 'User Authentication',
    description: 'All features related to user authentication and authorization',
    createdAt: '2025-03-14',
    status: 'Ready',
    projectId: initialProjects[0].id
  },
  {
    id: uuidv4(),
    title: 'Dashboard Features',
    description: 'Dashboard layout and visualization components',
    createdAt: '2025-03-15',
    status: 'New',
    projectId: initialProjects[0].id
  }
];

const initialSprints: Sprint[] = [
  {
    id: uuidv4(),
    name: 'Sprint 1',
    description: 'Focus on authentication and dashboard features',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    goal: 'Complete user authentication and dashboard features',
    capacity: 40,
    status: 'In Progress',
    projectId: initialProjects[0].id,
    tasks: []
  }
];

// Create context
const ScrumContext = createContext<ScrumContextType | undefined>(undefined);

// Provider component
export const ScrumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load data from localStorage or use initial data
  const [projects, setProjects] = useState<Project[]>(() => {
    const savedProjects = localStorage.getItem('scrumProjects');
    return savedProjects ? JSON.parse(savedProjects) : initialProjects;
  });
  
  const [currentProject, setCurrentProject] = useState<Project | null>(() => {
    const savedCurrentProjectId = localStorage.getItem('currentProjectId');
    if (savedCurrentProjectId) {
      return projects.find(p => p.id === savedCurrentProjectId) || projects[0];
    }
    return projects[0];
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('scrumTasks');
    return savedTasks ? JSON.parse(savedTasks) : initialTasks;
  });
  
  const [stories, setStories] = useState<Story[]>(() => {
    const savedStories = localStorage.getItem('scrumStories');
    return savedStories ? JSON.parse(savedStories) : initialStories;
  });
  
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const savedSprints = localStorage.getItem('scrumSprints');
    return savedSprints ? JSON.parse(savedSprints) : initialSprints;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('scrumProjects', JSON.stringify(projects));
  }, [projects]);
  
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProjectId', currentProject.id);
    }
  }, [currentProject]);
  
  useEffect(() => {
    localStorage.setItem('scrumTasks', JSON.stringify(tasks));
  }, [tasks]);
  
  useEffect(() => {
    localStorage.setItem('scrumStories', JSON.stringify(stories));
  }, [stories]);
  
  useEffect(() => {
    localStorage.setItem('scrumSprints', JSON.stringify(sprints));
  }, [sprints]);

  // Project operations
  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: format(new Date(), 'yyyy-MM-dd')
    };
    setProjects([...projects, newProject]);
    if (!currentProject) {
      setCurrentProject(newProject);
    }
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(projects.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ));
    if (currentProject?.id === updatedProject.id) {
      setCurrentProject(updatedProject);
    }
  };

  const deleteProject = (projectId: string) => {
    // Delete all related tasks, stories, and sprints
    setTasks(tasks.filter(task => task.projectId !== projectId));
    setStories(stories.filter(story => story.projectId !== projectId));
    setSprints(sprints.filter(sprint => sprint.projectId !== projectId));
    
    // Delete the project
    setProjects(projects.filter(project => project.id !== projectId));
    
    // If current project is deleted, switch to another project
    if (currentProject?.id === projectId) {
      const remainingProjects = projects.filter(project => project.id !== projectId);
      setCurrentProject(remainingProjects.length > 0 ? remainingProjects[0] : null);
    }
  };

  const setActiveProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  // Task operations
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'projectId'>) => {
    if (!currentProject) return;
    
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      projectId: currentProject.id
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const assignTaskToStory = (taskId: string, storyId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, storyId } : task
    ));
  };

  const removeTaskFromStory = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, storyId: undefined } : task
    ));
  };

  const assignTaskToSprint = (taskId: string, sprintId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTask = { 
      ...task, 
      sprintId, 
      status: 'To Do' as Task['status']
    };
    
    setTasks(tasks.map(t => 
      t.id === taskId ? updatedTask : t
    ));
  };

  const removeTaskFromSprint = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTask = { 
      ...task, 
      sprintId: undefined, 
      status: task.status === 'To Do' || task.status === 'In Progress' || task.status === 'Review' || task.status === 'Done' 
        ? 'Ready' as Task['status'] 
        : task.status
    };
    
    setTasks(tasks.map(t => 
      t.id === taskId ? updatedTask : t
    ));
  };

  const moveTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  // Story operations
  const addStory = (story: Omit<Story, 'id' | 'createdAt' | 'projectId'>) => {
    if (!currentProject) return;
    
    const newStory: Story = {
      ...story,
      id: uuidv4(),
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      projectId: currentProject.id
    };
    setStories([...stories, newStory]);
  };

  const updateStory = (updatedStory: Story) => {
    setStories(stories.map(story => 
      story.id === updatedStory.id ? updatedStory : story
    ));
  };

  const deleteStory = (storyId: string) => {
    setStories(stories.filter(story => story.id !== storyId));
    setTasks(tasks.map(task => 
      task.storyId === storyId ? { ...task, storyId: undefined } : task
    ));
  };

  // Sprint operations
  const addSprint = (sprint: Omit<Sprint, 'id' | 'tasks' | 'projectId'>) => {
    if (!currentProject) return;
    
    const newSprint: Sprint = {
      ...sprint,
      id: uuidv4(),
      tasks: [],
      projectId: currentProject.id
    };
    setSprints([...sprints, newSprint]);
  };

  const updateSprint = (updatedSprint: Sprint) => {
    setSprints(sprints.map(sprint => 
      sprint.id === updatedSprint.id ? updatedSprint : sprint
    ));
  };

  const deleteSprint = (sprintId: string) => {
    setSprints(sprints.filter(sprint => sprint.id !== sprintId));
    setTasks(tasks.map(task => 
      task.sprintId === sprintId 
        ? { 
            ...task, 
            sprintId: undefined, 
            status: task.status === 'To Do' || task.status === 'In Progress' || task.status === 'Review' || task.status === 'Done' 
              ? 'Ready' as Task['status'] 
              : task.status
          } 
        : task
    ));
  };

  // Bulk operations
  const bulkAssignTasksToSprint = (taskIds: string[], sprintId: string) => {
    setTasks(tasks.map(task => 
      taskIds.includes(task.id) 
        ? { 
            ...task, 
            sprintId, 
            status: 'To Do' as Task['status']
          } 
        : task
    ));
  };

  // Utility functions
  const getBacklogTasks = () => {
    if (!currentProject) return [];
    return tasks.filter(task => !task.sprintId && task.projectId === currentProject.id);
  };

  const getSprintTasks = (sprintId: string) => {
    if (!currentProject) return [];
    return tasks.filter(task => task.sprintId === sprintId && task.projectId === currentProject.id);
  };

  const getCurrentSprint = () => {
    if (!currentProject) return undefined;
    return sprints.find(sprint => 
      sprint.status === 'In Progress' && sprint.projectId === currentProject.id
    );
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getProjectStories = (projectId: string) => {
    return stories.filter(story => story.projectId === projectId);
  };

  const getProjectSprints = (projectId: string) => {
    return sprints.filter(sprint => sprint.projectId === projectId);
  };

  const value = {
    projects,
    currentProject,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject: setActiveProject,
    tasks,
    stories,
    sprints,
    addTask,
    updateTask,
    deleteTask,
    assignTaskToStory,
    removeTaskFromStory,
    assignTaskToSprint,
    removeTaskFromSprint,
    moveTaskStatus,
    addStory,
    updateStory,
    deleteStory,
    addSprint,
    updateSprint,
    deleteSprint,
    bulkAssignTasksToSprint,
    getBacklogTasks,
    getSprintTasks,
    getCurrentSprint,
    getProjectTasks,
    getProjectStories,
    getProjectSprints
  };

  return (
    <ScrumContext.Provider value={value}>
      {children}
    </ScrumContext.Provider>
  );
};

// Custom hook for using the context
export const useScrumContext = () => {
  const context = useContext(ScrumContext);
  if (context === undefined) {
    throw new Error('useScrumContext must be used within a ScrumProvider');
  }
  return context;
};