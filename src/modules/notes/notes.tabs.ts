import { documentTextOutline, listOutline, searchOutline, trashOutline } from 'ionicons/icons';
import type { ModuleTab } from '@/app/ModuleBottomNav';

export const NOTES_TABS: ModuleTab[] = [
  { key: 'all', value: '/m/notes/all', icon: listOutline, labelKey: 'notes.tabs.all' },
  { key: 'search', value: '/m/notes/search', icon: searchOutline, labelKey: 'notes.tabs.search' },
  { key: 'trash', value: '/m/notes/trash', icon: trashOutline, labelKey: 'notes.tabs.trash' },
];

void documentTextOutline; // re-export placeholder
