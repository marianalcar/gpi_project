import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Edit3, 
  Plus, 
  Minus,
  MoreVertical,
  X,
  Calendar,
  Users,
  Filter
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useProject } from '../context/ProjectContext'; 
import { useScrumContext, Task } from '../context/ScrumContext';
import { supabase } from '../lib/supabase';

// Item types for drag and drop
const ItemTypes = {
  TASK: 'task'
};

const nrMembers = async (project_id) => {
  let { count, error } = await supabase
    .from('roles')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', project_id);

  if (error) {
    console.error(error);
    return 0;
  }
  return count || 0;
};

const CurrentSprint = () => {
  const { tasks, sprints, getCurrentSprint, moveTaskStatus, updateTask, fetchTasks, fetchSprints } = useScrumContext();
  const { currentProject, projectUsers  } = useProject(); // Get selected project
  const [membersCount, setMembersCount] = useState(0);

  useEffect(() => {
    fetchTasks();
    fetchSprints();
  }, []);

  useEffect(() => {
    const fetchMembersCount = async () => {
      if (currentProject?.id) {
        const count = await nrMembers(currentProject.id);
        setMembersCount(count ?? 0);
      }
    };

    fetchMembersCount();
  }, [currentProject]); // Re-fetch when project changes
  
  // Get current sprint
  const currentSprint = getCurrentSprint();
  
  // Filter tasks for current sprint
  const sprintTasks = currentSprint 
    ? tasks.filter(task => task.sprintId === currentSprint.id) 
    : [];
  
  // Group tasks by status
  const todoTasks = sprintTasks.filter(task => task.status === 'To Do');
  const inProgressTasks = sprintTasks.filter(task => task.status === 'In Progress');
  const reviewTasks = sprintTasks.filter(task => task.status === 'Review');
  const doneTasks = sprintTasks.filter(task => task.status === 'Done');
  
  // Calculate sprint progress
  const totalTasks = sprintTasks.length;
  const completedTasks = doneTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate story points
  const totalPoints = sprintTasks.reduce((sum, task) => sum + task.storyPoints, 0);
  const completedPoints = doneTasks.reduce((sum, task) => sum + task.storyPoints, 0);
  const pointsPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  
  // Task detail panel state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAssigneePanelOpen, setIsAssigneePanelOpen] = useState(false);


  const addAssignee = (displayName: string) => {
    setEditingTask((prev) => ({
      ...prev!,
      assignees: [...(prev?.assignees || []), displayName], // Append, don't overwrite
    }));
  };
  
  const removeAssignee = (displayName: string) => {
    setEditingTask((prev) => ({
      ...prev!,
      assignees: prev?.assignees.filter((name) => name !== displayName) || [], //  Properly remove selected user
    }));
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-50 text-blue-500';
      case 'Review':
        return 'bg-amber-50 text-amber-500';
      case 'Done':
        return 'bg-green-50 text-green-500';
      default:
        return 'bg-gray-50 text-gray-500';
    }
  };

  // Task card component with drag and drop
  const TaskCard = ({ task, index }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.TASK,
      item: { id: task.id, status: task.status },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }));
    
    // Priority helpers
    const getPriorityIcon = (priority) => {
      switch (priority) {
        case 'High':
          return <AlertCircle size={16} className="text-red-500" />;
        case 'Medium':
          return <Clock size={16} className="text-amber-500" />;
        case 'Low':
          return <CheckCircle2 size={16} className="text-green-500" />;
        default:
          return null;
      }
    };

    const getPriorityClass = (priority) => {
      switch (priority) {
        case 'High':
          return 'bg-red-50 text-red-700';
        case 'Medium':
          return 'bg-amber-50 text-amber-700';
        case 'Low':
          return 'bg-green-50 text-green-700';
        default:
          return 'bg-gray-50 text-gray-700';
      }
    };
    
    return (
      <div
        ref={drag}
        onClick={() => {
          setSelectedTask(task);
          setIsDetailPanelOpen(true);
          setIsEditMode(false); // Always open in View Mode first, not in edit mode
        }}
        className={`border border-gray-200 rounded-lg p-3 mb-3 bg-white shadow-sm cursor-pointer hover:shadow-md transition ${
          isDragging ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
            {getPriorityIcon(task.priority)}
            <span className="ml-1">{task.priority}</span>
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {task.storyPoints} points
          </span>
          {task.assignee ? (
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
                {task.assignee.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-xs text-gray-500 ml-2">{task.assignee}</span>
            </div>
          ) : (
            <div className="flex space-x-2">
            {Array.isArray(task.assignees) && task.assignees.length > 0 ? (
              task.assignees.map((name, index) => (
                <div 
                  key={index} 
                  className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600"
                >
                  {name.split(" ").map(n => n[0]).join("").toUpperCase()} {/* Convert names to initials */}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Unassigned</p> 
            )}
          </div>
          )}
        </div>
      </div>
    );
  };
  
  // Task column component with drop capability
  const TaskColumn = ({ title, tasks, status, icon }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.TASK,
      drop: (item) => {
        if (item.status !== status) {
          moveTaskStatus(item.id, status);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));
    
    return (
      <div className="flex-1 min-w-[250px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {icon}
            <h2 className="text-lg font-semibold text-gray-800 ml-2">{title}</h2>
            <span className="ml-2 bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Plus size={18} />
          </button>
        </div>
        <div
          ref={drop}
          className={`h-full min-h-[500px] p-3 rounded-lg ${
            isOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-300' : 'bg-gray-100'
          }`}
        >
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <p className="text-sm text-gray-500">No tasks</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Current Sprint</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          Complete Sprint
        </button>
      </div>
      
      {currentSprint ? (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4">
        {/* Compact Sprint Header */}
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div className="flex items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{currentSprint.name}</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar size={14} className="mr-1" />
                <span>
                  {format(new Date(currentSprint.startDate), 'MMM d')} - {format(new Date(currentSprint.endDate), 'MMM d, yyyy')}
                </span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <Users size={14} className="mr-1" />
                  {membersCount} members
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <div className="text-sm font-medium text-gray-600 mr-3">
              <span className="font-bold">{completedPoints}</span> of <span className="font-bold">{totalPoints}</span> points ({progressPercentage}%)
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
            </div>
          </div>
          
          <div className="flex overflow-x-auto pb-2" style={{ minHeight: "calc(100vh - 250px)" }}>
          <div className="flex space-x-4 w-full">
              <TaskColumn 
                title="To Do" 
                tasks={todoTasks} 
                status="To Do" 
                icon={<Clock size={20} className="text-gray-500" />} 
              />
              <TaskColumn 
                title="In Progress" 
                tasks={inProgressTasks} 
                status="In Progress" 
                icon={<ArrowRight size={20} className="text-blue-500" />} 
              />
              <TaskColumn 
                title="Review" 
                tasks={reviewTasks} 
                status="Review" 
                icon={<AlertCircle size={20} className="text-amber-500" />} 
              />
              <TaskColumn 
                title="Done" 
                tasks={doneTasks} 
                status="Done" 
                icon={<CheckCircle2 size={20} className="text-green-500" />} 
              />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Clock size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Sprint</h2>
          <p className="text-gray-600 mb-6">There is no active sprint currently. Start a new sprint from the Sprint Planning page.</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Go to Sprint Planning
          </button>
        </div>
      )}

    {isDetailPanelOpen && selectedTask && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setIsDetailPanelOpen(false)} // Close panel when clicking outside
       >
        <div
          className="fixed inset-y-0 right-0 bg-white shadow-xl w-full max-w-md flex flex-col"
          onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the panel
          > 
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {isEditMode ? "Edit Task" : "Task Details"}
              </h2>
              <button
                onClick={() => setIsDetailPanelOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
            </div>

            {/* Task Information */}
            <div className="flex-1 overflow-y-auto p-4">
              {!isEditMode ? (
                <>
                  {/* TASK DETAILS DISPLAY */}
                  <h3 className="text-xl font-medium text-gray-900">{selectedTask.title}</h3>

                  <div className="mt-2 flex items-center space-x-2">
                    {/* Priority */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${selectedTask.priority === 'High' ? 'bg-red-100 text-red-800' : 
                        selectedTask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}
                    >
                      {selectedTask.priority}
                    </span>

                    {/* Story Points */}
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {selectedTask.storyPoints} points
                    </span>

                    {/* Status */}
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusClass(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Description</h4>
                    <p className="mt-1 text-sm text-gray-600">{selectedTask.description || "No description provided"}</p>
                  </div>

                  {/* Assignees */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Assignees</h4>
                    {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {selectedTask.assignees.map(assignee => (
                          <div key={assignee} className="flex items-center p-2 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                              {assignee.split(' ').map(n => n[0]).join('')} {/* Initials */}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{assignee}</p>
                              <p className="text-xs text-gray-500">Team Member</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">No assignees</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* EDIT TASK PANEL */}
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={editingTask?.title || ""}
                        onChange={(e) => setEditingTask({ ...editingTask!, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={editingTask?.description || ""}
                        onChange={(e) => setEditingTask({ ...editingTask!, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      ></textarea>
                    </div>

                    {/* Priority & Story Points */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select
                          value={editingTask?.priority}
                          onChange={(e) => setEditingTask({ ...editingTask!, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Story Points</label>
                        <input
                          type="number"
                          value={editingTask?.storyPoints || 0}
                          onChange={(e) => setEditingTask({ ...editingTask!, storyPoints: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={editingTask?.status}
                        onChange={(e) => setEditingTask({ ...editingTask!, status: e.target.value as Task['status'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                      </select>
                      {/* Assignees Button */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assignees</label>
                        <button
                          className="w-full px-4 py-2 mt-1 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center hover:bg-indigo-100 border border-indigo-200"
                          onClick={() => setIsAssigneePanelOpen(true)} // Open the panel when clicked
                        >
                          <Users size={16} className="mr-2" 
                          /> Edit Assignees ({editingTask?.assignees?.length || 0})
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            {isEditMode ? (
              <div className="flex justify-between p-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateTask(editingTask!);  // Save changes
                    setSelectedTask(editingTask);  // Update UI
                    setIsEditMode(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <button
                className="w-1/2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mx-auto flex items-center justify-center mb-4"
                onClick={() => {
                  setEditingTask(selectedTask);
                  setIsEditMode(true);
                }}
              >
                 Edit Task
              </button>
            )}
          </div>
        </div>
      )}


      {isAssigneePanelOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={() => setIsAssigneePanelOpen(false)} // Close when clicking outside
  >
    <div
      className="fixed inset-y-0 right-0 bg-white shadow-xl w-full max-w-md flex flex-col"
      onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Manage Assignees</h2>
        <button onClick={() => setIsAssigneePanelOpen(false)} className="text-gray-500 hover:text-gray-700">
          ✖
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Users in Task */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">Users in Task ({editingTask?.assignees?.length || 0})</h4>
        {editingTask?.assignees && editingTask.assignees.length > 0 ? (
          editingTask.assignees.map((assignee) => (
            <div key={assignee} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                  {assignee.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{assignee}</p>
                  <p className="text-xs text-gray-500">Team Member</p>
                </div>
              </div>
              <button
                onClick={() => removeAssignee(assignee)}
                className="text-red-500 hover:text-red-700"
              >
                ➖
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No users assigned</p>
        )}

        {/* Available Users */}
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">
          Available Users ({projectUsers.filter(user => !editingTask?.assignees?.includes(user.display_name)).length})
          </h4>

        {projectUsers
          .filter(user => !editingTask?.assignees?.includes(user.display_name)) //  Only show unassigned users
          .map(user => (
            <div key={user.display_name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {user.display_name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.display_name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
              <button onClick={() => addAssignee(user.display_name)} className="text-indigo-500 hover:text-indigo-700">
                ➕
              </button>
            </div>
          ))} 
      </div>
    </div>
  </div>
)}



    </div>
  );
};

export default CurrentSprint;