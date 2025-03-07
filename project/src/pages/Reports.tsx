import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { BarChart3, TrendingUp, Users, Calendar, Download, Filter } from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('velocity');
  const [dateRange, setDateRange] = useState('last30');
  
  // Sample data for reports
  const velocityData = [
    { sprint: 'Sprint 1', planned: 20, completed: 18 },
    { sprint: 'Sprint 2', planned: 22, completed: 20 },
    { sprint: 'Sprint 3', planned: 25, completed: 22 },
    { sprint: 'Sprint 4', planned: 24, completed: 23 },
    { sprint: 'Sprint 5', planned: 26, completed: 25 },
    { sprint: 'Sprint 6', planned: 28, completed: 26 },
    { sprint: 'Sprint 7', planned: 30, completed: 28 },
  ];
  
  const burndownData = [
    { day: 1, ideal: 40, actual: 40 },
    { day: 2, ideal: 37, actual: 39 },
    { day: 3, ideal: 34, actual: 38 },
    { day: 4, ideal: 31, actual: 35 },
    { day: 5, ideal: 28, actual: 32 },
    { day: 6, ideal: 25, actual: 28 },
    { day: 7, ideal: 22, actual: 25 },
    { day: 8, ideal: 19, actual: 20 },
    { day: 9, ideal: 16, actual: 18 },
    { day: 10, ideal: 13, actual: 15 },
  ];
  
  const teamPerformanceData = [
    { member: 'Alex Johnson', role: 'Product Owner', completed: 12, inProgress: 3 },
    { member: 'Emily Davis', role: 'Designer', completed: 15, inProgress: 2 },
    { member: 'Michael Brown', role: 'Developer', completed: 18, inProgress: 4 },
    { member: 'Sarah Williams', role: 'Developer', completed: 20, inProgress: 3 },
    { member: 'Robert Wilson', role: 'QA Engineer', completed: 14, inProgress: 2 },
  ];
  
  const sprintHistoryData = [
    { 
      id: 1, 
      name: 'Sprint 6', 
      dates: 'Feb 15 - Mar 1, 2025', 
      goal: 'Implement core authentication features',
      completedStories: 8,
      totalStories: 10,
      storyPoints: 26,
      velocity: 24
    },
    { 
      id: 2, 
      name: 'Sprint 5', 
      dates: 'Feb 1 - Feb 15, 2025', 
      goal: 'Complete user dashboard and reporting',
      completedStories: 7,
      totalStories: 9,
      storyPoints: 25,
      velocity: 22
    },
    { 
      id: 3, 
      name: 'Sprint 4', 
      dates: 'Jan 15 - Jan 31, 2025', 
      goal: 'Implement data visualization components',
      completedStories: 8,
      totalStories: 8,
      storyPoints: 23,
      velocity: 23
    },
    { 
      id: 4, 
      name: 'Sprint 3', 
      dates: 'Jan 1 - Jan 15, 2025', 
      goal: 'Create responsive layouts for all pages',
      completedStories: 6,
      totalStories: 8,
      storyPoints: 22,
      velocity: 18
    },
  ];

  // Format date for display
  const formatDateRange = () => {
    const today = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'last7':
        startDate = subDays(today, 7);
        break;
      case 'last30':
        startDate = subDays(today, 30);
        break;
      case 'last90':
        startDate = subDays(today, 90);
        break;
      default:
        startDate = subDays(today, 30);
    }
    
    return `${format(startDate, 'MMM d, yyyy')} - ${format(today, 'MMM d, yyyy')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <div className="flex items-center space-x-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
          </select>
          <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('velocity')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'velocity'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TrendingUp size={18} className="mr-2" />
                Velocity
              </div>
            </button>
            <button
              onClick={() => setActiveTab('burndown')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'burndown'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 size={18} className="mr-2" />
                Burndown
              </div>
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'team'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users size={18} className="mr-2" />
                Team Performance
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar size={18} className="mr-2" />
                Sprint History
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'velocity' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Sprint Velocity</h2>
                  <p className="text-sm text-gray-500">{formatDateRange()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Filter size={16} />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
              
              <div className="h-80 flex items-center justify-center border border-dashed border-gray-300 rounded-lg mb-6">
                <p className="text-gray-500">Velocity chart will be displayed here</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {velocityData.map((sprint, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sprint.sprint}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.planned}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.completed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Math.round((sprint.completed / sprint.planned) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'burndown' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Sprint Burndown</h2>
                  <p className="text-sm text-gray-500">Current Sprint (Sprint 7)</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option>Sprint 7</option>
                    <option>Sprint 6</option>
                    <option>Sprint 5</option>
                  </select>
                </div>
              </div>
              
              <div className="h-80 flex items-center justify-center border border-dashed border-gray-300 rounded-lg mb-6">
                <p className="text-gray-500">Burndown chart will be displayed here</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ideal Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {burndownData.map((day) => (
                      <tr key={day.day}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Day {day.day}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.ideal}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.actual}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={day.actual > day.ideal ? 'text-red-500' : 'text-green-500'}>
                            {day.actual - day.ideal > 0 ? '+' : ''}{day.actual - day.ideal}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Team Performance</h2>
                  <p className="text-sm text-gray-500">{formatDateRange()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Filter size={16} />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
              
              <div className="h-80 flex items-center justify-center border border-dashed border-gray-300 rounded-lg mb-6">
                <p className="text-gray-500">Team performance chart will be displayed here</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Tasks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamPerformanceData.map((member, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600 mr-3">
                              {member.member.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{member.member}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.completed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.inProgress}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Math.round((member.completed / (member.completed + member.inProgress)) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Sprint History</h2>
                  <p className="text-sm text-gray-500">{formatDateRange()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Filter size={16} />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sprintHistoryData.map((sprint) => (
                      <tr key={sprint.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sprint.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.dates}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.goal}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sprint.completedStories}/{sprint.totalStories} stories ({Math.round((sprint.completedStories / sprint.totalStories) * 100)}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.storyPoints}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.velocity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;