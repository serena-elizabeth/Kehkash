const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

initializeApp();

const db = getFirestore();
const REACTION_IDS = new Set([
  "loved", "tender", "deep", "peaceful", "dreamy",
  "joyful", "bittersweet", "beautiful", "atmospheric", "thoughtProvoking",
]);
const LEGACY_CATEGORIES = new Set([
  "quotes", "poems", "articles", "songs", "photos", "stories",
]);

function requireUser(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to continue.");
  }
  return request.auth.uid;
}

function visibleWork(work) {
  return work.status === "published" && work.visibility === "public";
}

async function toggleReaction(workId, uid, reactionId) {
  return db.runTransaction(async (transaction) => {
    const ref = db.collection("works").doc(workId);
    const snap = await transaction.get(ref);
    if (!snap.exists || !visibleWork(snap.data())) {
      throw new HttpsError("not-found", "Work not found.");
    }

    const work = snap.data();
    const reactions = { ...(work.reactions || {}) };
    const reactionBy = { ...(work.reactionBy || {}) };
    const likedBy = Array.isArray(work.likedBy) ? [...work.likedBy] : [];
    const oldReaction = reactionBy[uid] || (likedBy.includes(uid) ? "loved" : null);
    let reaction = reactionId;

    if (oldReaction === reactionId) {
      reactions[reactionId] = Math.max(0, (reactions[reactionId] || 0) - 1);
      delete reactionBy[uid];
      reaction = null;
    } else {
      if (oldReaction) {
        reactions[oldReaction] = Math.max(0, (reactions[oldReaction] || 0) - 1);
      }
      reactions[reactionId] = Math.max(0, (reactions[reactionId] || 0) + 1);
      reactionBy[uid] = reactionId;
    }

    const nextLikedBy = likedBy.filter((id) => id !== uid);
    if (reaction === "loved") nextLikedBy.push(uid);

    transaction.update(ref, {
      reactions,
      reactionBy,
      likedBy: nextLikedBy,
      likes: Math.max(0, reactions.loved || 0),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { reaction, reactions, likes: Math.max(0, reactions.loved || 0) };
  });
}

exports.toggleWorkEngagement = onCall(async (request) => {
  const uid = requireUser(request);
  const { workId, action, reactionId } = request.data || {};
  if (typeof workId !== "string" || !workId) {
    throw new HttpsError("invalid-argument", "A work ID is required.");
  }

  if (action === "save") {
    return db.runTransaction(async (transaction) => {
      const ref = db.collection("works").doc(workId);
      const snap = await transaction.get(ref);
      if (!snap.exists || !visibleWork(snap.data())) {
        throw new HttpsError("not-found", "Work not found.");
      }
      const savedBy = Array.isArray(snap.data().savedBy) ? snap.data().savedBy : [];
      const saved = !savedBy.includes(uid);
      transaction.update(ref, {
        savedBy: saved ? [...savedBy, uid] : savedBy.filter((id) => id !== uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { saved };
    });
  }

  const targetReaction = action === "like" ? "loved" : reactionId;
  if (action !== "like" && action !== "reaction") {
    throw new HttpsError("invalid-argument", "Unsupported engagement action.");
  }
  if (!REACTION_IDS.has(targetReaction)) {
    throw new HttpsError("invalid-argument", "Unsupported reaction.");
  }
  const result = await toggleReaction(workId, uid, targetReaction);
  return action === "like"
    ? { liked: result.reaction === "loved", likes: result.likes }
    : result;
});

exports.toggleLegacyLike = onCall(async (request) => {
  const uid = requireUser(request);
  const { category, id } = request.data || {};
  if (!LEGACY_CATEGORIES.has(category) || typeof id !== "string" || !id) {
    throw new HttpsError("invalid-argument", "Invalid content reference.");
  }

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(category).doc(id);
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Content not found.");
    const likedBy = Array.isArray(snap.data().likedBy) ? snap.data().likedBy : [];
    const liked = !likedBy.includes(uid);
    const nextLikedBy = liked ? [...likedBy, uid] : likedBy.filter((value) => value !== uid);
    transaction.update(ref, { likedBy: nextLikedBy, likes: nextLikedBy.length });
    return { liked, likes: nextLikedBy.length };
  });
});

function updateCommentCount(event, amount) {
  const parent = event.data.ref.parent.parent;
  return parent.update({ commentCount: FieldValue.increment(amount) });
}

exports.incrementCommentCount = onDocumentCreated(
  "{category}/{contentId}/comments/{commentId}",
  (event) => updateCommentCount(event, 1),
);

exports.decrementCommentCount = onDocumentDeleted(
  "{category}/{contentId}/comments/{commentId}",
  (event) => updateCommentCount(event, -1),
);

exports.publishScheduledWorks = onSchedule("every 1 minutes", async () => {
  const now = Timestamp.now();
  const scheduled = await db.collection("works")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .limit(400)
    .get();
  if (scheduled.empty) return;

  const batch = db.batch();
  scheduled.docs.forEach((work) => {
    batch.update(work.ref, {
      status: "published",
      visibility: "public",
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
});
