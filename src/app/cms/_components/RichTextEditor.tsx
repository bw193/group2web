'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  RemoveFormatting,
  Table as TableIcon,
  Rows,
  Columns,
  Trash2,
  ImagePlus,
} from 'lucide-react';
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';
import { useEffect, useState } from 'react';
import type { UsedDescription } from '@/lib/description-images';
import { useT } from '../_lib/i18n';
import { DescriptionImage, type DescriptionImageAttrs } from './DescriptionImage';
import DescriptionImageDialog from './DescriptionImageDialog';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Tries to split a single line into cells using either tabs OR 2+ spaces.
// Returns null when it doesn't look tabular (fewer than 2 cells).
function splitLineToCells(line: string): string[] | null {
  if (line.includes('\t')) {
    const cells = line.split(/\t+/).map((c) => c.trim()).filter((c) => c.length > 0);
    return cells.length >= 2 ? cells : null;
  }
  if (/ {2,}/.test(line)) {
    const cells = line.split(/ {2,}/).map((c) => c.trim()).filter((c) => c.length > 0);
    return cells.length >= 2 ? cells : null;
  }
  return null;
}

function renderTableHtml(rows: string[][]): string {
  const [header, ...body] = rows;
  const headHtml = `<tr>${header.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
  const bodyHtml = body
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<table>${headHtml}${bodyHtml}</table>`;
}

// Walks the pasted text line by line and groups consecutive lines that share
// the same delimiter-derived column count into table blocks (at least 2 cols
// × 2 rows). Lines that don't fit a table block become regular paragraphs.
// Returns combined HTML when at least one table block is found, else null.
function htmlForPastedText(text: string): string | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const parts: string[] = [];
  let cursor = 0;
  let producedTable = false;
  while (cursor < lines.length) {
    const startLine = lines[cursor];
    const startCells = startLine.trim() ? splitLineToCells(startLine) : null;
    if (startCells && startCells.length >= 2) {
      // Start a potential table block; keep extending while the next line has
      // the same column count.
      const rows: string[][] = [startCells];
      let next = cursor + 1;
      while (next < lines.length) {
        const candidate = lines[next];
        if (!candidate.trim()) break;
        const cells = splitLineToCells(candidate);
        if (!cells || cells.length !== startCells.length) break;
        rows.push(cells);
        next += 1;
      }
      if (rows.length >= 2) {
        parts.push(renderTableHtml(rows));
        producedTable = true;
        cursor = next;
        continue;
      }
    }
    // Not a table row — emit as a paragraph (or skip blank lines).
    if (startLine.trim()) parts.push(`<p>${escapeHtml(startLine.trim())}</p>`);
    cursor += 1;
  }
  return producedTable ? parts.join('') : null;
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  /**
   * Turns on Insert image (product descriptions). Every photo needs its own
   * description; see src/lib/description-images.ts.
   */
  images?: {
    /** Names the stored files after the product, like the gallery uploads. */
    uploadSlug: string;
    /** Descriptions already used on photos in other products' descriptions. */
    usedElsewhere: readonly UsedDescription[];
  };
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
  images,
}: Props) {
  const { t } = useT();
  // Open image dialog: `pos` is the photo being edited, or null for a new one.
  const [imageDialog, setImageDialog] = useState<{ pos: number | null; attrs: DescriptionImageAttrs | null } | null>(null);

  const editor = useEditor({
    // Required by Next.js App Router to avoid hydration mismatch
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
        emptyEditorClass: 'is-editor-empty',
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      ...(images
        ? [DescriptionImage.configure({ onEdit: (pos, attrs) => setImageDialog({ pos, attrs }) })]
        : []),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // TipTap returns "<p></p>" for empty editor — normalize to empty string
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class:
          'rt-content w-full focus:outline-none px-4 py-3 text-sm leading-relaxed',
        style: `min-height: ${minHeight}px`,
      },
      // Detect tabular blocks within pasted plain text and convert them to
      // real <table> nodes. Lines that aren't tabular paste as paragraphs.
      // Skipped when the clipboard already carries rich HTML with a <table>
      // — TipTap parses that itself with the Table extensions registered.
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        const html = event.clipboardData?.getData('text/html');
        if (html && /<table[\s>]/i.test(html)) return false;
        if (!text || !text.includes('\n')) return false;
        const combinedHtml = htmlForPastedText(text);
        if (!combinedHtml) return false;
        const container = document.createElement('div');
        container.innerHTML = combinedHtml;
        const slice = ProseMirrorDOMParser.fromSchema(view.state.schema).parseSlice(container);
        view.dispatch(view.state.tr.replaceSelection(slice));
        return true;
      },
    },
  });

  // Keep editor synced when external value changes (e.g., loading saved data)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className="border border-gray-300 rounded bg-gray-50"
        style={{ minHeight: minHeight + 44 }}
      />
    );
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(t('rt.linkPrompt'), previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  /** Descriptions of the photos in this text, except the one at `exceptPos`. */
  function photoDescriptions(exceptPos: number | null): string[] {
    const descriptions: string[] = [];
    editor?.state.doc.descendants((node, pos) => {
      if (node.type.name === 'descriptionImage' && pos !== exceptPos) descriptions.push(node.attrs.description);
    });
    return descriptions;
  }

  function submitImage(attrs: DescriptionImageAttrs) {
    if (!editor || !imageDialog) return;
    const { pos } = imageDialog;
    if (pos === null) {
      editor.chain().focus().insertContent({ type: 'descriptionImage', attrs }).run();
    } else {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          if (tr.doc.nodeAt(pos)?.type.name !== 'descriptionImage') return false;
          tr.setNodeMarkup(pos, undefined, attrs);
          return true;
        })
        .run();
    }
    setImageDialog(null);
  }

  return (
    <div className="border border-gray-300 rounded bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-2 py-1.5 bg-gray-50">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title={t('rt.bold')}
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title={t('rt.italic')}
        >
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title={t('rt.strike')}
        >
          <Strikethrough size={14} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title={t('rt.h2')}
        >
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title={t('rt.h3')}
        >
          <Heading3 size={14} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title={t('rt.bulletList')}
        >
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title={t('rt.orderedList')}
        >
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title={t('rt.quote')}
        >
          <Quote size={14} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={setLink}
          active={editor.isActive('link')}
          title={t('rt.link')}
        >
          <LinkIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          title={t('rt.unlink')}
        >
          <Unlink size={14} />
        </ToolbarBtn>

        {images && (
          <>
            <Divider />
            <ToolbarBtn onClick={() => setImageDialog({ pos: null, attrs: null })} title={t('rt.image')}>
              <ImagePlus size={14} />
            </ToolbarBtn>
          </>
        )}

        <Divider />

        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          title={t('rt.insertTable')}
        >
          <TableIcon size={14} />
        </ToolbarBtn>
        {editor.isActive('table') && (
          <>
            <ToolbarBtn
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title={t('rt.addRow')}
            >
              <Rows size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title={t('rt.addColumn')}
            >
              <Columns size={14} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().deleteTable().run()}
              title={t('rt.deleteTable')}
            >
              <Trash2 size={14} />
            </ToolbarBtn>
          </>
        )}

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title={t('rt.clearFormat')}
        >
          <RemoveFormatting size={14} />
        </ToolbarBtn>

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarBtn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title={t('rt.undo')}
          >
            <Undo2 size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title={t('rt.redo')}
          >
            <Redo2 size={14} />
          </ToolbarBtn>
        </div>
      </div>

      <EditorContent editor={editor} />

      {images && imageDialog && (
        <DescriptionImageDialog
          initial={imageDialog.attrs}
          uploadSlug={images.uploadSlug}
          others={photoDescriptions(imageDialog.pos)}
          usedElsewhere={images.usedElsewhere}
          onSubmit={submitImage}
          onClose={() => setImageDialog(null)}
        />
      )}

      {/* Inline styles for editor content. Scoped via .rt-content class. */}
      <style jsx global>{`
        .rt-content > * + * {
          margin-top: 0.6em;
        }
        .rt-content p {
          margin: 0;
        }
        .rt-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.3;
        }
        .rt-content h3 {
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.3;
        }
        .rt-content ul,
        .rt-content ol {
          padding-left: 1.4rem;
        }
        .rt-content ul {
          list-style: disc;
        }
        .rt-content ol {
          list-style: decimal;
        }
        .rt-content li > p {
          margin: 0;
        }
        .rt-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 0.85rem;
          color: #4b5563;
          font-style: italic;
        }
        .rt-content a {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .rt-content strong {
          font-weight: 600;
        }
        .rt-content em {
          font-style: italic;
        }
        .rt-content s {
          text-decoration: line-through;
        }
        /* Tables — both editor and saved HTML use the same markup */
        .rt-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.6em 0;
          font-size: 0.92em;
        }
        .rt-content th,
        .rt-content td {
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          vertical-align: top;
          min-width: 1em;
        }
        .rt-content th {
          background: #f3f4f6;
          font-weight: 600;
          text-align: left;
        }
        .rt-content .selectedCell {
          background: #dbeafe;
        }
        /* Description photos (DescriptionImage node view) */
        .rt-content .rt-figure {
          position: relative;
          margin: 0.8em 0;
        }
        .rt-content .rt-figure img {
          display: block;
          max-width: 100%;
          max-height: 320px;
          cursor: grab;
        }
        .rt-content .rt-figure.is-selected img {
          outline: 2px solid #1b2a4a;
          outline-offset: 2px;
        }
        .rt-content .rt-figure figcaption {
          margin-top: 0.4em;
          font-size: 0.85em;
          color: #6b7280;
        }
        .rt-content .rt-figure figcaption.is-missing {
          color: #dc2626;
        }
        .rt-content .rt-figure-actions {
          position: absolute;
          top: 8px;
          left: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .rt-content .rt-figure:hover .rt-figure-actions,
        .rt-content .rt-figure.is-selected .rt-figure-actions {
          opacity: 1;
        }
        .rt-content .rt-figure-actions button {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.95);
          font-size: 12px;
          color: #374151;
        }
        .rt-content .rt-figure-actions button:hover {
          background: #fff;
          color: #111827;
        }
        /* Placeholder */
        .rt-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'text-gray-700 hover:bg-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-gray-300 mx-1" />;
}
