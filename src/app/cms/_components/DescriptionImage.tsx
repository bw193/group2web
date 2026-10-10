'use client';

import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useT } from '../_lib/i18n';

export type DescriptionImageAttrs = {
  src: string;
  description: string;
  width: number | null;
  height: number | null;
};

type DescriptionImageOptions = {
  /** Opens the description dialog for the photo at `pos`. */
  onEdit: (pos: number, attrs: DescriptionImageAttrs) => void;
};

function imgAttribute(element: HTMLElement, name: string): string | null {
  return element.querySelector('img')?.getAttribute(name) ?? null;
}

function positiveInt(value: string | null): number | null {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

// A photo in a product description, with the description staff must write for
// it (rules in src/lib/description-images.ts). It's an atom: the caption isn't
// typed in place but rendered from the description, which staff change
// through the dialog, so the alt text and the caption can never disagree.
export const DescriptionImage = Node.create<DescriptionImageOptions>({
  name: 'descriptionImage',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { onEdit: () => {} };
  },

  addAttributes() {
    return {
      src: { default: '', parseHTML: (el) => imgAttribute(el, 'src') ?? '', rendered: false },
      description: { default: '', parseHTML: (el) => imgAttribute(el, 'alt') ?? '', rendered: false },
      width: { default: null, parseHTML: (el) => positiveInt(imgAttribute(el, 'width')), rendered: false },
      height: { default: null, parseHTML: (el) => positiveInt(imgAttribute(el, 'height')), rendered: false },
    };
  },

  // Only figures this node wrote. A bare <img> pasted from Word or Google Docs
  // matches nothing and is dropped, as before, so no photo arrives without a
  // description.
  parseHTML() {
    return [
      {
        tag: 'figure[data-description-image]',
        getAttrs: (el) => ((el as HTMLElement).querySelector('img[src]') ? null : false),
      },
    ];
  },

  renderHTML({ node }) {
    const { src, description, width, height } = node.attrs as DescriptionImageAttrs;
    return [
      'figure',
      { 'data-description-image': '' },
      ['img', { src, alt: description, width, height }],
      ['figcaption', description],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DescriptionImageView);
  },
});

function DescriptionImageView({ node, selected, getPos, deleteNode, extension }: NodeViewProps) {
  const { t } = useT();
  const attrs = node.attrs as DescriptionImageAttrs;
  const description = attrs.description.trim();

  function edit() {
    const pos = getPos();
    if (typeof pos === 'number') (extension.options as DescriptionImageOptions).onEdit(pos, attrs);
  }

  return (
    <NodeViewWrapper as="figure" className={`rt-figure${selected ? ' is-selected' : ''}`}>
      {/* The photo doubles as the drag handle for moving it within the text. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={attrs.src} alt={description} data-drag-handle="" onDoubleClick={edit} />
      <figcaption className={description ? undefined : 'is-missing'}>
        {description || t('rt.image.missing')}
      </figcaption>
      <div className="rt-figure-actions">
        <button type="button" onClick={edit}>
          <Pencil size={12} /> {t('rt.image.edit')}
        </button>
        <button type="button" onClick={deleteNode} title={t('rt.image.remove')} aria-label={t('rt.image.remove')}>
          <Trash2 size={12} />
        </button>
      </div>
    </NodeViewWrapper>
  );
}
