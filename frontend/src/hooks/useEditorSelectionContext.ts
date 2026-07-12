import { useEffect, useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

export interface SelectionContext {
  text: string;
  top: number;
  left: number;
}

/**
 * Tracks the current text selection inside a TipTap editor. Returns the
 * selected plain text plus a viewport position (derived from the native
 * Selection API's bounding rect, not TipTap's internal coordinate system —
 * simpler and matches what the user visually sees) suitable for anchoring a
 * floating "ask AI about this" popup near the selection.
 */
export function useEditorSelectionContext(editor: Editor | null): {
  selection: SelectionContext | null;
  clearSelection: () => void;
} {
  const [selection, setSelection] = useState<SelectionContext | null>(null);

  const clearSelection = useCallback(() => setSelection(null), []);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to, empty } = editor.state.selection;

      if (empty || to - from < 2) {
        setSelection(null);
        return;
      }

      const text = editor.state.doc.textBetween(from, to, ' ');
      if (!text.trim()) {
        setSelection(null);
        return;
      }

      // Use the native browser selection's bounding rect for positioning —
      // reflects actual rendered position, including wrapped lines,
      // scrolling, and zoom, without needing to reimplement ProseMirror's
      // coordinate math.
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const rect = domSelection.getRangeAt(0).getBoundingClientRect();
      setSelection({
        text,
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  return { selection, clearSelection };
}