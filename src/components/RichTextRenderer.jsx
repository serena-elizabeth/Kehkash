import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";

import { parseWorkContent } from "../lib/richText";

export default function RichTextRenderer({
  value,
  accent = "#d4af37",
}) {
  const editor = useEditor({
    editable: false,

    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),

      Underline,

      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],

    content: parseWorkContent(value),

    editorProps: {
      attributes: {
        class: "rich-renderer-content",
      },

      transformPastedHTML: (html) => html,
    },
  });

  useEffect(() => {
    if (!editor) return;

    editor.commands.setContent(
      parseWorkContent(value),
      false,
    );
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      className="rich-renderer"
      style={{
        "--work-accent": accent || "#d4af37",
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}