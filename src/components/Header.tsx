import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {useProject} from '../context/ProjectContext';
import ProjectSelector from './ProjectSelector';
import { supabase } from '../lib/supabase';

const Header = () => {
  const { user, signOut } = useAuth();
  const {currentRole} = useProject();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  //console.log(currentRole);
  //console.log(user);

   // Fetch display name when component loads
   useEffect(() => {
    const fetchDisplayName = async () => {
      if (user) {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          setDisplayName(data.user.user_metadata?.display_name || '');
        }
      }
    };

    fetchDisplayName();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  // Update display name in Supabase
  const updateDisplayName = async () => {
    if (!newDisplayName.trim() || !user) return;

    // Update Supabase Auth User Metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: newDisplayName },
    });

    if (authError) {
      console.error('Error updating auth display name:', authError);
      return;
    }

    // Check if user exists in the 'users' table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return;
    }

    if (existingUser) {
      // If user exists, update display name
      const { error: updateError } = await supabase
        .from('users')
        .update({ display_name: newDisplayName })
        .eq('auth_id', user.id);

      if (updateError) {
        console.error('Error updating display name in users table:', updateError);
      }
    } else {
      // If user does not exist, insert new record
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ auth_id: user.id, display_name: newDisplayName }]);

      if (insertError) {
        console.error('Error inserting new user:', insertError);
      }
    }

    setDisplayName(newDisplayName); // Update UI
    setNewDisplayName('');
    setIsSettingsOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between relative">
      <div className="flex items-center w-1/3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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

        {/* Settings Button */}
        <button className="p-2 rounded-full hover:bg-gray-100 relative" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
          <Settings size={20} className="text-gray-600" />
        </button>

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="absolute top-14 right-16 bg-white shadow-lg rounded-lg p-4 border border-gray-200 w-64 z-50">
            <h3 className="text-sm font-medium text-gray-700">Edit Display Name</h3>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter new name"
            />
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateDisplayName}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">{displayName || user?.email}</p>
            <p className="text-xs text-gray-500">{currentRole}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            title="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;