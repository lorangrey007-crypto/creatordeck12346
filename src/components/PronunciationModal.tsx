import React, { useState } from 'react';
import { X, BookA, Plus, Trash2 } from 'lucide-react';
import { PronunciationRule } from '../types';

interface PronunciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: PronunciationRule[];
  onSaveRules: (rules: PronunciationRule[]) => void;
}

export const PronunciationModal: React.FC<PronunciationModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
}) => {
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');

  if (!isOpen) return null;

  const handleAddRule = () => {
    if (!findWord.trim() || !replaceWord.trim()) return;

    const newRule: PronunciationRule = {
      id: `pr_${Date.now()}`,
      find: findWord.trim(),
      replaceWith: replaceWord.trim(),
      enabled: true,
    };

    onSaveRules([...rules, newRule]);
    setFindWord('');
    setReplaceWord('');
  };

  const handleToggle = (id: string) => {
    onSaveRules(
      rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDelete = (id: string) => {
    onSaveRules(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <BookA className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Pronunciation Dictionary
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Fix names, terms, or acronyms. The audio engine pronounces the phonetic spelling while preserving original text in your script and subtitle files.
        </p>

        {/* Existing Rules */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {rules.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">No pronunciation rules added yet</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggle(rule.id)}
                    className="w-3.5 h-3.5 accent-zinc-900 dark:accent-white rounded cursor-pointer"
                  />
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{rule.find}</span>
                  <span className="text-zinc-400">➔</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300">&quot;{rule.replaceWith}&quot;</span>
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-zinc-400 hover:text-rose-500 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Rule Form */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
          <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Add Word Replacement:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">When script says:</label>
              <input
                type="text"
                value={findWord}
                onChange={(e) => setFindWord(e.target.value)}
                placeholder="e.g. Herobrine"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Pronounce as:</label>
              <input
                type="text"
                value={replaceWord}
                onChange={(e) => setReplaceWord(e.target.value)}
                placeholder="e.g. Hero bryne"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-hidden"
              />
            </div>
          </div>

          <button
            onClick={handleAddRule}
            disabled={!findWord.trim() || !replaceWord.trim()}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              !findWord.trim() || !replaceWord.trim()
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 active:scale-95 shadow-xs cursor-pointer'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
