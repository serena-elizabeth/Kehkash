export const INPUT_LIMITS = {
  displayName: 60,
  username: 20,
  spaceName: 15,
  spaceDescription: 300,
  workTitle: 100,
  workWords: 10000,
  quote: 500,
  comment: 200,
  bio: 200,
  search: 100,
  tag: 15,
  attachmentName: 50,
};
export function wordCount(text = "") {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function exceedsWordLimit(text, limit) {
  return wordCount(text) > limit;
}
export function normalizeText(text = "") {
  return text.replace(/\s+/g, " ").trim();
}