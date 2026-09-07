const EMPTY_DOCUMENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export function parseWorkContent(value) {
  if (!value) return EMPTY_DOCUMENT;

  if (typeof value === "object") {
    return value;
  }

  if (typeof value !== "string") {
    return EMPTY_DOCUMENT;
  }

  try {
    const parsed = JSON.parse(value);

    if (parsed?.type === "doc") {
      return parsed;
    }
  } catch {
    // Old work stored as plain text.
  }

  const paragraphs = value.split(/\r?\n/);

  return {
    type: "doc",
    content: paragraphs.map((text) => ({
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
    })),
  };
}

function collectText(node, result) {
  if (!node) return;

  if (node.type === "text") {
    result.push(node.text || "");
    return;
  }

  if (node.type === "image") {
    return;
  }

  if (Array.isArray(node.content)) {
    node.content.forEach((child, index) => {
      collectText(child, result);

      if (
        child.type === "paragraph" ||
        child.type === "heading" ||
        child.type === "blockquote"
      ) {
        if (index < node.content.length - 1) {
          result.push("\n");
        }
      }
    });
  }
}

export function workContentToText(value) {
  if (!value) return "";

  // Existing plain-text works.
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (parsed?.type === "doc") {
        const result = [];
        collectText(parsed, result);
        return result.join("").replace(/\n{3,}/g, "\n\n").trim();
      }
    } catch {
      return value;
    }

    return value;
  }

  const result = [];
  collectText(value, result);

  return result.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export function getReadingTime(value) {
  const text = workContentToText(value);

  if (!text) return 0;

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  if (!words) return 0;

  // Average adult reading speed.
  const WORDS_PER_MINUTE = 200;

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}