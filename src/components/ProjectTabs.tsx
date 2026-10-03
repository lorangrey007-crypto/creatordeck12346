import React, { useState } from 'react';
import { Plus, X, FileText, Edit2, Check, Loader2, Smartphone, Monitor } from 'lucide-react';
import { ScriptTab, WorkspaceFormat } from '../types';

interface ProjectTabsProps {
  tabs: ScriptTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCreateTab: (format?: WorkspaceFormat) => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onToggleFormat?: (id: string, newFormat: WorkspaceFormat) => void;
}

export const ProjectTabs: React.FC<ProjectTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCreateTab,
  onCloseTab,
  onRenameTab,
  onToggleFormat,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (tab: ScriptTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(tab.id);
    setEditTitle(tab.title);
  };

  const commitRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameTab(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center justify-between gap-1.5 px-4 lg:px-6 pt-3 pb-1 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isEditing = editingId === tab.id;
          const words = tab.content.trim() ? tab.content.split(/\s+/).length : 0;
          const format = tab.format || (tab.title.toLowerCase().includes('short') ? 'shorts' : 'long-form');
          const isGen = !!tab.isVoiceGenerating;

          return (
            <div
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl text-xs font-medium cursor-pointer transition-all border-t border-x ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 shadow-xs translate-y-px z-10'
                  : 'bg-zinc-100/70 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {isGen ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" title="Generating voice in background..." />
              ) : format === 'shorts' ? (
                <Smartphone className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-rose-500' : 'text-zinc-400'}`} title="Shorts Workspace (9:16)" />
              ) : (
                <Monitor className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-500' : 'text-zinc-400'}`} title="Long-Form Workspace (16:9)" />
              )}

              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(tab.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-900 dark:text-zinc-100 outline-hidden border border-zinc-400 dark:border-zinc-600 w-32"
                  />
                  <button
                    onClick={() => commitRename(tab.id)}
                    className="text-emerald-500 hover:text-emerald-400 p-0.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 max-w-[190px]">
                  <span className="truncate" title={tab.title}>{tab.title}</span>
                  
                  {/* Format Badge */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFormat?.(tab.id, format === 'shorts' ? 'long-form' : 'shorts');
                    }}
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold transition-all hover:scale-105 ${
                      format === 'shorts'
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    }`}
                    title="Click to toggle workspace format (9:16 Shorts vs 16:9 Long)"
                  >
                    {format === 'shorts' ? '9:16' : '16:9'}
                  </span>

                  <span className="text-[10px] text-zinc-400 font-mono">
                    {words}w
                  </span>

                  <button
                    onClick={(e) => startRename(tab, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-opacity p-0.5"
                    title="Rename Script"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-0.5 rounded text-zinc-400 hover:text-red-500 transition-all ml-1"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Quick Create Buttons: Short vs Long */}
        <div className="flex items-center gap-1 ml-1">
          <button
            id="btn-new-tab-short"
            onClick={() => onCreateTab('shorts')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors"
            title="Add new isolated Shorts (9:16) workspace"
          >
            <Smartphone className="w-3 h-3" />
            <span>+ Short (9:16)</span>
          </button>

          <button
            id="btn-new-tab-long"
            onClick={() => onCreateTab('long-form')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900 transition-colors"
            title="Add new isolated Long-Form (16:9) workspace"
          >
            <Monitor className="w-3 h-3" />
            <span>+ Long (16:9)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
