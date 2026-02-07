import { FamilyMember } from './types';

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Chris', avatar: { initial: 'C', color: 'bg-blue-600' } },
  { id: 2, name: 'Nicki', avatar: { initial: 'N', color: 'bg-pink-500' } },
  { id: 3, name: 'Jamie', avatar: { initial: 'J', color: 'bg-green-500' } },
  { id: 4, name: 'Pip', avatar: { initial: 'P', color: 'bg-purple-500' } },
  { id: 5, name: 'Kes', avatar: { initial: 'K', color: 'bg-orange-500' } },
  { id: 6, name: 'Charlotte', avatar: { initial: 'C', color: 'bg-teal-500' } },
];

export const DEFAULT_QUICK_TASKS = [
  'Emptied the dishwasher',
  'Filled the dishwasher',
  'Got the Mail',
  'Washed and dried a load of laundry',
  'Folded the laundry',
  'Cleaned the bathroom',
  'Took out recycling',
  'Took out bins',
  'Changed the bed sheets',
  'Vacuumed',
  '150g Tank Maintanance',
  'Fed the Fish'
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