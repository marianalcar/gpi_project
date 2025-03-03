import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  MoreVertical,
  Plus,
  Filter
} from 'lucide-react';
import { useScrumContext, Task } from '../context/ScrumContext';

// Item types for drag and drop
const ItemTypes = {
  TASK: 'task'
};

const CurrentSprint = () => {
  const { 
    tasks, 
    sprints, 
    getCurrentSprint, 
    moveTaskStatus, 
    updateTask 
  } = useScrumContext();
  
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
        className={`border border-gray-200 rounded-lg p-3 mb-3 bg-white shadow-sm ${
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
            <span className="text-xs text-gray-500">Unassigned</span>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Current Sprint</h1>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors">
            <Plus size={18} className="mr-2" />
            Add Task
          </button>
        </div>
      </div>
      
      {currentSprint ? (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{currentSprint.name}</h2>
                <p className="text-gray-500 mt-1">{currentSprint.startDate} to {currentSprint.endDate}</p>
                <p className="text-gray-700 mt-2">{currentSprint.goal}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-2">
                  <span className="text-gray-700 mr-2">Tasks:</span>
                  <span className="font-semibold">{completedTasks}/{totalTasks}</span>
                  <span className="text-gray-500 ml-2">({progressPercentage}%)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700 mr-2">Points:</span>
                  <span className="font-semibold">{completedPoints}/{totalPoints}</span>
                  <span className="text-gray-500 ml-2">({pointsPercentage}%)</span>
                </div>
                <div className="w-64 h-2 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-2 bg-indigo-600 rounded-full" 
                    style={{ width: `${pointsPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
            <div className="flex space-x-4 min-w-max">
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
    </div>
  );
};

export default CurrentSprint;