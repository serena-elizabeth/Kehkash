import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";

import { db, functions, storage } from "../firebase";
import { INPUT_LIMITS } from "./inputLimits";
import { workContentToText } from "./richText";

async function uploadToStorage(path, file) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}

export const CATEGORIES = [
  "poems",
  "quotes",
  "stories",
  "articles",
  "songs",
  "photos",
  "other",
];

export const WORK_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  REJECTED: "rejected",
};

export const WORK_VISIBILITY = {
  PRIVATE: "private",
  SUBMITTED: "submitted",
  PUBLIC: "public",
};

export function emptyWork(uid = "") {
  return {
    ownerUid: uid,
    spaceId: "",
    title: "",
    category: "poems",
    content: "",
    tags: [],
    coverUrl: "",
    attachmentUrl: "",
    attachmentName: "",
    attachmentType: "",
    status: WORK_STATUS.DRAFT,
    visibility: WORK_VISIBILITY.PRIVATE,
    scheduledAt: null,
    sortKey: "newest",
    imageAddOn: "",
    icon: "",
    spaceName: "",
  };
}

export async function getSpacesByOwner(uid) {
  const q = query(collection(db, "spaces"), where("ownerUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getSpace(id) {
  const snap = await getDoc(doc(db, "spaces", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createSpace(uid, data) {
  const tags = Array.isArray(data.tags)
    ? [
        ...new Set(
          data.tags
            .map((tag) => String(tag).replace(/\s+/g, " ").trim().toLowerCase())
            .filter(Boolean)
            .map((tag) => tag.slice(0, INPUT_LIMITS.tag)),
        ),
      ].slice(0, 10)
    : [];
  const payload = {
    ownerUid: uid,
    name: String(data.name || "").slice(0, 80),
    bio: String(data.bio || "").slice(0, 500),
    theme: data.theme || "#d4af37",
    iconURL: data.iconURL || "",
    coverURL: data.coverURL || "",
    createdAt: serverTimestamp(),
  };
  const snap = await addDoc(collection(db, "spaces"), payload);
  return snap.id;
}

export async function updateSpace(id, data) {
  await updateDoc(doc(db, "spaces", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSpace(id) {
  await deleteDoc(doc(db, "spaces", id));
}

export async function deleteSpaceAndContent(spaceId) {
  const q = query(collection(db, "works"), where("spaceId", "==", spaceId));

  const snap = await getDocs(q);

  for (const work of snap.docs) {
    await deleteDoc(doc(db, "works", work.id));
  }

  await deleteDoc(doc(db, "spaces", spaceId));
}

export async function deleteSpaceKeepContent(spaceId) {
  const q = query(collection(db, "works"), where("spaceId", "==", spaceId));

  const snap = await getDocs(q);

  for (const work of snap.docs) {
    await updateDoc(doc(db, "works", work.id), {
      spaceId: "",
      spaceName: "",
      updatedAt: serverTimestamp(),
    });
  }

  await deleteDoc(doc(db, "spaces", spaceId));
}

export async function getSpaceWorks(spaceId, max = 100) {
  const q = query(
    collection(db, "works"),
    where("spaceId", "==", spaceId),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), _source: "works" }));
}

export async function getPublicSpaceWorks(spaceId, max = 100) {
  const q = query(
    collection(db, "works"),
    where("spaceId", "==", spaceId),
    where("status", "==", WORK_STATUS.PUBLISHED),
    where("visibility", "==", WORK_VISIBILITY.PUBLIC),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), _source: "works" }));
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));

  if (snap.exists()) {
    return { uid, ...snap.data() };
  }

  return {
    uid,
    name: "",
    bio: "",
    photoURL: "",
    spaceName: "",
    spaceTheme: "gold",
    spaceIconURL: "",
  };
}

export async function saveUserProfile(uid, data) {
  const payload = {
    uid,
    name: String(data.name || "").slice(0, 80),
    bio: String(data.bio || "").slice(0, 500),
    photoURL: data.photoURL || "",
    spaceName: String(data.spaceName || "").slice(0, 80),
    spaceTheme: data.spaceTheme || "gold",
    spaceIconURL: data.spaceIconURL || "",
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), payload, { merge: true });
  await setDoc(doc(db, "publicSpaces", uid), payload, { merge: true });

  return payload;
}

export async function createWork(uid, data) {
  const tags = Array.isArray(data.tags)
    ? data.tags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const payload = {
    ...emptyWork(uid),
    ...data,
    ownerUid: uid,

    title: String(data.title || "").slice(0, INPUT_LIMITS.workTitle),

    // Rich text is stored as a JSON string.
    content:
      typeof data.content === "string"
        ? data.content
        : JSON.stringify(data.content || {}),

    tags,

    status: data.status || WORK_STATUS.DRAFT,
    visibility: data.visibility || WORK_VISIBILITY.PRIVATE,

    likes: 0,
    likedBy: [],
    reactions: {},
    reactionBy: {},
    savedBy: [],

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const snap = await addDoc(collection(db, "works"), payload);

  return snap.id;
}

export async function saveWork(id, uid, data, source = "works") {
  if (!id) {
    throw new Error("Missing work ID.");
  }

  if (!uid) {
    throw new Error("Missing user ID.");
  }

  if (!source) {
    source = "works";
  }

  await updateDoc(doc(db, source, id), {
    ...data,
    ownerUid: uid,
    updatedAt: serverTimestamp(),
  });
}

export async function setWorkVisibility(id, uid, visibility) {
  if (
    visibility !== WORK_VISIBILITY.PUBLIC &&
    visibility !== WORK_VISIBILITY.PRIVATE
  ) {
    throw new Error("Invalid visibility.");
  }

  await updateDoc(doc(db, "works", id), {
    visibility,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWork(
  id,
  { modern = true, category = "", ownerUid = "", currentUserUid = "", isAdmin = false } = {},
) {
  if (!id) {
    throw new Error("Missing work ID.");
  }

  if (!currentUserUid || (!isAdmin && (!ownerUid || currentUserUid !== ownerUid))) {
    throw new Error("You are not allowed to delete this work.");
  }

  const collectionName = modern ? "works" : category;

  if (!collectionName) {
    throw new Error("Missing work category.");
  }

  await deleteDoc(doc(db, collectionName, id));
}

export async function getWork(id, source = "works") {
  if (!id) return null;

  const snap = await getDoc(doc(db, source, id));

  return snap.exists()
    ? { id: snap.id, ...snap.data(), _source: source }
    : null;
}

export async function getMyWorks(uid, max = 100) {
  const q = query(
    collection(db, "works"),
    where("ownerUid", "==", uid),
    limit(max),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    _source: "works",
  }));
}

export async function getSavedWorks(uid, max = 100) {
  if (!uid) return [];

  const q = query(
    collection(db, "works"),
    where("savedBy", "array-contains", uid),
    limit(max),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    _source: "works",
  }));
}
export async function getPublicWorks(category = "", max = 30) {
  const q = query(
    collection(db, "works"),
    where("status", "==", WORK_STATUS.PUBLISHED),
    where("visibility", "==", WORK_VISIBILITY.PUBLIC),
    orderBy("createdAt", "desc"),
    limit(category ? Math.min(max * 3, 150) : max),
  );

  const snap = await getDocs(q);

  const rows = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    _source: "works",
  }));

  return category
    ? rows.filter((x) => x.category === category).slice(0, max)
    : rows;
}

export async function getPublicWorksByOwner(uid, max = 100) {
  const q = query(
    collection(db, "works"),
    where("ownerUid", "==", uid),
    where("status", "==", WORK_STATUS.PUBLISHED),
    where("visibility", "==", WORK_VISIBILITY.PUBLIC),
    orderBy("createdAt", "desc"),
    limit(max),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    _source: "works",
  }));
}

export async function uploadSpaceImage(uid, file, kind = "profile") {
  if (!file) return null;

  const max = 2 * 1024 * 1024;

  if (file.size > max) {
    throw new Error("Image is larger than the 2MB limit.");
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

  if (!allowed.includes(file.type)) {
    throw new Error("Use JPG, PNG, WebP, or SVG.");
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const path = `spaces/${uid}/${kind}_${Date.now()}_${safe}`;

  const url = await uploadToStorage(path, file);

  return {
    url,
    name: file.name,
    type: file.type,
  };
}

export async function getPublicSpace(uid) {
  const snap = await getDoc(doc(db, "publicSpaces", uid));
  return snap.exists() ? snap.data() : null;
}

export async function uploadWorkFile(uid, file, kind = "attachment") {
  if (!file) return null;

  const max = kind === "cover" || kind === "inline-image" ? 3 * 1024 * 1024 : 10 * 1024 * 1024;
  const imageTypes = ["image/jpeg", "image/png", "image/webp"];
  const attachmentTypes = [
    ...imageTypes, "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/ogg",
  ];

  if ((kind === "cover" || kind === "inline-image") && !imageTypes.includes(file.type)) {
    throw new Error("Use JPG, PNG, or WebP images.");
  }
  if (kind === "attachment" && !attachmentTypes.includes(file.type)) {
    throw new Error("This file type is not supported.");
  }

  if (file.size > max) {
    throw new Error(
      `File is larger than the ${Math.round(max / 1024 / 1024)}MB limit.`,
    );
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const path = `user-works/${uid}/${Date.now()}_${safe}`;

  const url = await uploadToStorage(path, file);

  return {
    url,
    name: file.name,
    type: file.type,
  };
}
export const REACTIONS = [
  { id: "loved", emoji: "❤️" },
  { id: "tender", emoji: "🩷" },
  { id: "deep", emoji: "💜" },
  { id: "peaceful", emoji: "💙" },
  { id: "dreamy", emoji: "🩵" },
  { id: "joyful", emoji: "💛" },
  { id: "bittersweet", emoji: "🖤" },
  { id: "beautiful", emoji: "🤍" },
  { id: "atmospheric", emoji: "🌙" },
  { id: "thoughtProvoking", emoji: "🧠" },
];

export async function toggleReaction(work, uid, reactionId) {
  if (!work?.id || !uid || !reactionId) {
    throw new Error("Invalid reaction data.");
  }
  const call = httpsCallable(functions, "toggleWorkEngagement");
  const { data } = await call({ workId: work.id, action: "reaction", reactionId });
  return data;
}

export async function toggleLike(work, uid) {
  if (!work?.id || !uid) {
    throw new Error("Invalid like data.");
  }

  const call = httpsCallable(functions, "toggleWorkEngagement");
  const { data } = await call({ workId: work.id, action: "like" });
  return data;
}

export async function toggleSave(work, uid) {
  if (!work?.id || !uid) {
    throw new Error("Invalid bookmark data.");
  }

  const call = httpsCallable(functions, "toggleWorkEngagement");
  const { data } = await call({ workId: work.id, action: "save" });
  return data.saved;
}

export async function toggleLegacyLike(category, id) {
  const call = httpsCallable(functions, "toggleLegacyLike");
  const { data } = await call({ category, id });
  return data;
}
