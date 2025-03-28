import React, { useState, useEffect } from 'react';
import { format, subDays, parseISO, differenceInDays, addDays } from 'date-fns';
import { BarChart3, TrendingUp, Users, Calendar, Download, Filter } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useScrumContext, Sprint, Task } from '../context/ScrumContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


const Reports = () => {
    const [activeTab, setActiveTab] = useState('velocity');
    const { currentProject } = useProject();
    const { tasks, sprints, fetchTasks, fetchSprints } = useScrumContext();

    // Derived data states
    const [velocityData, setVelocityData] = useState<any[]>([]);
    const [burndownData, setburndownData] = useState<any[]>([]);
    const [currentSprintId, setCurrentSprintId] = useState<string>('');
    const [globalBurndownData, setGlobalBurndownData] = useState<any[]>([]);
    const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>('all');
    const [selectedTeamSprintFilter, setSelectedTeamSprintFilter] = useState<string>('all');

    // Fetch data when project changes
    useEffect(() => {
        if (currentProject) {
            fetchTasks();
            fetchSprints();
        }
    }, [currentProject, fetchTasks, fetchSprints]);

    // Set current sprint when sprints change
    useEffect(() => {
        if (sprints.length > 0) {
            const currentSprint = sprints.find(sprint => sprint.status === 'In Progress');
            if (currentSprint) {
                setCurrentSprintId(currentSprint.id);
            } else if (sprints.length > 0) {
                // Default to the most recent sprint if none are in progress
                setCurrentSprintId(sprints[0].id);
            }
        }
    }, [sprints]);

    // Calculate velocity data when tasks or sprints change
    useEffect(() => {
        if (!currentProject || sprints.length === 0) return;

        // Group completed tasks by sprint
        const sprintData = sprints
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map(sprint => {
                const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
                const totalPoints = sprintTasks.reduce((sum, task) => sum + task.storyPoints, 0);
                const completedTasks = sprintTasks.filter(task => task.status === 'Done');
                const completedPoints = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0);

                return {
                    sprint: sprint.name,
                    planned: totalPoints,
                    completed: completedPoints,
                    completionRate: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
                };
            });

        setVelocityData(sprintData);
    }, [currentProject, tasks, sprints]);

    // Calculate burndown data when tasks or current sprint changes
    useEffect(() => {
        if (!currentProject || tasks.length === 0) return;

        // Get tasks based on filter (all project tasks or specific sprint)
        let filteredTasks = tasks.filter(task => task.projectId === currentProject.id);

        // Apply sprint filter if one is selected
        if (selectedSprintFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.sprintId === selectedSprintFilter);
        }

        const totalPoints = filteredTasks.reduce((sum, task) => sum + task.storyPoints, 0);

        // Determine date range
        let startDate = new Date();
        let endDate = new Date();

        if (selectedSprintFilter !== 'all' && sprints.length > 0) {
            // If a specific sprint is selected, use its dates
            const selectedSprint = sprints.find(s => s.id === selectedSprintFilter);
            if (selectedSprint) {
                startDate = parseISO(selectedSprint.startDate);
                endDate = parseISO(selectedSprint.endDate);
            }
        } else if (sprints.length > 0) {
            // For all tasks, use the full project timeline from earliest sprint to latest
            const sprintStartDates = sprints.map(s => new Date(s.startDate));
            const sprintEndDates = sprints.map(s => new Date(s.endDate));
            startDate = new Date(Math.min(...sprintStartDates.map(d => d.getTime())));
            endDate = new Date(Math.max(...sprintEndDates.map(d => d.getTime())));
        } else {
            // Fallback to a 30-day range if no sprints
            startDate = subDays(new Date(), 30);
            endDate = addDays(new Date(), 30);
        }

        // Create daily burndown data
        const totalDays = differenceInDays(endDate, startDate) + 1;

        // Ideal burndown (straight line)
        const idealDailyBurn = totalPoints / totalDays;

        // Calculate burndown points for each day
        const burndownPoints = [];

        for (let i = 0; i <= totalDays; i++) {
            const currentDate = addDays(new Date(startDate), i);
            const formattedDate = format(currentDate, 'MMM d');

            // Calculate ideal remaining
            const idealRemaining = Math.max(0, totalPoints - (idealDailyBurn * i));

            // For all dates, calculate actual remaining based on completedAt
            let actualRemaining = totalPoints;

            // Filter tasks that were completed on or before the current date
            const completedTasks = filteredTasks.filter(task => {
                if (task.status !== 'Done' || !task.completedAt) {
                    return false;
                }

                // Parse completedAt date and compare with currentDate
                const completionDate = parseISO(task.completedAt);
                return completionDate <= currentDate;
            });

            const completedPoints = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0);
            actualRemaining = totalPoints - completedPoints;

            // For future dates, use the last known actual value
            if (currentDate > new Date()) {
                // Keep the last known actual value from today
                // This will create a flat line from today to the end date
            }

            burndownPoints.push({
                day: i + 1,
                date: formattedDate,
                ideal: Math.round(idealRemaining * 10) / 10,
                actual: Math.round(actualRemaining * 10) / 10,
                difference: Math.round((actualRemaining - idealRemaining) * 10) / 10
            });
        }

        setGlobalBurndownData(burndownPoints);
    }, [currentProject, tasks, sprints, selectedSprintFilter]);

    // Get team performance data
    // Substitua a função getTeamPerformanceData() existente por esta:
    const getTeamPerformanceData = () => {
        if (!tasks.length) return [];

        const filteredTasks = selectedTeamSprintFilter === 'all'
            ? tasks
            : tasks.filter(task => task.sprintId === selectedTeamSprintFilter);

        const assigneeMap = new Map();

        filteredTasks.forEach(task => {
            if (!task.assignees || task.assignees.length === 0) return;

            task.assignees.forEach(assignee => {
                if (!assigneeMap.has(assignee)) {
                    assigneeMap.set(assignee, {
                        member: assignee,
                        role: 'Team Member',
                        completed: 0,
                        completedPoints: 0,
                        inProgress: 0,
                        inProgressPoints: 0,
                        total: 0,
                        totalPoints: 0
                    });
                }

                const userData = assigneeMap.get(assignee);

                if (task.status === 'Done') {
                    userData.completed += 1;
                    userData.completedPoints += task.storyPoints;
                } else if (task.status === 'In Progress' || task.status === 'Review') {
                    userData.inProgress += 1;
                    userData.inProgressPoints += task.storyPoints;
                }

                userData.total += 1;
                userData.totalPoints += task.storyPoints;
            });
        });

        return Array.from(assigneeMap.values());
    };

    // Get sprint history data
    const getSprintHistoryData = () => {
        return sprints.map(sprint => {
            const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
            const totalTasks = sprintTasks.length;
            const completedTasks = sprintTasks.filter(task => task.status === 'Done').length;
            const storyPoints = sprintTasks.reduce((sum, task) => sum + task.storyPoints, 0);
            const completedPoints = sprintTasks
                .filter(task => task.status === 'Done')
                .reduce((sum, task) => sum + task.storyPoints, 0);

            return {
                id: sprint.id,
                name: sprint.name,
                dates: `${format(parseISO(sprint.startDate), 'MMM d')} - ${format(parseISO(sprint.endDate), 'MMM d, yyyy')}`,
                goal: sprint.goal,
                completedStories: completedTasks,
                totalStories: totalTasks,
                storyPoints: storyPoints,
                velocity: completedPoints
            };
        }).sort((a, b) => a.name.localeCompare(b.name))
    };

    const exportToPDF = (chartId, chartName) => {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) return;

        html2canvas(chartElement).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${currentProject?.name || 'project'}-${chartName}.pdf`);
        });
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
                <div className="flex items-center space-x-3">
                    <button
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                            if (activeTab === 'velocity') {
                                exportToPDF('velocity-chart', 'velocity-chart');
                            } else if (activeTab === 'burndown') {
                                exportToPDF('burndown-chart', 'burndown-chart');
                            } else if (activeTab === 'team') {
                                exportToPDF('team-performance-chart', 'team-performance-chart');
                            }
                        }}
                    >
                        <Download size={16} />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('velocity')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'velocity'
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
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'burndown'
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
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'team'
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
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'history'
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
                                </div>
                            </div>

                            {velocityData.length > 0 ? (
                                <div className="h-80 mb-6" id="velocity-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={velocityData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="sprint" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="planned" name="Planned Points" fill="#8884d8" />
                                            <Bar dataKey="completed" name="Completed Points" fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-80 flex items-center justify-center border border-dashed border-gray-300 rounded-lg mb-6">
                                    <p className="text-gray-500">No velocity data available. Complete some sprints to see your team's velocity.</p>
                                </div>
                            )}

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
                                        {velocityData.length > 0 ? velocityData.map((sprint, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sprint.sprint}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.planned}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.completed}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {sprint.completionRate}%
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No sprint data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'burndown' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {selectedSprintFilter === 'all' ? 'Project Burndown' : 'Sprint Burndown'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {selectedSprintFilter === 'all'
                                            ? (currentProject ? currentProject.name : 'No project selected')
                                            : (sprints.find(s => s.id === selectedSprintFilter)?.name || 'No sprint selected')}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <select
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={selectedSprintFilter}
                                        onChange={(e) => setSelectedSprintFilter(e.target.value)}
                                    >
                                        <option value="all">All Project Tasks</option>
                                        {sprints
                                            .slice() // Cria uma cópia do array para não modificar o original
                                            .sort((a, b) => {
                                                // Ordenação consistente por nome ou ID (resolve o problema de piscar)
                                                return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
                                            })
                                            .map(sprint => (
                                                <option key={sprint.id} value={sprint.id}>
                                                    {sprint.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            {globalBurndownData.length > 0 ? (
                                <div className="h-80 mb-6" id="burndown-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={globalBurndownData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
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
                                                activeDot={{ r: 8 }}
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
                                <div className="h-80 flex items-center justify-center border border-dashed border-gray-300 rounded-lg mb-6">
                                    <p className="text-gray-500">
                                        {selectedSprintFilter === 'all'
                                            ? 'No burndown data available. Add tasks to see the project burndown chart.'
                                            : 'No burndown data available for this sprint. Add tasks to see the sprint burndown chart.'}
                                    </p>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ideal Remaining</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Remaining</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {globalBurndownData.length > 0 ? globalBurndownData.map((day) => (
                                            <tr key={day.day}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Day {day.day}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.ideal}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.actual}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={day.difference > 0 ? 'text-red-500' : 'text-green-500'}>
                                                        {day.difference > 0 ? '+' : ''}{day.difference}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No burndown data available
                                                </td>
                                            </tr>
                                        )}
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
                                    <p className="text-sm text-gray-500">
                                        {selectedTeamSprintFilter === 'all'
                                            ? 'All Project Tasks'
                                            : `Sprint: ${sprints.find(s => s.id === selectedTeamSprintFilter)?.name || ''}`}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <select
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={selectedTeamSprintFilter}
                                        onChange={(e) => setSelectedTeamSprintFilter(e.target.value)}
                                    >
                                        <option value="all">All Project</option>
                                        {sprints
                                            .slice() // Cria cópia para não alterar o array original
                                            .sort((a, b) => a.name.localeCompare(b.name)) // Ordenação A-Z
                                            .map(sprint => (
                                                <option key={sprint.id} value={sprint.id}>
                                                    {sprint.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            {getTeamPerformanceData().length > 0 ? (
                                <div className="h-80 mb-6" id="team-performance-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={getTeamPerformanceData()}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            layout="vertical"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="member" type="category" width={150} />
                                            <Tooltip
                                                formatter={(value, name) => [`${value} points`, name]}
                                                labelFormatter={() => ''}
                                            />
                                            <Legend />
                                            <Bar dataKey="completedPoints" name="Completed Points" stackId="a" fill="#4ade80" />
                                            <Bar dataKey="inProgressPoints" name="In Progress Points" stackId="a" fill="#818cf8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-80 flex items-center justify-center border border-dashed border-gray-300 rounded-lg mb-6">
                                    <p className="text-gray-500">No team performance data available. Assign tasks to team members to see performance metrics.</p>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Points</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress Points</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getTeamPerformanceData().length > 0 ? getTeamPerformanceData().map((member, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600 mr-3">
                                                            {member.member.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{member.member}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.completedPoints}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.inProgressPoints}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {Math.round((member.completedPoints / member.totalPoints) * 100) || 0}%
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No team performance data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-800">Sprint History</h2>
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
                                        {getSprintHistoryData().length > 0 ? getSprintHistoryData().map((sprint) => (
                                            <tr key={sprint.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sprint.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.dates}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.goal}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {sprint.completedStories}/{sprint.totalStories} stories ({Math.round((sprint.completedStories / sprint.totalStories) * 100) || 0}%)
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.storyPoints}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sprint.velocity}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No sprint history available
                                                </td>
                                            </tr>
                                        )}
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