import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Import Supabase client
import { useProject } from './ProjectContext'; // Importing Project Context

// Define types -> this matchess the SQL tables defined in SUPABASE
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  storyPoints: number;
  status: 'New' | 'Ready' | 'In Sprint' | 'To Do' | 'In Progress' | 'Review' | 'Done';
  createdAt: string;
  assignees?: string[];
  storyId?: string;
  sprintId?: string;
  projectId: string;
  completedAt: string | null;
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
  projectId: string;
  retrospective_url: string | null;
}

interface ScrumContextType {
  tasks: Task[];
  stories: Story[];
  sprints: Sprint[];
  fetchTasks: () => Promise<void>; //these are now added here to refetch
  fetchStories: () => Promise<void>;// all objects when project is switched
  fetchSprints: () => Promise<void>;//now changed dynamically instead

  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addStory: (story: Omit<Story, 'id' | 'createdAt'>) => Promise<void>;
  updateStory: (story: Story) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  addSprint: (sprint: Omit<Sprint, 'id'>) => Promise<void>;
  updateSprint: (sprint: Sprint) => Promise<void>;
  deleteSprint: (sprintId: string) => Promise<void>;
  assignTaskToStory: (taskId: string, storyId: string) => Promise<void>;
  removeTaskFromStory: (taskId: string) => Promise<void>;
  assignTaskToSprint: (taskId: string, sprintId: string) => Promise<void>;
  removeTaskFromSprint: (taskId: string) => Promise<void>;
  moveTaskStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
  bulkAssignTasksToSprint: (taskIds: string[], sprintId: string) => Promise<void>;
  getBacklogTasks: () => Task[];
  getSprintTasks: (sprintId: string) => Task[];
  getCurrentSprint: () => Sprint | undefined;
}

// Create context
const ScrumContext = createContext<ScrumContextType | undefined>(undefined);

// Provider component -> this initiates the entire Context on app startup
export const ScrumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProject } = useProject(); // Get selected project
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  

  /**
   * Fetch tasks from Supabase on component mount
   */
  const fetchTasks = async () => {
    if (!currentProject) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('projectId', currentProject.id); // Fetch only current proj task
    if (error) console.error('Error fetching tasks:', error);
    else setTasks(data || []);
  };
  /**
   * Fetch sprints from Supabase
   */
  const fetchSprints = async () => {
    if (!currentProject) return;
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('projectId', currentProject.id);
    if (error) console.error('Error fetching sprints:', error);
    else setSprints(data || []);
  };

  /**
   * Fetch stories from Supabase
   */
  const fetchStories = async () => {
    if (!currentProject) return;
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('projectId', currentProject.id);
    if (error) console.error('Error fetching stories:', error);
    else setStories(data || []);
  };

  // Fetch all data from Supabase when app loads, populates the context of the APP
  useEffect(() => {
    fetchTasks();
    fetchSprints();
    fetchStories();
      
    const subscription = supabase.channel('scrum_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, fetchStories)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints' }, fetchSprints)
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, [currentProject]); // Refetch all objects when project changes
            
            // CRUD Operations for Tasks
  /**  
   * Add a new task to Supabase
   */
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'projectId'>) => {
    if (!currentProject) return;
    const newTask = { ...task, createdAt: new Date().toISOString(), projectId: currentProject.id};
  
    const { data, error } = await supabase.from('tasks').insert([newTask]).select();
    if (error) console.error('Error adding task:', error);
    else setTasks([...tasks, data[0]]);
  };
  /**
   * Update an existing task in Supabase
   */
  const updateTask = async (updatedTask: Task) => {
    if (!currentProject) return;
    // Ensure assignees are always stored as an array
  const safeTask = {
    ...updatedTask,
    assignees: updatedTask.assignees || [], //  Prevents undefined errors
  };
    const { error } = await supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', updatedTask.id)
      .eq('projectId', currentProject.id); // Ensure task belongs to selected project
    if (error) console.error('Error updating task:', error);
    else setTasks(tasks.map(task => (task.id === updatedTask.id ? safeTask  : task)));
  };

  /**
   * Delete a task from Supabase
   */
  const deleteTask = async (taskId: string) => {
    if (!currentProject) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('projectId', currentProject.id);
    if (error) console.error('Error deleting task:', error);
    else setTasks(tasks.filter(task => task.id !== taskId));
  };

      // CRUD Operations for Stories
  /**
   * Add a new story to Supabase
   */
  const addStory = async (story: Omit<Story, 'id' | 'createdAt' | 'projectId'>) => {
    if (!currentProject) return;
    const newStory = { ...story, createdAt: new Date().toISOString(), projectId: currentProject.id };
  
    const { data, error } = await supabase.from('stories').insert([newStory]).select();
    if (error) console.error('Error adding story:', error);
    else setStories([...stories, data[0]]);
  };
  
  /**
   * Update an existing story in Supabase
   */
  const updateStory = async (updatedStory: Story) => {
    if (!currentProject) return;
    const { error } = await supabase
      .from('stories')
      .update(updatedStory)
      .eq('id', updatedStory.id)
      .eq('projectId', currentProject.id); // Ensure story belongs to selected project
    if (error) console.error('Error updating story:', error);
    else setStories((prevStories) =>
      prevStories.map((story) => (story.id === updatedStory.id ? updatedStory : story))
    );
  };
  /**
   * Delete a story from Supabase
   */
  const deleteStory = async (storyId: string) => {
    if (!currentProject) return;
    const { error } = await supabase.from('stories').delete().eq('id', storyId).eq('projectId', currentProject.id);
    if (error) console.error('Error deleting story:', error);
    else setStories(stories.filter(story => story.id !== storyId));
  };

        // CRUD Operations for Sprints
  /**
   * Add a new sprint to Supabase
   */
  const addSprint = async (sprint: Omit<Sprint, 'id' | 'projectId'>) => {
    if (!currentProject) return;
    const newSprint = { ...sprint, projectId: currentProject.id };
  
    const { data, error } = await supabase.from('sprints').insert([newSprint]).select();
    if (error) console.error('Error adding sprint:', error);
    else setSprints([...sprints, data[0]]);
  };
  /**
   * Update an existing sprint in Supabase
   */
  const updateSprint = async (updatedSprint: Sprint) => {
    if (!currentProject) return;
    const { error } = await supabase
      .from('sprints')
      .update(updatedSprint)
      .eq('id', updatedSprint.id)
      .eq('projectId', currentProject.id); // Ensure sprint belongs to selected project
    if (error) console.error('Error updating sprint:', error);
    else setSprints(sprints.map(sprint => (sprint.id === updatedSprint.id ? updatedSprint : sprint)));
  };
  /**
   * Delete a sprint from Supabase
   */
  const deleteSprint = async (sprintId: string) => {
    if (!currentProject) return;
    const { error } = await supabase.from('sprints').delete().eq('id', sprintId).eq('projectId', currentProject.id);
    if (error) console.error('Error deleting sprint:', error);
    else setSprints(sprints.filter(sprint => sprint.id !== sprintId));
  };

  // Dragging, Assigning & Removing Tasks
  const assignTaskToStory = async (taskId: string, storyId: string) => {
    await updateTask({ ...tasks.find(t => t.id === taskId)!, storyId });
  };

  const removeTaskFromStory = async (taskId: string) => {
    await updateTask({ ...tasks.find(t => t.id === taskId)!, storyId: undefined });
  };

  const assignTaskToSprint = async (taskId: string, sprintId: string) => {
    await updateTask({ ...tasks.find(t => t.id === taskId)!, sprintId, status: 'To Do' });
  };

  const removeTaskFromSprint = async (taskId: string) => {
    if (!currentProject) return;
    const { error, data } = await supabase
    .from('tasks')
    .update({ sprintId: null }) // Remove a associação
    .eq('id', taskId)  // Filtra pela task correta
    .eq('projectId', currentProject.id); // Garante que pertence ao projeto

    if (error) {
      console.error("Erro ao remover task do sprint:", error);
    } else {
      console.log("Task removida do sprint com sucesso:", data);
    }
    //await updateTask({ ...tasks.find(t => t.id === taskId)!, sprintId: undefined, status: 'Ready' });
  };

  const moveTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    // Atualiza o campo completedAt com base no novo status
    const updatedTask = {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'Done' ? new Date().toISOString() : null, // Define completedAt se a tarefa for marcada como "Done"
    };
  
    await updateTask(updatedTask);
  };

  const bulkAssignTasksToSprint = async (taskIds: string[], sprintId: string) => {
    for (const taskId of taskIds) {
      await assignTaskToSprint(taskId, sprintId);
    }
  };

  // Utility Functions
  const getBacklogTasks = () => tasks.filter(task => !task.sprintId && task.projectId === currentProject?.id);

const getSprintTasks = (sprintId: string) => tasks.filter(task => task.sprintId === sprintId && task.projectId === currentProject?.id);

const getCurrentSprint = () => sprints.find(sprint => sprint.status === 'In Progress' && sprint.projectId === currentProject?.id);

  return (
    <ScrumContext.Provider value={{
      tasks, stories, sprints, fetchTasks, fetchStories, fetchSprints, addTask, updateTask, deleteTask, addStory, updateStory, deleteStory, addSprint, updateSprint, deleteSprint,
      assignTaskToStory, removeTaskFromStory, assignTaskToSprint, removeTaskFromSprint, moveTaskStatus, bulkAssignTasksToSprint,
      getBacklogTasks, getSprintTasks, getCurrentSprint
    }}>
      {children}
    </ScrumContext.Provider>
  );
};

// Custom hook for using the context, now 20% cooler!
export const useScrumContext = () => {
  const context = useContext(ScrumContext);
  if (context === undefined) {
    throw new Error('useScrumContext must be used within a ScrumProvider');
  }
  return context;
};
