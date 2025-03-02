import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Calendar, Footprints as Sprint, BarChart3 } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/product-backlog', name: 'Product Backlog', icon: <ListTodo size={20} /> },
    { path: '/sprint-planning', name: 'Sprint Planning', icon: <Calendar size={20} /> },
    { path: '/current-sprint', name: 'Current Sprint', icon: <Sprint size={20} /> },
    { path: '/reports', name: 'Reports', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="w-64 bg-indigo-800 text-white flex flex-col h-full">
      <div className="p-5 border-b border-indigo-700">
        <div className="flex items-center space-x-3">
          <Sprint size={28} />
          <h1 className="text-xl font-bold">Scrum Planner</h1>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-5 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-900 text-white'
                      : 'text-indigo-100 hover:bg-indigo-700'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-indigo-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-sm font-medium">SP</span>
          </div>
          <div>
            <p className="text-sm font-medium">Scrum Team</p>
            <p className="text-xs text-indigo-300">Agile Project</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;