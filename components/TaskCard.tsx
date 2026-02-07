import React from 'react';
import { FamilyMember, Task } from '../types';
import HeartIcon from './icons/HeartIcon';
import TrashIcon from './icons/TrashIcon';
import Avatar from './Avatar';

interface TaskCardProps {
  task: Task;
  member: FamilyMember;
  familyMembers: FamilyMember[];
  activeMemberId: number | null;
  onAppreciate: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, member, familyMembers, activeMemberId, onAppreciate, onDelete }) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(task.timestamp));

  const appreciatorIds = task.appreciatorIds || [];
  const hasAppreciated = activeMemberId !== null && appreciatorIds.includes(activeMemberId);
  
  // Resolve names of appreciators
  const appreciatorNames = appreciatorIds
    .map(id => familyMembers.find(m => m.id === id)?.name)
    .filter(Boolean) as string[];

  let thankLabel = '';
  if (appreciatorNames.length > 0) {
    if (appreciatorNames.length === 1) {
      thankLabel = `Thanked by ${appreciatorNames[0]}`;
    } else if (appreciatorNames.length === 2) {
      thankLabel = `Thanked by ${appreciatorNames[0]} & ${appreciatorNames[1]}`;
    } else {
      thankLabel = `Thanked by ${appreciatorNames[0]}, ${appreciatorNames[1]} and ${appreciatorNames.length - 2} more`;
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 duration-300 ease-in-out relative group">
      {onDelete && (
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
            }}
            className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete task"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
      )}
      
      <div>
        <div className="flex items-center mb-4 pr-8">
          <Avatar initial={member.avatar.initial} color={member.avatar.color} />
          <div className="ml-4">
            <p className="font-bold text-slate-800 text-lg leading-tight">{member.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{formattedDate}</p>
          </div>
        </div>
        <p className="text-slate-700 text-base mb-6 min-h-[3rem] line-clamp-3">{task.description}</p>
      </div>

      <div className="space-y-4">
        {thankLabel && (
          <div className="flex items-center gap-2 text-xs font-semibold text-pink-500 bg-pink-50/50 py-1.5 px-3 rounded-lg border border-pink-100/50 animate-fade-in">
            <HeartIcon className="w-3.5 h-3.5 fill-pink-500" />
            <span>{thankLabel}</span>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            onClick={() => onAppreciate(task.id)}
            className={`flex items-center space-x-2 font-bold py-2.5 px-5 rounded-full transition-all duration-200 active:scale-95 ${
              hasAppreciated 
                ? 'text-white bg-pink-500 hover:bg-pink-600 shadow-md shadow-pink-200' 
                : 'text-pink-500 bg-pink-50 hover:bg-pink-100 border border-pink-100'
            }`}
          >
            <HeartIcon className={`w-4 h-4 ${hasAppreciated ? 'fill-white' : 'fill-pink-500'}`} />
            <span>{hasAppreciated ? 'Thanked' : 'Thank'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;