import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { format, addDays, parseISO, isAfter, isBefore } from 'date-fns';
import { 
  Calendar, 
  Users, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Trash2, 
  Edit3,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useScrumContext, Task, Sprint } from '../context/ScrumContext';

// Item types for drag and drop
const ItemTypes = {
  TASK: 'task'
};

const SprintPlanning = () => {
  // Get data and functions from context
  const { 
    tasks, 
    sprints, 
    addSprint,
    updateSprint,
    deleteSprint,
    getBacklogTasks,
    assignTaskToSprint,
    removeTaskFromSprint,
    bulkAssignTasksToSprint
  } = useScrumContext();

  // State for sprint creation/editing
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  
  // State for task selection
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // State for expanded sprints
  const [expandedSprints, setExpandedSprints] = useState<string[]>([]);
  
  // New sprint form state
  const [newSprint, setNewSprint] = useState<Partial<Sprint>>({
    name: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    goal: '',
    capacity: 40,
    status: 'Planned'
  });

  // Get backlog tasks
  const backlogTasks = getBacklogTasks();
  
  // Handle adding a sprint
  const handleAddSprint = () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) return;
    
    if (isEditMode && selectedSprintId) {
      // Update existing sprint
      const sprintToUpdate = sprints.find(s => s.id === selectedSprintId);
      if (sprintToUpdate) {
        updateSprint({
          ...sprintToUpdate,
          name: newSprint.name || sprintToUpdate.name,
          description: newSprint.description || sprintToUpdate.description,
          startDate: newSprint.startDate || sprintToUpdate.startDate,
          endDate: newSprint.endDate || sprintToUpdate.endDate,
          goal: newSprint.goal || sprintToUpdate.goal,
          capacity: newSprint.capacity || sprintToUpdate.capacity,
          status: newSprint.status as 'Planned' | 'In Progress' | 'Completed' || sprintToUpdate.status
        });
      }
    } else {
      // Add new sprint
      addSprint({
        name: newSprint.name,
        description: newSprint.description || '',
        startDate: newSprint.startDate,
        endDate: newSprint.endDate,
        goal: newSprint.goal || '',
        capacity: newSprint.capacity || 40,
        status: newSprint.status as 'Planned' | 'In Progress' | 'Completed'
      });
    }
    
    // Reset form and close modal
    setNewSprint({
      name: '',
      description: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      goal: '',
      capacity: 40,
      status: 'Planned'
    });
    setIsSprintModalOpen(false);
    setIsEditMode(false);
    setSelectedSprintId(null);
  };

  // Handle editing a sprint
  const handleEditSprint = (sprint: Sprint) => {
    setNewSprint({
      name: sprint.name,
      description: sprint.description,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      goal: sprint.goal,
      capacity: sprint.capacity,
      status: sprint.status
    });
    setIsEditMode(true);
    setSelectedSprintId(sprint.id);
    setIsSprintModalOpen(true);
  };

  // Handle deleting a sprint
  const handleDeleteSprint = (sprintId: string) => {
    if (window.confirm('Are you sure you want to delete this sprint? All tasks will be moved back to the backlog.')) {
      deleteSprint(sprintId);
    }
  };

  // Handle toggling sprint expansion
  const toggleSprintExpansion = (sprintId: string) => {
    setExpandedSprints(prev => 
      prev.includes(sprintId) 
        ? prev.filter(id => id !== sprintId) 
        : [...prev, sprintId]
    );
  };

  // Handle selecting/deselecting tasks
  const toggleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  // Handle assigning selected tasks to a sprint
  const handleAssignTasksToSprint = (sprintId: string) => {
    if (selectedTasks.length === 0) return;
    
    bulkAssignTasksToSprint(selectedTasks, sprintId);
    setSelectedTasks([]);
  };

  // Priority helpers
  const getPriorityIcon = (priority: string) => {
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

  const getPriorityClass = (priority: string) => {
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

  // Draggable Task component
  const DraggableTask = ({ task }: { task: Task }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.TASK,
      item: { id: task.id },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }));

    return (
      <div 
        ref={drag}
        className={`relative border border-gray-200 rounded-lg p-3 mb-2 bg-white shadow-sm ${
          isDragging ? 'opacity-50' : 'opacity-100'
        } ${selectedTasks.includes(task.id) ? 'ring-2 ring-indigo-500' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.id)}
                onChange={() => toggleSelectTask(task.id)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
              />
              <h3 className="font-medium text-gray-900">{task.title}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(task.priority)}`}>
            {getPriorityIcon(task.priority)}
            <span className="ml-1">{task.priority}</span>
          </span>
        </div>
        
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
            <span className="text-xs text-gray-500">Unassigned</span>
          )}
        </div>
      </div>
    );
  };

  // Droppable Sprint component
  const DroppableSprint = ({ sprint }: { sprint: Sprint }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.TASK,
      drop: (item: { id: string }) => assignTaskToSprint(item.id, sprint.id),
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));

    const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
    const isExpanded = expandedSprints.includes(sprint.id);
    
    // Calculate total story points
    const totalPoints = sprintTasks.reduce((sum, task) => sum + task.storyPoints, 0);
    const capacityPercentage = Math.min(Math.round((totalPoints / sprint.capacity) * 100), 100);
    
    // Determine status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Planned':
          return 'bg-blue-100 text-blue-800';
        case 'In Progress':
          return 'bg-green-100 text-green-800';
        case 'Completed':
          return 'bg-purple-100 text-purple-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="mb-6 border rounded-lg border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => toggleSprintExpansion(sprint.id)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <div>
                <div className="flex items-center">
                  <Calendar size={18} className="text-indigo-600 mr-2" />
                  <h3 className="font-medium text-lg text-gray-900">{sprint.name}</h3>
                  <span className={`ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(sprint.status)}`}>
                    {sprint.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{sprint.startDate} to {sprint.endDate}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleEditSprint(sprint)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Edit3 size={18} />
              </button>
              <button 
                onClick={() => handleDeleteSprint(sprint.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-2">{sprint.goal}</p>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Capacity: {totalPoints}/{sprint.capacity} points</span>
              <span className="text-sm text-gray-600">{capacityPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${capacityPercentage >= 100 ? 'bg-red-600' : 'bg-indigo-600'}`} 
                style={{ width: `${capacityPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div 
            ref={drop} 
            className={`p-4 ${isOver ? 'bg-indigo-50' : 'bg-white'}`}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-800">Sprint Tasks ({sprintTasks.length})</h4>
              {selectedTasks.length > 0 && (
                <button
                  onClick={() => handleAssignTasksToSprint(sprint.id)}
                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                >
                  Add Selected ({selectedTasks.length})
                </button>
              )}
            </div>
            
            {sprintTasks.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
                Drag tasks here or use the "Add Selected" button to add tasks to this sprint
              </div>
            ) : (
              <div className="space-y-2">
                {sprintTasks.map(task => (
                  <div key={task.id} className="flex items-center border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{task.storyPoints} points</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeTaskFromSprint(task.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Sprint Planning</h1>
        <button
          onClick={() => {
            setIsEditMode(false);
            setSelectedSprintId(null);
            setNewSprint({
              name: '',
              description: '',
              startDate: format(new Date(), 'yyyy-MM-dd'),
              endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
              goal: '',
              capacity: 40,
              status: 'Planned'
            });
            setIsSprintModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Create Sprint
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sprints</h2>
            
            {sprints.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                No sprints created yet. Create a sprint to start planning.
              </div>
            ) : (
              <div className="space-y-4">
                {sprints.map(sprint => (
                  <DroppableSprint key={sprint.id} sprint={sprint} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Backlog</h2>
              {selectedTasks.length > 0 && (
                <button
                  onClick={() => setSelectedTasks([])}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear selection
                </button>
              )}
            </div>
            
            {backlogTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                No tasks in backlog. Add tasks from the Product Backlog page.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {backlogTasks.map(task => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Sprint Modal */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {isEditMode ? 'Edit Sprint' : 'Create New Sprint'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Name</label>
                  <input
                    type="text"
                    value={newSprint.name || ''}
                    onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Sprint 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newSprint.description || ''}
                    onChange={(e) => setNewSprint({ ...newSprint, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Brief description of the sprint"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newSprint.startDate || ''}
                      onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newSprint.endDate || ''}
                      onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Goal</label>
                  <input
                    type="text"
                    value={newSprint.goal || ''}
                    onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Complete user authentication features"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Story Points)</label>
                    <input
                      type="number"
                      value={newSprint.capacity || ''}
                      onChange={(e) => setNewSprint({ ...newSprint, capacity: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="40"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newSprint.status || 'Planned'}
                      onChange={(e) => setNewSprint({ ...newSprint, status: e.target.value as 'Planned' | 'In Progress' | 'Completed' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsSprintModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSprint}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {isEditMode ? 'Update Sprint' : 'Create Sprint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintPlanning;