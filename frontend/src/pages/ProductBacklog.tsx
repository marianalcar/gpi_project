import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Plus, Filter, Search, MoreVertical, AlertCircle, Clock, CheckCircle2, Trash2, FolderOpen, X } from 'lucide-react';
import { useScrumContext, Task, Story } from '../context/ScrumContext';

// Item types for drag and drop
const ItemTypes = {
  TASK: 'task',
  STORY: 'story'
};

const ProductBacklog = () => {
  // Get data and functions from context
  const { 
    tasks, 
    stories, 
    addTask, 
    updateTask, 
    deleteTask, 
    addStory, 
    deleteStory, 
    assignTaskToStory, 
    removeTaskFromStory,
    getBacklogTasks
  } = useScrumContext();

  // Get only backlog tasks (not assigned to any sprint)
  const backlogItems = getBacklogTasks();

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  // Selected items for deletion
  const [selectedItems, setSelectedItems] = useState<{tasks: string[], stories: string[]}>({
    tasks: [],
    stories: []
  });

  // New task/story states
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'Medium',
    storyPoints: 0,
    status: 'New'
  });

  const [newStory, setNewStory] = useState<Partial<Story>>({
    title: '',
    description: '',
    status: 'New'
  });

  // Handle adding a task
  const handleAddTask = () => {
    if (!newTask.title) return;
    
    addTask({
      title: newTask.title,
      description: newTask.description || '',
      priority: newTask.priority as 'High' | 'Medium' | 'Low',
      storyPoints: newTask.storyPoints || 0,
      status: newTask.status as 'New' | 'Ready' | 'In Sprint',
      assignee: newTask.assignee,
      storyId: newTask.storyId
    });
    
    setNewTask({
      title: '',
      description: '',
      priority: 'Medium',
      storyPoints: 0,
      status: 'New'
    });
    setIsTaskModalOpen(false);
  };

  // Handle adding a story
  const handleAddStory = () => {
    if (!newStory.title) return;
    
    addStory({
      title: newStory.title,
      description: newStory.description || '',
      status: newStory.status as 'New' | 'Ready' | 'In Sprint',
    });
    
    setNewStory({
      title: '',
      description: '',
      status: 'New'
    });
    setIsStoryModalOpen(false);
  };

  // Handle assigning a task to a story via drag and drop
  const handleAssignTaskToStory = (taskId: string, storyId: string) => {
    assignTaskToStory(taskId, storyId);
  };

  // Handle removing a task from a story
  const handleRemoveTaskFromStory = (taskId: string) => {
    removeTaskFromStory(taskId);
  };

  // Handle selecting/deselecting items for deletion
  const toggleSelectTask = (taskId: string) => {
    setSelectedItems(prev => {
      if (prev.tasks.includes(taskId)) {
        return { ...prev, tasks: prev.tasks.filter(id => id !== taskId) };
      } else {
        return { ...prev, tasks: [...prev.tasks, taskId] };
      }
    });
  };

  const toggleSelectStory = (storyId: string) => {
    setSelectedItems(prev => {
      if (prev.stories.includes(storyId)) {
        return { ...prev, stories: prev.stories.filter(id => id !== storyId) };
      } else {
        return { ...prev, stories: [...prev.stories, storyId] };
      }
    });
  };

  // Handle deleting selected items
  const handleDeleteSelected = () => {
    // Delete selected tasks
    selectedItems.tasks.forEach(taskId => {
      deleteTask(taskId);
    });
    
    // Delete selected stories
    selectedItems.stories.forEach(storyId => {
      deleteStory(storyId);
    });
    
    // Clear selection
    setSelectedItems({ tasks: [], stories: [] });
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700';
      case 'Ready':
        return 'bg-purple-50 text-purple-700';
      case 'In Sprint':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  // Draggable Task component
  const DraggableTask = ({ task, inStory = false }: { task: Task, inStory?: boolean }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.TASK,
      item: { id: task.id, storyId: task.storyId },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }));

    return (
      <div 
        ref={drag}
        className={`relative border border-gray-200 rounded-lg p-3 mb-2 bg-white shadow-sm ${
          isDragging ? 'opacity-50' : 'opacity-100'
        } ${selectedItems.tasks.includes(task.id) ? 'ring-2 ring-indigo-500' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.tasks.includes(task.id)}
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
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {task.storyPoints} points
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(task.status)}`}>
              {task.status}
            </span>
          </div>
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
        
        {inStory && (
          <button 
            onClick={() => handleRemoveTaskFromStory(task.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  };

  // Droppable Story component
  const DroppableStory = ({ story }: { story: Story }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.TASK,
      drop: (item: { id: string }) => handleAssignTaskToStory(item.id, story.id),
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));

    const storyTasks = backlogItems.filter(task => task.storyId === story.id);

    return (
      <div 
        className={`mb-6 border rounded-lg ${
          selectedItems.stories.includes(story.id) ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-gray-200'
        } ${isOver ? 'bg-indigo-50' : 'bg-white'}`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.stories.includes(story.id)}
                onChange={() => toggleSelectStory(story.id)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
              />
              <div>
                <div className="flex items-center">
                  <FolderOpen size={18} className="text-indigo-600 mr-2" />
                  <h3 className="font-medium text-lg text-gray-900">{story.title}</h3>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusClass(story.status)}`}>
                  {story.status}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {storyTasks.length} tasks | {storyTasks.reduce((sum, task) => sum + task.storyPoints, 0)} points
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{story.description}</p>
        </div>
        
        <div ref={drop} className="p-4">
          {storyTasks.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
              Drag tasks here to assign them to this story
            </div>
          ) : (
            <div className="space-y-2">
              {storyTasks.map(task => (
                <DraggableTask key={task.id} task={task} inStory={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Droppable Backlog area
  const BacklogDropArea = () => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.TASK,
      drop: (item: { id: string, storyId?: string }) => {
        if (item.storyId) {
          handleRemoveTaskFromStory(item.id);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));

    const unassignedTasks = backlogItems.filter(task => !task.storyId);

    return (
      <div 
        ref={drop} 
        className={`mt-6 p-4 border border-gray-200 rounded-lg ${isOver ? 'bg-gray-50' : 'bg-white'}`}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Unassigned Tasks</h2>
        {unassignedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            All tasks are assigned to stories
          </div>
        ) : (
          <div className="space-y-2">
            {unassignedTasks.map(task => (
              <DraggableTask key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Product Backlog</h1>
        <div className="flex space-x-3">
          {(selectedItems.tasks.length > 0 || selectedItems.stories.length > 0) && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} className="mr-2" />
              Delete Selected ({selectedItems.tasks.length + selectedItems.stories.length})
            </button>
          )}
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search backlog items..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Filter size={16} />
                <span>Filter</span>
              </button>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>All Items</option>
                <option>Stories Only</option>
                <option>Tasks Only</option>
                <option>High Priority</option>
                <option>Ready for Sprint</option>
                <option>New Items</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Stories</h2>
          
          {stories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg mb-6">
              No stories created yet. Add a story to organize your tasks.
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map(story => (
                <DroppableStory key={story.id} story={story} />
              ))}
            </div>
          )}
          
          <BacklogDropArea />
        </div>
      </div>

      {/* Choose Item Type Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add to Backlog</h2>
              <p className="text-gray-600 mb-6">Choose the type of item you want to add to your backlog.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setIsAddItemModalOpen(false);
                    setIsTaskModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                    <CheckCircle2 size={24} className="text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Task</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">Individual work items with story points</p>
                </button>
                
                <button
                  onClick={() => {
                    setIsAddItemModalOpen(false);
                    setIsStoryModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                    <FolderOpen size={24} className="text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Story</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">Group of related tasks with a common goal</p>
                </button>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Task</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newTask.title || ''}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter task description"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newTask.priority || 'Medium'}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
                    <input
                      type="number"
                      value={newTask.storyPoints || ''}
                      onChange={(e) => setNewTask({ ...newTask, storyPoints: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newTask.status || 'New'}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value as 'New' | 'Ready' | 'In Sprint' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="New">New</option>
                      <option value="Ready">Ready</option>
                      <option value="In Sprint">In Sprint</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee (Optional)</label>
                    <input
                      type="text"
                      value={newTask.assignee || ''}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Story (Optional)</label>
                  <select
                    value={newTask.storyId || ''}
                    onChange={(e) => setNewTask({ ...newTask, storyId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">None (Unassigned)</option>
                    {stories.map(story => (
                      <option key={story.id} value={story.id}>{story.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Story</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newStory.title || ''}
                    onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter story title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newStory.description || ''}
                    onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter story description"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newStory.status || 'New'}
                    onChange={(e) => setNewStory({ ...newStory, status: e.target.value as 'New' | 'Ready' | 'In Sprint' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="New">New</option>
                    <option value="Ready">Ready</option>
                    <option value="In Sprint">In Sprint</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsStoryModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductBacklog;