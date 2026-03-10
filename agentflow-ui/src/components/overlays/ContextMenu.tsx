import { useEffect, useCallback } from 'react';
import { useUiStore } from '../../store/uiStore';

const MENU_ITEMS = [
  { label: 'Start', action: 'start' },
  { label: 'Stop', action: 'stop' },
  { label: 'View Provenance', action: 'provenance' },
  { label: 'Delete', action: 'delete' },
];

export default function ContextMenu() {
  const contextMenu = useUiStore((s) => s.contextMenu);
  const hideContextMenu = useUiStore((s) => s.hideContextMenu);

  const handleClickOutside = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);

  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible, handleClickOutside]);

  if (!contextMenu.visible) return null;

  return (
    <div
      className="fixed z-[100] min-w-[140px] bg-[#0d1117]/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl py-1 overflow-hidden"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.action}
          className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            hideContextMenu();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
