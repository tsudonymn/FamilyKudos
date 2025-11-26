import React, { useState } from 'react';
import { FamilyMember } from '../types';

interface TaskFormProps {
  familyMembers: FamilyMember[];
  onAddTask: (memberId: number, description: string) => void;
  isLoading: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ familyMembers, onAddTask, isLoading }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(String(familyMembers[0]?.id || ''));
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe what you did!');
      return;
    }
    if (!selectedMemberId) {
        setError('Please select who did it! You can add family members in the settings.');
        return;
    }
    onAddTask(Number(selectedMemberId), description.trim());
    setDescription('');
    setError('');
  };
  
  // Update selected member if the list changes and the current selection is gone
  React.useEffect(() => {
    if (familyMembers.length > 0 && !familyMembers.find(m => String(m.id) === selectedMemberId)) {
      setSelectedMemberId(String(familyMembers[0].id));
    } else if (familyMembers.length === 0) {
      setSelectedMemberId('');
    }
  }, [familyMembers, selectedMemberId]);


  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">What did you do?</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="member" className="block text-sm font-medium text-slate-600 mb-1">
              Who are you?
            </label>
            <select
              id="member"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-slate-900"
              disabled={familyMembers.length === 0}
            >
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
             <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">
              Describe the task
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Emptied the dishwasher"
              className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition text-slate-900 placeholder:text-slate-500"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || familyMembers.length === 0}
          className="w-full bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            'Add to the list'
          )}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
