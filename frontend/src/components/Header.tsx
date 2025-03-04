import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import ProjectSelector from './ProjectSelector';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center w-1/3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1 /2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <ProjectSelector />
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Settings size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">JD</span>
          </div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-gray-500">Scrum Master</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;