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
}

export interface Story {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'New' | 'Ready' | 'In Sprint';
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
}

interface ScrumContextType {
  // Data
  tasks: Task[];
  stories: Story[];
  sprints: Sprint[];
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  assignTaskToStory: (taskId: string, storyId: string) => void;
  removeTaskFromStory: (taskId: string) => void;
  assignTaskToSprint: (taskId: string, sprintId: string) => void;
  removeTaskFromSprint: (taskId: string) => void;
  moveTaskStatus: (taskId: string, newStatus: Task['status']) => void;
  
  // Story operations
  addStory: (story: Omit<Story, 'id' | 'createdAt'>) => void;
  updateStory: (story: Story) => void;
  deleteStory: (storyId: string) => void;
  
  // Sprint operations
  addSprint: (sprint: Omit<Sprint, 'id' | 'tasks'>) => void;
  updateSprint: (sprint: Sprint) => void;
  deleteSprint: (sprintId: string) => void;
  
  // Bulk operations
  bulkAssignTasksToSprint: (taskIds: string[], sprintId: string) => void;
  
  // Utility functions
  getBacklogTasks: () => Task[];
  getSprintTasks: (sprintId: string) => Task[];
  getCurrentSprint: () => Sprint | undefined;
}

// Create context
const ScrumContext = createContext<ScrumContextType | undefined>(undefined);

// Initial data
const initialTasks: Task[] = [
  {
    id: uuidv4(),
    title: 'Implement user authentication',
    description: 'Create login and registration functionality with JWT authentication',
    priority: 'High',
    storyPoints: 8,
    status: 'Ready',
    createdAt: '2025-03-15',
    assignee: 'Alex Johnson'
  },
  {
    id: uuidv4(),
    title: 'Design dashboard layout',
    description: 'Create responsive dashboard with key metrics and visualizations',
    priority: 'Medium',
    storyPoints: 5,
    status: 'Ready',
    createdAt: '2025-03-16',
    assignee: 'Emily Davis'
  },
  {
    id: uuidv4(),
    title: 'API integration for product data',
    description: 'Connect to backend API to fetch and display product information',
    priority: 'High',
    storyPoints: 13,
    status: 'New',
    createdAt: '2025-03-17'
  },
  {
    id: uuidv4(),
    title: 'Implement search functionality',
    description: 'Add search feature with filters and sorting options',
    priority: 'Medium',
    storyPoints: 8,
    status: 'New',
    createdAt: '2025-03-18'
  },
  {
    id: uuidv4(),
    title: 'Create user profile page',
    description: 'Design and implement user profile with edit capabilities',
    priority: 'Low',
    storyPoints: 5,
    status: 'New',
    createdAt: '2025-03-19'
  }
];

const initialStories: Story[] = [
  {
    id: uuidv4(),
    title: 'User Authentication',
    description: 'All features related to user authentication and authorization',
    createdAt: '2025-03-14',
    status: 'Ready'
  },
  {
    id: uuidv4(),
    title: 'Dashboard Features',
    description: 'Dashboard layout and visualization components',
    createdAt: '2025-03-15',
    status: 'New'
  }
];

const initialSprints: Sprint[] = [
  {
    id: uuidv4(),
    name: 'Sprint 7',
    description: 'Focus on authentication and dashboard features',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    goal: 'Complete user authentication and dashboard features',
    capacity: 40,
    status: 'In Progress',
    tasks: [
      {
        id: uuidv4(),
        title: 'Setup API endpoints',
        description: 'Create backend API endpoints for user data',
        priority: 'Medium',
        storyPoints: 3,
        status: 'Done',
        createdAt: '2025-03-10',
        assignee: 'Michael Brown'
      },
      {
        id: uuidv4(),
        title: 'Implement form validation',
        description: 'Add client-side validation for all forms',
        priority: 'Low',
        storyPoints: 2,
        status: 'Review',
        createdAt: '2025-03-11',
        assignee: 'Sarah Williams'
      }
    ]
  },
  {
    id: uuidv4(),
    name: 'Sprint 8',
    description: 'Focus on search and filtering features',
    startDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 29), 'yyyy-MM-dd'),
    goal: 'Implement search functionality and filters',
    capacity: 35,
    status: 'Planned',
    tasks: []
  }
];

// Provider component
export const ScrumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load data from localStorage or use initial data
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
    localStorage.setItem('scrumTasks', JSON.stringify(tasks));
  }, [tasks]);
  
  useEffect(() => {
    localStorage.setItem('scrumStories', JSON.stringify(stories));
  }, [stories]);
  
  useEffect(() => {
    localStorage.setItem('scrumSprints', JSON.stringify(sprints));
  }, [sprints]);

  // Task operations
  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: format(new Date(), 'yyyy-MM-dd')
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
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // If task is in backlog, move it to the sprint
    if (!task.sprintId) {
      // Update task status to 'To Do' when assigned to a sprint
      const updatedTask = { 
        ...task, 
        sprintId, 
        status: 'To Do' as Task['status']
      };
      
      setTasks(tasks.map(t => 
        t.id === taskId ? updatedTask : t
      ));
    }
  };

  const removeTaskFromSprint = (taskId: string) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Reset status to 'New' or 'Ready' when removed from sprint
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
  const addStory = (story: Omit<Story, 'id' | 'createdAt'>) => {
    const newStory: Story = {
      ...story,
      id: uuidv4(),
      createdAt: format(new Date(), 'yyyy-MM-dd')
    };
    setStories([...stories, newStory]);
  };

  const updateStory = (updatedStory: Story) => {
    setStories(stories.map(story => 
      story.id === updatedStory.id ? updatedStory : story
    ));
  };

  const deleteStory = (storyId: string) => {
    // Remove story
    setStories(stories.filter(story => story.id !== storyId));
    
    // Update tasks that were assigned to this story
    setTasks(tasks.map(task => 
      task.storyId === storyId ? { ...task, storyId: undefined } : task
    ));
  };

  // Sprint operations
  const addSprint = (sprint: Omit<Sprint, 'id' | 'tasks'>) => {
    const newSprint: Sprint = {
      ...sprint,
      id: uuidv4(),
      tasks: []
    };
    setSprints([...sprints, newSprint]);
  };

  const updateSprint = (updatedSprint: Sprint) => {
    setSprints(sprints.map(sprint => 
      sprint.id === updatedSprint.id ? updatedSprint : sprint
    ));
  };

  const deleteSprint = (sprintId: string) => {
    // Find sprint to delete
    const sprintToDelete = sprints.find(s => s.id === sprintId);
    if (!sprintToDelete) return;
    
    // Move tasks back to backlog
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
    
    // Remove sprint
    setSprints(sprints.filter(sprint => sprint.id !== sprintId));
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
    return tasks.filter(task => !task.sprintId);
  };

  const getSprintTasks = (sprintId: string) => {
    return tasks.filter(task => task.sprintId === sprintId);
  };

  const getCurrentSprint = () => {
    return sprints.find(sprint => sprint.status === 'In Progress');
  };

  const value = {
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
    getCurrentSprint
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