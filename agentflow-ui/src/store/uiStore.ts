import { create } from 'zustand';
import type { ContextMenuState } from '../types/ui';

type UiState = {
  selectedNodeId: string | null;
  sidebarOpen: boolean;
  provenancePanelOpen: boolean;
  contextMenu: ContextMenuState;
  isDragging: boolean;
};

type UiActions = {
  selectNode: (id: string | null) => void;
  toggleSidebar: () => void;
  toggleProvenancePanel: () => void;
  showContextMenu: (x: number, y: number, nodeId: string) => void;
  hideContextMenu: () => void;
};

export const useUiStore = create<UiState & UiActions>((set) => ({
  selectedNodeId: null,
  sidebarOpen: true,
  provenancePanelOpen: true,
  contextMenu: { visible: false, x: 0, y: 0, targetNodeId: null },
  isDragging: false,

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleProvenancePanel: () => {
    set((state) => ({ provenancePanelOpen: !state.provenancePanelOpen }));
  },

  showContextMenu: (x: number, y: number, nodeId: string) => {
    set({ contextMenu: { visible: true, x, y, targetNodeId: nodeId } });
  },

  hideContextMenu: () => {
    set({ contextMenu: { visible: false, x: 0, y: 0, targetNodeId: null } });
  },
}));
