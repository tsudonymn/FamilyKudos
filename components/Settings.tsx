import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { AVATAR_COLORS } from '../constants';
import Avatar from './Avatar';
import TrashIcon from './icons/TrashIcon';

interface SettingsProps {
  familyMembers: FamilyMember[];
  onUpdateMembers: (members: FamilyMember[]) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ familyMembers, onUpdateMembers, onClose }) => {
  const [newMemberName, setNewMemberName] = useState('');

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

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-40 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
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
