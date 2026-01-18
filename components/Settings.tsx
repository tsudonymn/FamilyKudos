import React, { useState, useEffect } from 'react';
import { FamilyMember } from '../types';
import { AVATAR_COLORS } from '../constants';
import Avatar from './Avatar';
import TrashIcon from './icons/TrashIcon';

interface SettingsProps {
  familyMembers: FamilyMember[];
  quickTaskSeeds: string[];
  onUpdateMembers: (members: FamilyMember[]) => void;
  onUpdateSeeds: (seeds: string[]) => void;
  onClose: () => void;
  familyGroupId: string | null;
  onCreateGroup: () => void;
  onJoinGroup: (id: string) => void;
  onLeaveGroup: () => void;
  isSyncing: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  familyMembers, 
  quickTaskSeeds,
  onUpdateMembers, 
  onUpdateSeeds,
  onClose,
  familyGroupId,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  isSyncing
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [newSeedText, setNewSeedText] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copyStatus, setCopyStatus] = useState('Copy Code');
  
  // Environment Config State
  const [showEnvConfig, setShowEnvConfig] = useState(false);
  const [envConfigInput, setEnvConfigInput] = useState('');
  const [isSavingEnv, setIsSavingEnv] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('familyKudos_envConfig');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            const formatted = Object.entries(parsed)
                .map(([k, v]) => `${k}=${v}`)
                .join('\n');
            setEnvConfigInput(formatted);
        } catch(e) {}
    }
  }, []);

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

  const handleAddSeed = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newSeedText.trim();
    if (text && !quickTaskSeeds.includes(text)) {
      onUpdateSeeds([...quickTaskSeeds, text]);
      setNewSeedText('');
    }
  };

  const handleDeleteMember = (id: number) => {
    onUpdateMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleDeleteSeed = (seedToDelete: string) => {
    onUpdateSeeds(quickTaskSeeds.filter(seed => seed !== seedToDelete));
  };
  
  const handleCopyCode = () => {
    if (familyGroupId) {
        navigator.clipboard.writeText(familyGroupId);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy Code'), 2000);
    }
  };

  const handleSaveEnvConfig = () => {
      setIsSavingEnv(true);
      const lines = envConfigInput.split('\n');
      const config: Record<string, string> = {};
      
      lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const firstEqualIndex = trimmed.indexOf('=');
          if (firstEqualIndex > -1) {
              const key = trimmed.substring(0, firstEqualIndex).trim();
              let value = trimmed.substring(firstEqualIndex + 1).trim();
              if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                  value = value.slice(1, -1);
              }
              config[key] = value;
          }
      });
      
      try {
        localStorage.setItem('familyKudos_envConfig', JSON.stringify(config));
        setTimeout(() => window.location.reload(), 500);
      } catch (e) {
        setIsSavingEnv(false);
        alert("Failed to save configuration locally.");
      }
  };

  const handleClearEnvConfig = () => {
       if (confirm('Are you sure you want to clear the custom configuration?')) {
           localStorage.removeItem('familyKudos_envConfig');
           window.location.reload();
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
                    <p className="text-sm text-sky-700">Connected to group code:</p>
                    <div className="flex gap-2">
                        <code className="flex-grow p-2 bg-white border border-sky-200 rounded text-sm font-mono text-slate-600 truncate select-all">
                            {familyGroupId}
                        </code>
                        <button onClick={handleCopyCode} className="bg-sky-200 text-sky-700 px-3 py-1 rounded hover:bg-sky-300 text-sm font-medium transition-colors">
                            {copyStatus}
                        </button>
                    </div>
                    <button onClick={onLeaveGroup} className="w-full mt-2 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                        Disconnect from Cloud
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <button onClick={onCreateGroup} disabled={isSyncing} className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition disabled:opacity-50">
                        {isSyncing ? 'Creating...' : 'Create Shared Group'}
                    </button>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Paste Family Code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="flex-grow p-2 text-sm bg-white border border-sky-200 rounded focus:ring-2 focus:ring-sky-500 outline-none" />
                        <button onClick={() => onJoinGroup(joinCode)} disabled={!joinCode || isSyncing} className="bg-white text-sky-600 border border-sky-200 font-bold py-2 px-4 rounded-lg hover:bg-sky-50 transition disabled:opacity-50">
                            Join
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Member Management */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Family Members</h3>
          <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
            <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Add member name" className="flex-grow p-2 bg-slate-100 border border-slate-300 rounded-lg text-sm" />
            <button type="submit" className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg text-sm">Add</button>
          </form>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {familyMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Avatar initial={member.avatar.initial} color={member.avatar.color} />
                  <span className="font-medium text-slate-800">{member.name}</span>
                </div>
                <button onClick={() => handleDeleteMember(member.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Task Seeds */}
        <div className="mb-8 border-t border-slate-100 pt-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Quick Task Suggestions</h3>
          <p className="text-xs text-slate-500 mb-3">These items always appear in your Quick Select list.</p>
          <form onSubmit={handleAddSeed} className="flex gap-2 mb-4">
            <input type="text" value={newSeedText} onChange={(e) => setNewSeedText(e.target.value)} placeholder="e.g., Cleaned the Kitchen" className="flex-grow p-2 bg-slate-100 border border-slate-300 rounded-lg text-sm" />
            <button type="submit" className="bg-sky-500 text-white font-bold py-2 px-4 rounded-lg text-sm">Add</button>
          </form>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {quickTaskSeeds.map((seed, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-sky-50 border border-sky-100 px-2 py-1 rounded-md text-xs text-sky-700 group">
                <span>{seed}</span>
                <button onClick={() => handleDeleteSeed(seed)} className="text-sky-300 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Environment Configuration */}
        <div className="border-t border-slate-200 pt-6">
            <button onClick={() => setShowEnvConfig(!showEnvConfig)} className="flex items-center justify-between w-full text-left text-slate-600 font-semibold mb-2 hover:text-sky-600 transition-colors">
                <span>App Configuration</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${showEnvConfig ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {showEnvConfig && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
                    <textarea value={envConfigInput} onChange={(e) => setEnvConfigInput(e.target.value)} placeholder={`GOOGLE_CLIENT_ID=...\nFIREBASE_API_KEY=...`} className="w-full h-32 p-2 text-xs font-mono bg-white border border-slate-300 rounded-md outline-none mb-3" spellCheck={false} />
                    <div className="flex gap-2 justify-end">
                        <button onClick={handleClearEnvConfig} className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 font-medium">Reset</button>
                        <button onClick={handleSaveEnvConfig} disabled={isSavingEnv} className="bg-slate-800 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-slate-700">
                            {isSavingEnv ? 'Saving...' : 'Save & Reload'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;