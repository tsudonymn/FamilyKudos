import React from 'react';
import { FamilyMember, Task } from '../types';
import HeartIcon from './icons/HeartIcon';
import Avatar from './Avatar';

interface TaskCardProps {
  task: Task;
  member: FamilyMember;
  onAppreciate: (taskId: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, member, onAppreciate }) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(task.timestamp));

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col justify-between transition-transform hover:scale-105 duration-300 ease-in-out">
      <div>
        <div className="flex items-center mb-4">
          <Avatar initial={member.avatar.initial} color={member.avatar.color} />
          <div className="ml-4">
            <p className="font-bold text-slate-800 text-lg">{member.name}</p>
            <p className="text-xs text-slate-500">{formattedDate}</p>
          </div>
        </div>
        <p className="text-slate-700 text-base mb-4">{task.description}</p>
      </div>
      <div className="flex items-center justify-end">
        <button
          onClick={() => onAppreciate(task.id)}
          className="flex items-center space-x-2 text-pink-500 bg-pink-100 hover:bg-pink-200 font-semibold py-2 px-4 rounded-full transition-colors duration-200"
        >
          <HeartIcon className="w-5 h-5" />
          <span>Thank</span>
        </button>
        {task.appreciationCount > 0 && (
          <div className="ml-3 flex items-center text-sm text-pink-600 font-medium">
            <HeartIcon className="w-4 h-4 mr-1" />
            <span>{task.appreciationCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
