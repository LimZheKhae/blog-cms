'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import { Node, mergeAttributes } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Undo,
  Redo
} from 'lucide-react';
import { useCallback, useState } from 'react';
import ImageDialog from './image-dialog';
import VideoDialog from './video-dialog';
import LinkDialog from './link-dialog';

// Extend TipTap Commands interface to include our custom video command
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; title?: string }) => ReturnType;
    };
  }
}

// Video Extension similar to Image Extension
const Video = Node.create({
  name: 'video',
  
  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      controls: {
        default: true,
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
        getAttrs: (dom: HTMLElement) => {
          const element = dom as HTMLVideoElement;
          return {
            src: element.getAttribute('src'),
            title: element.getAttribute('title'),
            controls: element.hasAttribute('controls'),
            width: element.getAttribute('width') || '100%',
            height: element.getAttribute('height') || 'auto',
          };
        },
      },
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: (dom: HTMLElement) => {
          const element = dom as HTMLIFrameElement;
          return {
            src: element.getAttribute('src'),
            title: element.getAttribute('title'),
            width: element.getAttribute('width') || '100%',
            height: element.getAttribute('height') || '315',
          };
        },
      },
      {
        tag: 'iframe[src*="vimeo.com"]',
        getAttrs: (dom: HTMLElement) => {
          const element = dom as HTMLIFrameElement;
          return {
            src: element.getAttribute('src'),
            title: element.getAttribute('title'),
            width: element.getAttribute('width') || '100%',
            height: element.getAttribute('height') || '315',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }: any) {
    const { src, title, controls, width, height } = HTMLAttributes;
    
    // Check if it's a YouTube or Vimeo URL
    if (src && (src.includes('youtube.com') || src.includes('youtu.be') || src.includes('vimeo.com'))) {
      let embedSrc = src;
      
      // Convert YouTube URLs to embed format
      if (src.includes('youtube.com/watch?v=')) {
        const videoId = src.split('v=')[1]?.split('&')[0];
        embedSrc = `https://www.youtube.com/embed/${videoId}`;
      } else if (src.includes('youtu.be/')) {
        const videoId = src.split('youtu.be/')[1]?.split('?')[0];
        embedSrc = `https://www.youtube.com/embed/${videoId}`;
      } else if (src.includes('vimeo.com/') && !src.includes('/embed/')) {
        const videoId = src.split('vimeo.com/')[1]?.split('?')[0];
        embedSrc = `https://player.vimeo.com/video/${videoId}`;
      }
      
      return [
        'div',
        { class: 'video-wrapper' },
        [
          'iframe',
          mergeAttributes(this.options.HTMLAttributes, {
            src: embedSrc,
            title: title || 'Video',
            width: width || '100%',
            height: height || '315',
            frameborder: '0',
            allowfullscreen: 'true',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          }),
        ],
      ];
    }
    
    // For direct video files (MP4, WebM, etc.)
    return [
      'video',
      mergeAttributes(this.options.HTMLAttributes, {
        src,
        title,
        controls: controls ? 'true' : undefined,
        width: width || '100%',
        height: height || 'auto',
        style: `max-width: 100%; height: auto;`,
      }),
    ];
  },

  addCommands() {
    return {
      setVideo: (options: { src: string; title?: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = "Start writing your content...",
  className = "",
  disabled = false
}: RichTextEditorProps) => {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkDialogData, setLinkDialogData] = useState({ url: '', text: '' });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md my-4',
        },
      }),
      Video.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md my-4',
        },
      }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[300px] p-4 text-base leading-relaxed',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );

    setLinkDialogData({
      url: previousUrl || '',
      text: selectedText || ''
    });
    setShowLinkDialog(true);
  }, [editor]);

  const addImage = useCallback(() => {
    setShowImageDialog(true);
  }, []);

  const handleImageInsert = useCallback((src: string, alt?: string) => {
    if (!editor) return;
    
    editor.chain().focus().setImage({ src, alt }).run();
  }, [editor]);

  const addVideo = useCallback(() => {
    setShowVideoDialog(true);
  }, []);

  const handleVideoInsert = useCallback((src: string, title?: string) => {
    if (!editor) return;
    
    // Use insertContent directly with the video node type
    editor.chain().focus().insertContent({
      type: 'video',
      attrs: { src, title }
    }).run();
  }, [editor]);

  const handleLinkInsert = useCallback((url: string, text?: string) => {
    if (!editor) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      if (!text && editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${url}" class="text-blue-600 hover:text-blue-800 underline">${url}</a> `).run();
      } else {
        if (text && editor.state.selection.empty) {
          editor.chain().focus().insertContent(`<a href="${url}" class="text-blue-600 hover:text-blue-800 underline">${text}</a> `).run();
        } else {
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
      }
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 w-8 p-0 ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
    >
      {children}
    </Button>
  );

  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-700 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Other Elements */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={addImage}
            title="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={addVideo}
            title="Add Video"
          >
            <VideoIcon className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="min-h-[300px] max-h-[600px] overflow-y-auto"
        />
        
        {/* Character and word count */}
        <div className="absolute bottom-2 right-2 text-xs text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow">
          <span>{editor.storage.characterCount?.characters() || 0} characters</span>
          <span className="mx-1">•</span>
          <span>{editor.storage.characterCount?.words() || 0} words</span>
        </div>
      </div>

      {/* Image Dialog */}
      <ImageDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={handleImageInsert}
      />

      {/* Video Dialog */}
      <VideoDialog
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        onInsert={handleVideoInsert}
      />

      {/* Link Dialog */}
      <LinkDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onInsert={handleLinkInsert}
        initialUrl={linkDialogData.url}
        initialText={linkDialogData.text}
      />
    </div>
  );
};

export default RichTextEditor; 