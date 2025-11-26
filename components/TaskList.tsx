
import React from 'react';
import { FamilyMember, Task } from '../types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  familyMembers: FamilyMember[];
  onAppreciate: (taskId: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, familyMembers, onAppreciate }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
        <h3 className="text-2xl font-bold text-slate-700">The list is empty!</h3>
        <p className="text-slate-500 mt-2">Add a completed task to get started.</p>
      </div>
    );
  }
  
  const memberMap = new Map(familyMembers.map(m => [m.id, m]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => {
        const member = memberMap.get(task.memberId);
        return member ? (
          <TaskCard
            key={task.id}
            task={task}
            member={member}
            onAppreciate={onAppreciate}
          />
        ) : null;
      })}
    </div>
  );
};

export default TaskList;
