
import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { AVATAR_COLORS } from '../constants';
import Avatar from './Avatar';
import TrashIcon from './icons/TrashIcon';

interface SettingsProps {
  familyMembers: FamilyMember[];
  onUpdateMembers: (members: FamilyMember[]) => void;
  onClose: () => void;
  familyGroupId: string | null;
  onCreateGroup: () => void;
  onJoinGroup: (id: string) => void;
  onLeaveGroup: () => void;
  isSyncing: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  familyMembers, 
  onUpdateMembers, 
  onClose,
  familyGroupId,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  isSyncing
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copyStatus, setCopyStatus] = useState('Copy Code');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMemberName.trim();
    if (name) {
      const newMember: FamilyMember = {
        id: Date.now(),
        name,
        avatar: {
          initial: name.charAt(0).toUpperCase(),
          color: AVATAR_COLORS[familyMembers.length % AVATAR_COLORS.length],
        },
      };
      onUpdateMembers([...familyMembers, newMember]);
      setNewMemberName('');
    }
  };

  const handleDeleteMember = (id: number) => {
    onUpdateMembers(familyMembers.filter(member => member.id !== id));
  };
  
  const handleCopyCode = () => {
    if (familyGroupId) {
        navigator.clipboard.writeText(familyGroupId);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy Code'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-40 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full p-2 transition-colors"
          aria-label="Close settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Family Settings</h2>

        {/* Cloud Sync Section */}
        <div className="mb-8 p-4 bg-sky-50 rounded-xl border border-sky-100">
            <h3 className="text-lg font-semibold text-sky-800 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                Cloud Sync
            </h3>
            
            {familyGroupId ? (
                <div className="space-y-3">
                    <p className="text-sm text-sky-700">
                        You are connected to a shared family group. Share this code with other family members to sync devices.
                    </p>
                    <div className="flex gap-2">
                        <code className="flex-grow p-2 bg-white border border-sky-200 rounded text-sm font-mono text-slate-600 truncate select-all">
                            {familyGroupId}
                        </code>
                        <button 
                            onClick={handleCopyCode}
                            className="bg-sky-200 text-sky-700 px-3 py-1 rounded hover:bg-sky-300 text-sm font-medium transition-colors"
                        >
                            {copyStatus}
                        </button>
                    </div>
                    <button 
                        onClick={onLeaveGroup}
                        className="w-full mt-2 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                        Disconnect from Cloud
                    </button>
                    {isSyncing && <p className="text-xs text-center text-slate-400">Syncing...</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-sky-700">
                        Sync your data across devices by creating a group or joining an existing one.
                    </p>
                    <button 
                        onClick={onCreateGroup}
                        disabled={isSyncing}
                        className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition disabled:opacity-50"
                    >
                        {isSyncing ? 'Creating...' : 'Create Shared Group'}
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="h-px bg-sky-200 flex-grow"></div>
                        <span className="text-xs text-sky-400 font-medium">OR JOIN</span>
                        <div className="h-px bg-sky-200 flex-grow"></div>
                    </div>
                    
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Paste Family Code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="flex-grow p-2 text-sm bg-white border border-sky-200 rounded focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        <button 
                            onClick={() => onJoinGroup(joinCode)}
                            disabled={!joinCode || isSyncing}
                            className="bg-white text-sky-600 border border-sky-200 font-bold py-2 px-4 rounded-lg hover:bg-sky-50 transition disabled:opacity-50"
                        >
                            {isSyncing ? '...' : 'Join'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Add New Member</h3>
          <form onSubmit={handleAddMember} className="flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Enter name"
              className="flex-grow p-3 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-slate-900 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="bg-sky-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all"
            >
              Add
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Current Members</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {familyMembers.length > 0 ? familyMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar initial={member.avatar.initial} color={member.avatar.color} />
                  <span className="font-medium text-slate-800">{member.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                  aria-label={`Remove ${member.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )) : (
              <p className="text-slate-500 text-center py-4">No family members yet. Add one above!</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
