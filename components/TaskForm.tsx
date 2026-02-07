import React, { useState, useEffect } from 'react';
import { FamilyMember, User } from '../types';
import Avatar from './Avatar';

interface TaskFormProps {
  familyMembers: FamilyMember[];
  quickTaskSeeds: string[];
  onAddTask: (memberId: number, description: string) => void;
  isLoading: boolean;
  user: User;
  activeMemberId: number | null;
  onActiveMemberChange: (id: number | null) => void;
}

const STORAGE_KEY_DESCRIPTIONS = 'familyKudos_globalTaskDescriptions';

const TaskForm: React.FC<TaskFormProps> = ({ 
  familyMembers, 
  quickTaskSeeds, 
  onAddTask, 
  isLoading, 
  user,
  activeMemberId,
  onActiveMemberChange
}) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [recentDescriptions, setRecentDescriptions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DESCRIPTIONS);
      if (stored) setRecentDescriptions(JSON.parse(stored));
    } catch (e) { console.error("Failed to load task descriptions", e); }
  }, []);

  const handleSubmit = (e?: React.FormEvent, overrideDescription?: string) => {
    if (e) e.preventDefault();
    const descToUse = overrideDescription || description;
    const descTrimmed = descToUse.trim();

    if (!activeMemberId) {
        setError('Please select who you are first!');
        return;
    }
    if (!descTrimmed) {
      setError('Please describe what you did!');
      return;
    }
    
    onAddTask(activeMemberId, descTrimmed);
    
    const updatedHistory = [descTrimmed, ...recentDescriptions.filter(d => d.toLowerCase() !== descTrimmed.toLowerCase())].slice(0, 50);
    setRecentDescriptions(updatedHistory);
    try { localStorage.setItem(STORAGE_KEY_DESCRIPTIONS, JSON.stringify(updatedHistory)); } catch (e) {}

    setDescription('');
    setError('');
  };
  
  useEffect(() => {
    if (familyMembers.length === 0 || activeMemberId) return;

    const isGuest = user.email === 'guest@familykudos.app';
    if (!isGuest) {
        const match = familyMembers.find(m => m.name.toLowerCase() === user.name.toLowerCase());
        if (match) onActiveMemberChange(match.id);
    }
  }, [user, familyMembers, activeMemberId, onActiveMemberChange]);

  const handleQuickAdd = (desc: string) => {
    setDescription(desc);
    if (activeMemberId) handleSubmit(undefined, desc);
    else {
      setError('Please select who you are first!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displaySuggestions = Array.from(new Set([...quickTaskSeeds, ...recentDescriptions])).slice(0, 15);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-slate-100">
      <div className="mb-10">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5">1. Who are you?</h2>
        <div className="flex flex-wrap gap-4 md:gap-8">
          {familyMembers.map((member) => {
            const isSelected = member.id === activeMemberId;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  onActiveMemberChange(isSelected ? null : member.id);
                  if (error === 'Please select who you are first!') setError('');
                }}
                className={`group flex flex-col items-center gap-3 transition-all duration-300 ${
                  isSelected ? 'scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`relative rounded-full p-1 transition-all duration-300 ${
                  isSelected ? 'ring-4 ring-sky-500 ring-offset-2' : 'ring-0'
                }`}>
                  <Avatar initial={member.avatar.initial} color={member.avatar.color} />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold transition-colors ${
                  isSelected ? 'text-sky-600' : 'text-slate-500 group-hover:text-slate-700'
                }`}>
                  {member.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">2. What did you do?</h2>
        {displaySuggestions.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider font-bold text-sky-600/60">Choose a common task:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {displaySuggestions.map((desc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAdd(desc)}
                  className="text-xs font-semibold py-2 px-4 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-700 rounded-full shadow-sm transition-all duration-200 ease-in-out active:scale-95 flex items-center gap-1.5"
                >
                  <span className="opacity-40 text-lg leading-none">+</span>
                  {desc}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Or describe a specific task:</span>
          </div>
          <form onSubmit={(e) => handleSubmit(e)} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <input
                id="description"
                type="text"
                list="task-descriptions"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Cleaned the fish tank filters"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-slate-900 placeholder:text-slate-400 shadow-inner"
              />
              <datalist id="task-descriptions">
                {displaySuggestions.map((desc, index) => <option key={index} value={desc} />)}
              </datalist>
            </div>
            <button
              type="submit"
              disabled={isLoading || familyMembers.length === 0}
              className="bg-sky-500 text-white font-bold py-4 px-8 rounded-xl hover:bg-sky-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add to List'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
          <p className="text-red-500 text-sm font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskForm;