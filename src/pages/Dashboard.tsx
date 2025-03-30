import React, { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays, subDays, addDays, formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  TrendingUp 
} from 'lucide-react';
import { useScrumContext } from '../context/ScrumContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { tasks, sprints, getCurrentSprint } = useScrumContext();
  const currentDate = format(new Date(), 'MMMM d, yyyy');
  
  // Get current sprint
  const currentSprint = getCurrentSprint();
  
  // Calculate metrics
  const sprintTasks = currentSprint ? tasks.filter(task => task.sprintId === currentSprint.id) : [];
  const completedTasks = sprintTasks.filter(task => task.status === 'Done');
  const completionRate = sprintTasks.length > 0 
    ? Math.round((completedTasks.length / sprintTasks.length) * 100) 
    : 0;
  
  const backlogItems = tasks.filter(task => !task.sprintId);
  const highPriorityBacklog = backlogItems.filter(task => task.priority === 'High');
  
  // Calculate team velocity (average of last 3 sprints)
  const completedSprints = sprints
    .filter(sprint => sprint.status === 'Completed')
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 3);
  
  const velocity = completedSprints.length > 0
    ? Math.round(completedSprints.reduce((sum, sprint) => {
        const sprintCompletedTasks = tasks
          .filter(task => task.sprintId === sprint.id && task.status === 'Done');
        return sum + sprintCompletedTasks.reduce((points, task) => points + task.storyPoints, 0);
      }, 0) / completedSprints.length)
    : 0;

  // Burndown chart logic
  const [burndownData, setBurndownData] = useState([]);

  useEffect(() => {
    if (!currentSprint || sprintTasks.length === 0) return;
    
    const totalPoints = sprintTasks.reduce((sum, task) => sum + task.storyPoints, 0);
    const startDate = parseISO(currentSprint.startDate);
    const endDate = parseISO(currentSprint.endDate);
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const idealDailyBurn = totalPoints / totalDays;

    const burndownPoints = [];

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const idealRemaining = Math.max(0, totalPoints - (idealDailyBurn * i));

      let actualRemaining = totalPoints;

      // Calculate actual remaining points up to the current date
      const completedTasks = sprintTasks.filter(task => {
        return task.status === 'Done' && task.completedAt && new Date(task.completedAt) <= currentDate;
      });

      const completedPoints = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0);
      actualRemaining = totalPoints - completedPoints;

      burndownPoints.push({
        day: i + 1,
        date: format(currentDate, 'MMM d'),
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: Math.round(actualRemaining * 10) / 10,
        difference: Math.round((actualRemaining - idealRemaining) * 10) / 10,
      });
    }

    setBurndownData(burndownPoints);
  }, [currentSprint, sprintTasks]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center text-gray-500">
          <Calendar size={18} className="mr-2" />
          <span>{currentDate}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Current Sprint" 
          value={currentSprint ? currentSprint.name : "No Active Sprint"} 
          subtitle={currentSprint ? `Ends in ${Math.ceil((new Date(currentSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` : "Start a sprint in planning"} 
          icon={<Clock className="text-blue-500" size={24} />} 
          color="blue"
        />
        <DashboardCard 
          title="Completed Tasks" 
          value={`${completedTasks.length}/${sprintTasks.length}`} 
          subtitle={`${completionRate}% completion rate`} 
          icon={<CheckCircle2 className="text-green-500" size={24} />} 
          color="green"
        />
        <DashboardCard 
          title="Backlog Items" 
          value={backlogItems.length.toString()} 
          subtitle={`${highPriorityBacklog.length} high priority`} 
          icon={<AlertCircle className="text-amber-500" size={24} />} 
          color="amber"
        />
        <DashboardCard 
          title="Team Velocity" 
          value={`${velocity} pts`} 
          subtitle={completedSprints.length > 0 ? `Based on ${completedSprints.length} sprints` : "No completed sprints yet"} 
          icon={<TrendingUp className="text-purple-500" size={24} />} 
          color="purple"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sprint Burndown</h2>
          </div>
          {burndownData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="Ideal Burndown"
                    stroke="#8884d8"
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Remaining"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No burndown data available</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
            <button className="text-indigo-600 text-sm font-medium">View All</button>
          </div>
                <div className="space-y-4">
                    {tasks
                        .filter(task => task.assignees && task.assignees.length > 0)
                        .reduce<Array<{ name: string; tasks: number }>>((members, task) => { // Add type annotation
                            task.assignees?.forEach(assignee => {
                                if (!members.find(m => m.name === assignee)) {
                                    members.push({
                                        name: assignee,
                                        tasks: tasks.filter(t => t.assignees?.includes(assignee)).length
                                    });
                                }
                            });
                            return members;
                        }, [])
                        .map((member, index) => (
                            <TeamMember
                                key={index}
                                name={member.name}
                                role="Team Member"
                                tasks={member.tasks}
                            />
                        ))}
                </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Upcoming Tasks</h2>
            <button className="text-indigo-600 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {sprintTasks
              .filter(task => task.status !== 'Done')
              .sort((a, b) => {
                // Sort by priority (High > Medium > Low)
                const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .slice(0, 4)
              .map(task => (
                <Task 
                  key={task.id}
                  title={task.title} 
                  priority={task.priority} 
                  dueDate={task.status} 
                  assignee={task.assignee || "Unassigned"}
                />
              ))}
            {sprintTasks.filter(task => task.status !== 'Done').length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No upcoming tasks</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
            <button className="text-indigo-600 text-sm font-medium">View All</button>
          </div>
                <div className="space-y-4">
                    {tasks
                        .filter(task => task.status === 'Done' && task.completedAt)
                        .sort((a, b) =>
                            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                        )
                        .slice(0, 4)
                        .map(task => (
                            <Activity
                                key={task.id}
                                user={task.assignees?.join(', ') || "Unassigned"}
                                action="completed task"
                                item={task.title}
                                time={formatDistanceToNow(new Date(task.completedAt)) + " ago"}
                            />
                        ))}
                </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`h-12 w-12 rounded-full bg-${color}-100 flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const TeamMember = ({ name, role, tasks }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
          <span className="text-xs font-medium text-indigo-600">
            {name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
      <div className="flex items-center">
        <Users size={14} className="text-gray-400 mr-1" />
        <span className="text-xs text-gray-500">{tasks} tasks</span>
      </div>
    </div>
  );
};

const Task = ({ title, priority, dueDate, assignee }) => {
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-amber-500 bg-amber-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <div className="flex items-center mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(priority)}`}>
            {priority}
          </span>
          <span className="text-xs text-gray-500 ml-2">{dueDate}</span>
        </div>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
          {assignee.split(' ')[0][0]}{assignee.split(' ')[1] ? assignee.split(' ')[1][0] : ''}
        </div>
      </div>
    </div>
  );
};

const Activity = ({ user, action, item, time, detail }) => {
  return (
    <div className="flex">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
        <span className="text-xs font-medium text-indigo-600">
          {user.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
      <div>
        <p className="text-sm">
          <span className="font-medium">{user}</span> {action} <span className="font-medium">{item}</span>
          {detail && <span className="text-gray-500"> {detail}</span>}
        </p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

export default Dashboard;