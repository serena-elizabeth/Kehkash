import { useEffect, useRef, useState, useMemo } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { INPUT_LIMITS, wordCount } from "../lib/inputLimits";
import {
  CATEGORIES,
  emptyWork,
  createWork,
  saveWork,
  deleteWork,
  getWork,
  getSpacesByOwner,
  getSpace,
  uploadWorkFile,
  WORK_STATUS,
  WORK_VISIBILITY,
} from "../lib/workModel";
import RichTextEditor from "../components/RichTextEditor";
import { workContentToText, getReadingTime } from "../lib/richText";

const FILE_TYPES = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.mp3,.wav,.m4a,.ogg";
const icons = ["✦", "❧", "☾", "∞", "❋", "⌁", "◌", "♡", "✧", "§"];

export default function WorkEditor() {
  const { user, isAdmin, loading } = useAuth();
  const { id } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const spaceParam = searchParams.get("space");
  const sourceParam = searchParams.get("source") || "works";
  const [data, setData] = useState(emptyWork(user?.uid));
  const [loaded, setLoaded] = useState(!id);
  const [initialLoadComplete, setInitialLoadComplete] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [cover, setCover] = useState(null);
  const [file, setFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accent, setAccent] = useState("#d4af37");
  const [spaces, setSpaces] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const list = await getSpacesByOwner(user.uid);
        setSpaces(list);

        // New work: use the Space from the URL.
        if (!id && spaceParam) {
          const selected = list.find((x) => x.id === spaceParam);

          if (selected) {
            update("spaceId", selected.id);

            if (selected.theme?.startsWith?.("#")) {
              setAccent(selected.theme);
            }
          }

          return;
        }

        // New work without a Space.
        if (!id && !spaceParam) {
          update("spaceId", "");
          setAccent("#d4af37");
        }
      } catch {}
    })();
  }, [user, spaceParam, id]);

  useEffect(() => {
    if (!id || !data.spaceId || spaces.length === 0) return;

    const selectedSpace = spaces.find((space) => space.id === data.spaceId);

    if (selectedSpace?.theme?.startsWith?.("#")) {
      setAccent(selectedSpace.theme);
    }
  }, [id, data.spaceId, spaces]);

  useEffect(() => {
    document.documentElement.style.setProperty("--space-scrollbar", accent);

    document.documentElement.style.setProperty("--space-accent", accent);

    return () => {
      document.documentElement.style.setProperty(
        "--space-scrollbar",
        "#d4af37",
      );

      document.documentElement.style.setProperty("--space-accent", "#d4af37");
    };
  }, [accent]);
  useEffect(() => {
    if (!id || !user) return;

    getWork(id, sourceParam).then((x) => {
      if (!x || x.ownerUid !== user.uid) {
        toast.error("You cannot edit this work");
        nav("/me");
        return;
      }

      setData(x);

      if (x.scheduledAt) {
        const date =
          typeof x.scheduledAt?.toDate === "function"
            ? x.scheduledAt.toDate()
            : new Date(x.scheduledAt);

        if (!Number.isNaN(date.getTime())) {
          const local = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16);

          setScheduledAt(local);
          setScheduleEnabled(true);
        }
      }

      setLoaded(true);
      setInitialLoadComplete(true);
    });
  }, [id, user, sourceParam]);
  useEffect(() => {
    if (!loaded || !initialLoadComplete || !user || !dirty) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const plainContent = workContentToText(data.content);

      if (!(data.title?.trim() || plainContent.trim())) return;
      try {
        setSaveError("");
        const draftPayload = {
          title: data.title,
          category: data.category,
          content: data.content,
          tags: data.tags || [],
          spaceId: data.spaceId || "",
          coverUrl: data.coverUrl || "",
          attachmentUrl: data.attachmentUrl || "",
          attachmentName: data.attachmentName || "",
          attachmentType: data.attachmentType || "",
          icon: data.icon || "",
          visibility: data.visibility || WORK_VISIBILITY.PRIVATE,
          status:
            data.status === WORK_STATUS.PUBLISHED
              ? WORK_STATUS.PUBLISHED
              : data.status === WORK_STATUS.PENDING
                ? WORK_STATUS.PENDING
                : WORK_STATUS.DRAFT,
        };
        if (id) {
          await saveWork(id, user.uid, draftPayload, sourceParam);
        } else {
          const newId = await createWork(user.uid, {
            ...data,
            ...draftPayload,
            status: WORK_STATUS.DRAFT,
          });

          nav(`/write/${newId}`, { replace: true });
        }

        setSaved(true);
        setDirty(false);
      } catch (e) {
        setSaved(false);
        setSaveError(
          e?.code === "permission-denied"
            ? "Firebase permission denied. Deploy the included Firestore rules."
            : e?.message || "Autosave failed",
        );
      }
    }, 800);
    return () => clearTimeout(timer.current);
  }, [
    data.title,
    data.content,
    data.category,
    data.spaceId,
    data.tags,
    data.visibility,
    data.coverUrl,
    data.attachmentUrl,
    data.icon,
    loaded,
    initialLoadComplete,
    user,
    id,
    sourceParam,
  ]);

  if (loading || !loaded)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;

  const update = (k, v) => {
    setData((x) => ({ ...x, [k]: v }));
    setDirty(true);
    setSaved(false);
  };
  const addTag = () => {
    const tag = tagInput.trim().replace(/\s+/g, " ").toLowerCase();

    if (!tag) return;

    if (tag.length > INPUT_LIMITS.tag) {
      return toast.error(
        `Each tag must be ${INPUT_LIMITS.tag} characters or less`,
      );
    }

    const currentTags = Array.isArray(data.tags) ? data.tags : [];

    if (currentTags.includes(tag)) {
      setTagInput("");
      return;
    }

    if (currentTags.length >= 6) {
      return toast.error("You can add up to 6 tags");
    }

    update("tags", [...currentTags, tag]);
    setTagInput("");
  };

  const removeTag = (tagToRemove) => {
    update(
      "tags",
      (data.tags || []).filter((tag) => tag !== tagToRemove),
    );
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };
  const uploadInlineImage = async (chosenFile) => {
    if (!chosenFile) return null;

    if (!chosenFile.type.startsWith("image/")) {
      toast.error("Please choose an image.");
      return null;
    }

    if (chosenFile.size > 3 * 1024 * 1024) {
      toast.error("Inline images must be 3MB or smaller.");
      return null;
    }

    try {
      const result = await uploadWorkFile(user.uid, chosenFile, "inline-image");

      toast.success("Image added");

      return result.url;
    } catch (e) {
      toast.error(e?.message || "Image upload failed");
      return null;
    }
  };
  const upload = async (kind, chosenFile) => {
    const chosen = chosenFile || (kind === "cover" ? cover : file);
    if (!chosen) return;
    if (kind === "cover") setUploadingCover(true);
    else setUploadingFile(true);
    try {
      const result = await uploadWorkFile(user.uid, chosen, kind);
      if (kind === "cover") {
        update("coverUrl", result.url);
      } else {
        if (result.name.length > INPUT_LIMITS.attachmentName) {
          toast.error(
            `Attachment name must be ${INPUT_LIMITS.attachmentName} characters or less`,
          );
          return;
        }

        update("attachmentUrl", result.url);
        update("attachmentName", result.name);
        update("attachmentType", result.type);
      }
      toast.success("File added");
    } catch (e) {
      toast.error(e.message || "Upload failed");
    } finally {
      if (kind === "cover") setUploadingCover(false);
      else setUploadingFile(false);
    }
  };
  const pickCover = (e) => {
    const f = e.target.files?.[0] || null;

    if (!f) return;

    if (f.size > 2 * 1024 * 1024) {
      toast.error("Cover image must be 2MB or smaller");
      e.target.value = "";
      return;
    }

    setCover(f);
    setCoverPreview(URL.createObjectURL(f));
    upload("cover", f);
  };
  const pickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) upload("attachment", f);
  };
  const removeCover = () => {
    setCover(null);
    setCoverPreview("");
    update("coverUrl", "");
  };
  const removeWork = async () => {
    if (!id) return;
    if (!window.confirm("Delete this work? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteWork(id, {
        ownerUid: data.ownerUid,
        currentUserUid: user.uid,
      });
      toast.success("Work deleted");

      nav("/me");
    } catch (e) {
      toast.error(
        e?.code === "permission-denied"
          ? "Firebase permission denied."
          : e.message || "Could not delete",
      );
    } finally {
      setDeleting(false);
    }
  };
  const submit = async () => {
    if (!data.title.trim()) return toast.error("Give the work a title");

    if (data.title.length > INPUT_LIMITS.workTitle) {
      return toast.error(
        `Title must be ${INPUT_LIMITS.workTitle} characters or less`,
      );
    }

    if (wordCount(workContentToText(data.content)) > INPUT_LIMITS.workWords) {
      return toast.error(
        `Work cannot exceed ${INPUT_LIMITS.workWords.toLocaleString()} words`,
      );
    }

    if (
      data.attachmentName &&
      data.attachmentName.length > INPUT_LIMITS.attachmentName
    ) {
      return toast.error(
        `Attachment name must be ${INPUT_LIMITS.attachmentName} characters or less`,
      );
    }
    if (
      data.category !== "photos" &&
      !data.content.trim() &&
      !data.attachmentUrl
    )
      return toast.error("Add some content or a file");
    setSaving(true);
    try {
      const isSubmit = data.visibility === WORK_VISIBILITY.SUBMITTED;

      const adminPublish = isAdmin && isSubmit && !scheduleEnabled;

      const adminSchedule =
        isAdmin && isSubmit && scheduleEnabled && scheduledAt;

      if (isAdmin && isSubmit && scheduleEnabled && !scheduledAt) {
        setSaving(false);
        return toast.error("Choose a publication date and time");
      }

      if (adminSchedule) {
        const publishDate = new Date(scheduledAt);

        if (Number.isNaN(publishDate.getTime())) {
          setSaving(false);
          return toast.error("Choose a valid publication date and time");
        }

        if (publishDate <= new Date()) {
          setSaving(false);
          return toast.error("Scheduled time must be in the future");
        }
      }

      const payload = {
        ...data,

        status: adminSchedule
          ? WORK_STATUS.SCHEDULED
          : adminPublish
            ? WORK_STATUS.PUBLISHED
            : isSubmit
              ? WORK_STATUS.PENDING
              : WORK_STATUS.DRAFT,

        visibility: adminSchedule
          ? WORK_VISIBILITY.PRIVATE
          : adminPublish
            ? WORK_VISIBILITY.PUBLIC
            : isSubmit
              ? WORK_VISIBILITY.SUBMITTED
              : WORK_VISIBILITY.PRIVATE,

        scheduledAt: adminSchedule ? new Date(scheduledAt) : null,
      };
      if (id) {
        await saveWork(id, user.uid, payload, sourceParam);
      } else {
        await createWork(user.uid, payload);
      }
      setDirty(false);
      setSaved(true);
      toast.success(
        adminSchedule
          ? "Publication scheduled"
          : adminPublish
            ? "Published to the anthology"
            : isSubmit
              ? "Submitted for approval"
              : "Saved as private draft",
      );

      nav("/me");
    } catch (e) {
      toast.error(
        e?.code === "permission-denied"
          ? "Firebase permission denied. Deploy the included Firestore rules."
          : e.message || "Could not save",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="space-themed-content min-h-screen pt-28 pb-24 max-w-4xl mx-auto px-4 sm:px-6"
      style={{
        "--gold": accent,
        "--space-accent": accent,
        "--space-selection-color": accent,
        "--space-scrollbar": accent,
      }}
    >
      <div className="mb-8">
        <Link
          to={
            id && data.ownerUid && data.spaceId
              ? `/space/${data.ownerUid}/${data.spaceId}`
              : "/me"
          }
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted hover:text-gold transition-colors mb-6"
        >
          ← Back to My Space
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <span className="eyebrow">Create</span>
            <h1 className="font-serif text-5xl text-heading mt-2">
              {id ? "Edit work" : "New work"}
            </h1>
          </div>

          <span className="text-xs text-muted">
            {saveError
              ? saveError
              : saving
                ? "Saving…"
                : dirty
                  ? "Unsaved changes"
                  : saved
                    ? "Saved"
                    : "Draft"}
          </span>
        </div>
      </div>
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="field">
            <span>Title</span>
            <input
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={INPUT_LIMITS.workTitle}
              placeholder="Untitled"
            />
            <span className="text-xs text-muted">
              {data.title.length}/{INPUT_LIMITS.workTitle} characters
            </span>
          </label>
          <div className="field">
            <span>Tags</span>

            <div className="flex flex-wrap gap-2 mb-2">
              {(data.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-line text-body rounded-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted hover:text-red-400"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              maxLength={INPUT_LIMITS.tag}
              placeholder="Add a tag and press Enter"
            />

            <span className="text-xs text-muted">
              {(data.tags || []).length}/10 tags · {INPUT_LIMITS.tag} characters
              max per tag
            </span>
          </div>

          <label className="field">
            <span>Type</span>
            <select
              value={data.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Space</span>
            <select
              value={data.spaceId || ""}
              onChange={(e) => update("spaceId", e.target.value)}
            >
              <option value="" disabled>
                Select a space
              </option>

              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="field">
          <span>Your work</span>

          <RichTextEditor
            value={data.content}
            onChange={(value) => {
              const plainText = workContentToText(value);

              if (wordCount(plainText) <= INPUT_LIMITS.workWords) {
                update("content", value);
              } else {
                toast.error(
                  `Work cannot exceed ${INPUT_LIMITS.workWords.toLocaleString()} words`,
                );
              }
            }}
            onUploadImage={uploadInlineImage}
          />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              {wordCount(workContentToText(data.content)).toLocaleString()}/
              {INPUT_LIMITS.workWords.toLocaleString()} words
            </span>

            {getReadingTime(data.content) > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{getReadingTime(data.content)} min read</span>
              </>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <p className="field-label">Optional cover</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pickCover}
              className="file-input"
            />

            {uploadingCover && (
              <p className="text-xs text-muted mt-2">Uploading cover…</p>
            )}
            {(coverPreview || data.coverUrl) && (
              <div className="relative mt-3">
                <img
                  src={coverPreview || data.coverUrl}
                  className="h-28 w-full object-cover rounded-sm"
                />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-1 right-1 px-2 py-1 bg-black/60 text-white text-xs rounded-sm"
                >
                  Remove
                </button>
              </div>
            )}
            <p className="text-xs text-muted mt-2">Image: 2MB max.</p>
          </div>
          <div>
            <p className="field-label">Optional file</p>
            <input
              type="file"
              accept={FILE_TYPES}
              onChange={pickFile}
              className="file-input"
            />
            {uploadingFile && (
              <p className="text-xs text-muted mt-2">Uploading file…</p>
            )}
            {data.attachmentName && (
              <p className="text-xs text-muted mt-3">{data.attachmentName}</p>
            )}
            <p className="text-xs text-muted mt-2">
              Attachment name: {INPUT_LIMITS.attachmentName} characters max.
            </p>

            <p className="text-xs text-muted mt-1">
              Images: 3MB max. Other files: 10MB max.
            </p>
          </div>
        </div>
        <div>
          <p className="field-label">Icon</p>
          <div className="flex flex-wrap gap-2">
            {icons.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => update("icon", i)}
                className={`icon-choice ${data.icon === i ? "icon-choice-active" : ""}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="field-label">Visibility</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(isAdmin
              ? [
                  ["private", "Private", "Only you can see it."],
                  [
                    "submitted",
                    "Publish publicly",
                    "As curator, your work can be published immediately.",
                  ],
                ]
              : [
                  ["private", "Private", "Only you can see it."],
                  [
                    "submitted",
                    "Submit for approval",
                    "Send it to Serena. It will stay private until approved.",
                  ],
                ]
            ).map(([v, t, d]) => (
              <button
                key={v}
                type="button"
                onClick={() => update("visibility", v)}
                className={`choice ${data.visibility === v ? "choice-active" : ""}`}
              >
                <b>{t}</b>
                <span>{d}</span>
              </button>
            ))}
          </div>
        </div>
        {isAdmin && data.visibility === WORK_VISIBILITY.SUBMITTED && (
          <div className="border border-line rounded-sm p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => {
                  setScheduleEnabled(e.target.checked);

                  if (!e.target.checked) {
                    setScheduledAt("");
                  }
                }}
                className="accent-[var(--gold)]"
              />

              <span className="text-sm text-body">Schedule publication</span>
            </label>

            {scheduleEnabled && (
              <div>
                <label className="field">
                  <span>Publish on</span>

                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={new Date(Date.now() + 60000)
                      .toISOString()
                      .slice(0, 16)}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </label>

                <p className="text-xs text-muted mt-2">
                  The work will remain private until the scheduled time.
                </p>
              </div>
            )}
          </div>
        )}
        <div className="border-t border-line pt-5 flex flex-wrap justify-between gap-3 items-center">
          <p className="text-xs text-muted max-w-xl">
            {isAdmin
              ? "You are the curator. Your work can be published directly. Other users must receive your approval before their work becomes public."
              : "Nothing becomes public automatically. Private works stay private. Submitting sends the work for approval. Changes are auto-saved as a draft while you work."}
          </p>
          <div className="flex gap-3">
            {id && (
              <button
                onClick={removeWork}
                disabled={deleting}
                className="px-6 py-3 border border-red-400/50 text-red-400 text-xs tracking-widest uppercase disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete work"}
              </button>
            )}
            <button
              onClick={submit}
              disabled={saving || uploadingCover || uploadingFile}
              className="px-6 py-3 bg-[var(--gold)] text-obsidian text-xs tracking-widest uppercase disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : isAdmin &&
                    data.visibility === WORK_VISIBILITY.SUBMITTED &&
                    scheduleEnabled
                  ? "Schedule publication"
                  : isAdmin && data.visibility === WORK_VISIBILITY.SUBMITTED
                    ? "Publish"
                    : data.visibility === WORK_VISIBILITY.SUBMITTED
                      ? "Submit for approval"
                      : "Save draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
