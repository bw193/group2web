'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
} from 'lucide-react';
import { useEffect } from 'react';
import { useT } from '../_lib/i18n';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
}: Props) {
  const { t } = useT();

  const editor = useEditor({
    // Required by Next.js App Router to avoid hydration mismatch
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
        emptyEditorClass: 'is-editor-empty',
      }),
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
