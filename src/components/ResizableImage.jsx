import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { FiAlignLeft, FiAlignCenter, FiAlignRight } from "react-icons/fi";

function ResizableImageView({ node, updateAttributes, selected }) {
  const width = Number(node.attrs.width) || 70;
  const align = node.attrs.align || "center";

  const justifyContent =
    align === "left"
      ? "flex-start"
      : align === "right"
        ? "flex-end"
        : "center";

  return (
    <NodeViewWrapper className="rich-image-node">
      <div
        className={`rich-image-container ${
          selected ? "rich-image-selected" : ""
        }`}
        style={{
          justifyContent,
        }}
      >
        {selected && (
          <div className="rich-image-controls">
            <div className="rich-image-alignment">
              <button
                type="button"
                title="Align left"
                className={align === "left" ? "active" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  updateAttributes({
                    align: "left",
                  })
                }
              >
                <FiAlignLeft size={14} />
              </button>

              <button
                type="button"
                title="Align center"
                className={align === "center" ? "active" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  updateAttributes({
                    align: "center",
                  })
                }
              >
                <FiAlignCenter size={14} />
              </button>

              <button
                type="button"
                title="Align right"
                className={align === "right" ? "active" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  updateAttributes({
                    align: "right",
                  })
                }
              >
                <FiAlignRight size={14} />
              </button>
            </div>

            <div className="rich-image-slider">
              <input
                type="range"
                min="15"
                max="100"
                step="1"
                value={width}
                aria-label="Image width"
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) =>
                  updateAttributes({
                    width: Number(e.target.value),
                  })
                }
              />

              <span>{width}%</span>
            </div>
          </div>
        )}

        <div
          className="rich-image-frame"
          style={{
            width: `${width}%`,
          }}
        >
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ""}
            title={node.attrs.title || ""}
            draggable={false}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Node.create({
  name: "image",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },

      alt: {
        default: "",
      },

      title: {
        default: "",
      },

      width: {
        default: 70,
      },

      align: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      width,
      align,
      ...imageAttributes
    } = HTMLAttributes;

    return [
      "div",
      {
        "data-image-align": align,
        style: `width:${width}%;`,
      },
      ["img", mergeAttributes(imageAttributes)],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});