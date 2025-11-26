import { FamilyMember } from './types';

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Mom', avatar: { initial: 'M', color: 'bg-pink-500' } },
  { id: 2, name: 'Dad', avatar: { initial: 'D', color: 'bg-blue-600' } },
  { id: 3, name: 'Alex', avatar: { initial: 'A', color: 'bg-green-500' } },
  { id: 4, name: 'Bella', avatar: { initial: 'B', color: 'bg-purple-500' } },
];

export const AVATAR_COLORS = [
  'bg-pink-500',
  'bg-blue-600',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-teal-500',
  'bg-indigo-500',
];
