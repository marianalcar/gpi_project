import React, { useState, useEffect, useRef } from 'react';
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
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown
  interface Invitation {
    id: string;
    project_name: string;
    created_at: string;
    role: string;
  }

  const [invitations, setInvitations] = useState<Invitation[]>([]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsInvitationsOpen(false); // Close the dropdown
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchInvitations();

    // Optional: Polling mechanism to fetch invitations periodically
    const interval = setInterval(() => {
      fetchInvitations();
    }, 30000); // Fetch every 30 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const fetchInvitations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('project_invitations') // Replace with your actual table name
      .select('*')
      .eq('invited_user', user.email)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching invitations:', error);
    } else {
      setInvitations(data || []);
    }
  };

  // Toggle invitations dropdown
  const toggleInvitations = async () => {
    setIsInvitationsOpen(!isInvitationsOpen);
    if (!isInvitationsOpen) {
      await fetchInvitations(); // Fetch invitations when opening the dropdown
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    const { loadUserProjects } = useProject(); 
    try {
      const { data: invitation, error: fetchError } = await supabase
        .from('project_invitations')
        .select('project_id, invited_user, role')
        .eq('id', invitationId)
        .single();
  
      if (fetchError) {
        console.error('Error fetching invitation:', fetchError);
        return;
      }
  
      // Update the invitation status to 'accepted'
      const { error: updateError } = await supabase
        .from('project_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
  
      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        return;
      }
  
      const { error: insertError } = await supabase
      .from('roles') // Replace 'roles' with your actual table name
      .insert({
        project_id: invitation.project_id,
        auth_id: user?.id || '',
        role_type: invitation.role // Default to 'member' if no role is specified
      });

    if (insertError) {
      console.error('Error adding user to roles table:', insertError);
      return;
    }
  
  
      // Optionally, refresh the invitations list
      await fetchInvitations();
      await loadUserProjects();

      console.log('Invitation accepted and user added to the project.');
    } catch (error) {
      console.error('Error handling invitation acceptance:', error);
    }
  };

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

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('project_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error declining invitation:', error);
        return;
      }

      // Optionally, refresh the invitations list
      await fetchInvitations();

      console.log('Invitation declined.');
    } catch (error) {
      console.error('Error handling invitation decline:', error);
    }
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
        {/* Bell Button */}
        <div className="relative">
          <button
            className="p-2 rounded-full hover:bg-gray-100 relative"
            onClick={() => setIsInvitationsOpen(!isInvitationsOpen)}
          >
            <Bell size={20} className="text-gray-600" />
            {invitations.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {invitations.length}
              </span>
            )}
          </button>

          <div
            ref={dropdownRef}
            className={`absolute top-14 right-0 bg-white shadow-lg rounded-lg p-4 border border-gray-200 w-80 z-50 transform transition-transform duration-300 ${
              isInvitationsOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
            }`}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-2">Project Invitations</h3>
            {invitations.length > 0 ? (
              <ul className="space-y-2">
                {invitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <p className="text-sm text-gray-800">
                      You have been invited to project: {invitation.project_name} as {invitation.role}.
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(invitation.created_at).toLocaleString()}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                        onClick={() => handleDeclineInvitation(invitation.id)}
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No invitations</p>
            )}
          </div>
        </div>

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