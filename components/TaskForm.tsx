import React, { useState, useEffect } from 'react';
import { FamilyMember, User } from '../types';

interface TaskFormProps {
  familyMembers: FamilyMember[];
  quickTaskSeeds: string[];
  onAddTask: (memberId: number, description: string) => void;
  isLoading: boolean;
  user: User;
}

const STORAGE_KEY_DESCRIPTIONS = 'familyKudos_globalTaskDescriptions';
const STORAGE_KEY_LAST_MEMBER = 'familyKudos_lastSelectedMemberId';

const TaskForm: React.FC<TaskFormProps> = ({ familyMembers, quickTaskSeeds, onAddTask, isLoading, user }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [recentDescriptions, setRecentDescriptions] = useState<string[]>([]);

  // Load recent descriptions from history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DESCRIPTIONS);
      if (stored) {
        setRecentDescriptions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load task descriptions", e);
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent, overrideDescription?: string) => {
    if (e) e.preventDefault();
    
    const descToUse = overrideDescription || description;
    const descTrimmed = descToUse.trim();

    if (!descTrimmed) {
      setError('Please describe what you did!');
      return;
    }
    if (!selectedMemberId) {
        setError('Please select who did it! You can add family members in the settings.');
        return;
    }
    
    onAddTask(Number(selectedMemberId), descTrimmed);
    
    // Save to local recent history
    const updatedHistory = [
        descTrimmed, 
        ...recentDescriptions.filter(d => d.toLowerCase() !== descTrimmed.toLowerCase())
    ].slice(0, 50);

    setRecentDescriptions(updatedHistory);
    try {
        localStorage.setItem(STORAGE_KEY_DESCRIPTIONS, JSON.stringify(updatedHistory));
    } catch (e) {
        console.error("Failed to save task description", e);
    }

    setDescription('');
    setError('');
  };
  
  // Initialize selection
  useEffect(() => {
    if (familyMembers.length === 0) return;

    const storedId = localStorage.getItem(STORAGE_KEY_LAST_MEMBER);
    if (storedId && familyMembers.find(m => String(m.id) === storedId)) {
        setSelectedMemberId((prev) => (prev !== storedId ? storedId : prev));
        return; 
    }

    const isGuest = user.email === 'guest@familykudos.app';
    if (!isGuest) {
        const match = familyMembers.find(m => m.name.toLowerCase() === user.name.toLowerCase());
        if (match) {
            const matchId = String(match.id);
            setSelectedMemberId((prev) => (prev !== matchId ? matchId : prev));
        }
    }
  }, [user, familyMembers]);

  useEffect(() => {
    if (selectedMemberId && !familyMembers.find(m => String(m.id) === selectedMemberId)) {
      setSelectedMemberId('');
      localStorage.removeItem(STORAGE_KEY_LAST_MEMBER);
    }
  }, [familyMembers, selectedMemberId]);

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedMemberId(val);
      localStorage.setItem(STORAGE_KEY_LAST_MEMBER, val);
  };

  const handleQuickAdd = (desc: string) => {
    setDescription(desc);
    if (selectedMemberId) {
      handleSubmit(undefined, desc);
    } else {
      const selectEl = document.getElementById('member');
      if (selectEl) selectEl.focus();
      setError('Select who you are first!');
    }
  };

  // Combine seeds and recent history, with seeds prioritized at the start if requested, 
  // or just deduplicate and show top items.
  const displaySuggestions = Array.from(new Set([...quickTaskSeeds, ...recentDescriptions])).slice(0, 12);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4">What did you do?</h2>
      <form onSubmit={(e) => handleSubmit(e)} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3">
          <label htmlFor="member" className="block text-sm font-medium text-slate-600 mb-1">
            Who are you?
          </label>
          <select
            id="member"
            value={selectedMemberId}
            onChange={handleMemberChange}
            className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-slate-900"
            disabled={familyMembers.length === 0}
          >
            <option value="" disabled>Select name...</option>
            {familyMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">
            Describe the task
          </label>
          <input
            id="description"
            type="text"
            list="task-descriptions"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Emptied the dishwasher"
            className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-slate-900 placeholder:text-slate-500"
            autoComplete="off"
          />
          <datalist id="task-descriptions">
            {displaySuggestions.map((desc, index) => (
              <option key={index} value={desc} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isLoading || familyMembers.length === 0}
            className="w-full bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              'Add to List'
            )}
          </button>
        </div>
      </form>
      
      {displaySuggestions.length > 0 && (
        <div className="mt-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-sky-600/60">Quick Select:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {displaySuggestions.map((desc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickAdd(desc)}
                className="text-xs font-semibold py-1.5 px-4 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg shadow-sm transition-all duration-200 ease-in-out active:scale-95 flex items-center gap-1"
              >
                <span className="opacity-50">+</span>
                {desc}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>}
    </div>
  );
};

export default TaskForm;