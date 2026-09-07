import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImage } from "./ResizableImage";
import Underline from "@tiptap/extension-underline";
import { FiImage } from "react-icons/fi";

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

function parseContent(value) {
  if (!value) return EMPTY_DOCUMENT;

  if (typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return EMPTY_DOCUMENT;
  }

  // New rich-text content is stored as JSON.
  try {
    const parsed = JSON.parse(value);

    if (parsed?.type === "doc") {
      return parsed;
    }
  } catch {
    // Existing works may contain ordinary plain text.
  }

  // Convert an old plain-text work into paragraphs.
  const paragraphs = value.split(/\r?\n/);

  return {
    type: "doc",
    content:
      paragraphs.length > 0
        ? paragraphs.map((text) => ({
            type: "paragraph",
            ...(text
              ? {
                  content: [
                    {
                      type: "text",
                      text,
                    },
                  ],
                }
              : {}),
          }))
        : [{ type: "paragraph" }],
  };
}

function ToolbarButton({
  children,
  onClick,
  active = false,
  title,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rich-editor-tool ${active ? "rich-editor-tool-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, onUploadImage }) {
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      ResizableImage,
    ],

    content: parseContent(value),

    editorProps: {
      attributes: {
        class: "rich-editor-content",
      },
    },

    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  // Keep the editor synchronized when an existing work is loaded.
  useEffect(() => {
    if (!editor) return;

    const nextContent = parseContent(value);
    const currentContent = JSON.stringify(editor.getJSON());
    const nextContentString = JSON.stringify(nextContent);

    if (currentContent !== nextContentString) {
      editor.commands.setContent(nextContent, false);
    }
  }, [editor, value]);

  const insertImage = async (file) => {
    if (!editor || !file || !onUploadImage) return;

    if (!file.type.startsWith("image/")) {
      window.alert("Please select an image file.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      window.alert("Inline images must be 3MB or smaller.");
      return;
    }

    try {
      const url = await onUploadImage(file);

      console.log("Uploaded image URL:", url);

      if (!url) {
        window.alert("The image was uploaded, but no image URL was returned.");
        return;
      }

      const inserted = editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: url,
            alt: file.name,
            title: file.name,
            width: 70,
            align: "center",
          },
        })
        .run();

      console.log("Image inserted:", inserted);
    } catch (error) {
      console.error("Inline image upload failed:", error);
      window.alert("Could not add the image. Check the console for details.");
    }
  };

  if (!editor) {
    return (
      <div className="rich-editor-shell">
        <div className="rich-editor-loading">Loading editor…</div>
      </div>
    );
  }

  return (
    <div className="rich-editor-shell">
      <div className="rich-editor-toolbar">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </ToolbarButton>

        <span className="rich-editor-divider" />

        <ToolbarButton
          title="Heading"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </ToolbarButton>

        <ToolbarButton
          title="Small heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          title="Quote block"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “
        </ToolbarButton>

        <span className="rich-editor-divider" />

        <ToolbarButton
          title="Add an image"
          onClick={() => fileInputRef.current?.click()}
        >
          <FiImage size={16} />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];

            if (file) {
              await insertImage(file);
            }

            e.target.value = "";
          }}
        />

        <div className="rich-editor-toolbar-spacer" />

        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

export { parseContent };
