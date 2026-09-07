import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workContentToText } from "../lib/richText";
import {
  FiHeart,
  FiShare2,
  FiMessageCircle,
  FiBookmark,
  FiTrash2,
  FiMoreVertical,
  FiEdit2,
  FiLock,
  FiUnlock,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import {
  toggleReaction,
  toggleSave,
  getSpace,
  deleteWork,
  setWorkVisibility,
  REACTIONS,
  WORK_STATUS,
  WORK_VISIBILITY,
} from "../lib/workModel";
import toast from "react-hot-toast";

export default function ContentCard({
  item,
  category,
  modern,
  deletable,
  onDeleted,
  onVisibilityChanged,
  onSaveToggle,
  showVisibilityControl = false,
}) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(item.savedBy?.includes(user?.uid));
  const [reactionOpen, setReactionOpen] = useState(false);
  const [localReactions, setLocalReactions] = useState(item.reactions || {});
  const [visibility, setVisibility] = useState(
    item.visibility || WORK_VISIBILITY.PRIVATE,
  );
  const [coverBroken, setCoverBroken] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceTheme, setSpaceTheme] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = (e) => {
    e.stopPropagation();

    // Tell every other ContentCard menu to close
    window.dispatchEvent(
      new CustomEvent("work-menu-open", {
        detail: item.id,
      }),
    );

    setMenuOpen((open) => !open);
  };
  useEffect(() => {
    const handleOtherMenu = (e) => {
      if (e.detail !== item.id) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("work-menu-open", handleOtherMenu);

    return () => {
      window.removeEventListener("work-menu-open", handleOtherMenu);
    };
  }, [item.id]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = () => {
      setMenuOpen(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [menuOpen]);
  useEffect(() => {
    if (modern && item.spaceId) {
      getSpace(item.spaceId)
        .then((s) => {
          if (s?.name) setSpaceName(s.name);
          if (s?.theme) setSpaceTheme(s.theme);
        })
        .catch(() => {});
    }
  }, [modern, item.spaceId]);
  useEffect(() => {
    setLocalReactions(item.reactions || {});
  }, [item.reactions]);
  const path = modern ? `/works/${item.id}` : `/${category}/${item.id}`;
  const canDelete = deletable && item.ownerUid === user?.uid;
  const canToggleVisibility =
    showVisibilityControl &&
    item.ownerUid === user?.uid &&
    item.status === WORK_STATUS.PUBLISHED &&
    (visibility === WORK_VISIBILITY.PUBLIC ||
      visibility === WORK_VISIBILITY.PRIVATE);
  const reactions = localReactions;

  const currentReaction = user?.uid
    ? item.reactionBy?.[user.uid] ||
      (item.likedBy?.includes(user.uid) ? "loved" : null)
    : null;

  const totalReactions = Object.values(reactions).reduce(
    (total, count) => total + Math.max(0, count || 0),
    0,
  );

  const handleReaction = async (reactionId) => {
    if (!modern) {
      return toast.error("Reactions are available on new works");
    }

    if (!user) {
      return toast.error("Sign in to react");
    }

    try {
      const result = await toggleReaction(item, user.uid, reactionId);

      // Immediately update the card
      setLocalReactions(result.reactions);

      setReactionOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not update reaction");
    }
  };
    const save = async (e) => {
    e.stopPropagation();

    if (!user) return toast.error("Sign in to save");
    if (!modern) return toast.error("Saving new works requires sign in");

    try {
      const x = await toggleSave(item, user.uid);

      setSaved(x);

      onSaveToggle?.(x);

      toast.success(x ? "Saved" : "Removed from saved");
    } catch {
      toast.error("Could not save");
    }
  };
  const share = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(location.origin + path);
    toast.success("Link copied");
  };
  const openSpace = (e) => {
    e.stopPropagation();
    if (item.ownerUid && item.spaceId)
      nav(`/space/${item.ownerUid}/${item.spaceId}`);
  };
  const toggleVisibility = async (e) => {
    e.stopPropagation();

    if (!canToggleVisibility) return;

    const nextVisibility =
      visibility === WORK_VISIBILITY.PUBLIC
        ? WORK_VISIBILITY.PRIVATE
        : WORK_VISIBILITY.PUBLIC;

    try {
      await setWorkVisibility(item.id, user.uid, nextVisibility);

      setVisibility(nextVisibility);
      if (onVisibilityChanged) {
        onVisibilityChanged(item.id, nextVisibility);
      }
      toast.success(
        nextVisibility === WORK_VISIBILITY.PUBLIC
          ? "Work is now public✅"
          : "Work is now private🔏",
      );
    } catch (err) {
      toast.error(
        err?.code === "permission-denied"
          ? "Firebase permission denied."
          : "Could not change visibility",
      );
    }
  };
  const edit = (e) => {
    e.stopPropagation();
    setMenuOpen(false);

    nav(`/write/${item.id}?source=${modern ? "works" : category}`);
  };

  const remove = async (e) => {
    e.stopPropagation();

    if (!window.confirm("Delete this work? This cannot be undone.")) return;

    setDeleting(true);

    try {
      await deleteWork(item.id, {
        modern,
        category,
        ownerUid: item.ownerUid,
        currentUserUid: user?.uid,
      });

      toast.success("Work deleted");
      onDeleted?.(item.id);
    } catch (err) {
      toast.error(
        err?.code === "permission-denied"
          ? "Firebase permission denied."
          : "Could not delete",
      );
    } finally {
      setDeleting(false);
    }
  };
  const preview = workContentToText(item.content).slice(0, 140);
  return (
    <article
      onClick={() => nav(path)}
      style={{ "--space-theme": spaceTheme || "transparent" }}
      className="glass-card rounded-sm overflow-hidden flex flex-col group cursor-pointer transition-all duration-300 hover:border-[color-mix(in_srgb,var(--space-theme)_70%,transparent)] hover:shadow-[0_0_20px_color-mix(in_srgb,var(--space-theme)_25%,transparent)]"
    >
      {item.coverUrl && !coverBroken && (
        <img
          src={item.coverUrl}
          alt=""
          onError={() => setCoverBroken(true)}
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="text-xs tracking-widest uppercase text-[var(--gold)]">
          {category}
        </div>

        <div className="flex items-center gap-2">
          {item.icon && (
            <span className="text-lg shrink-0" aria-hidden="true">
              {item.icon}
            </span>
          )}

          <h3 className="font-serif text-xl text-heading group-hover:text-[var(--gold)] leading-snug">
            {item.title || "Untitled"}
          </h3>
        </div>
        {preview && (
          <p className="text-sm text-muted leading-relaxed line-clamp-3">
            {preview}
          </p>
        )}
        {spaceName && (
          <button
            onClick={openSpace}
            className="text-xs text-muted hover:text-[var(--gold)] self-start -mt-1"
          >
            in {spaceName}
          </button>
        )}

        <div className="flex items-center flex-wrap gap-3 -mt-1">
          {Object.entries(reactions)
            .filter(([, count]) => Math.max(0, count || 0) > 0)
            .map(([reactionId, count]) => {
              const reaction = REACTIONS.find((r) => r.id === reactionId);

              if (!reaction) return null;

              return (
                <span
                  key={reactionId}
                  className="inline-flex items-center gap-1 text-xs text-muted"
                >
                  {reaction.emoji} {Math.max(0, count || 0)}
                </span>
              );
            })}
        </div>
        {reactionOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 mb-2"
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction(reaction.id);
                }}
                aria-label="React"
                className={`w-8 h-8 flex items-center justify-center text-lg transition-transform hover:scale-110 ${
                  currentReaction === reaction.id ? "scale-110" : ""
                }`}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-line flex justify-between items-center">
          <span className="text-xs text-muted">
            {item.createdAt?.toDate
              ? new Date(item.createdAt.toDate()).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReactionOpen((open) => !open);
              }}
              className={`${
                currentReaction ? "icon-action-active" : "icon-action"
              } flex items-center gap-1.5`}
              title="React"
            >
              {reactions.loved > 0 ? "❤️" : "♡"}
              {totalReactions > 0 && <span>{totalReactions}</span>}
            </button>
            {modern && (
              <button
                onClick={save}
                className={saved ? "icon-action-active" : "icon-action"}
              >
                <FiBookmark size={14} />
              </button>
            )}
            <button
              onClick={share}
              className="icon-action flex items-center gap-1.5"
            >
              <FiShare2 size={14} />
            </button>
            <span className="icon-action flex items-center gap-1.5">
              <FiMessageCircle size={14} />
              {item.commentCount || 0}
            </span>
            {canDelete && (
              <div className="relative shrink-0" data-work-menu>
                <button
                  type="button"
                  onClick={openMenu}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 ${
                    menuOpen
                      ? "bg-white/10 text-heading"
                      : "text-muted hover:text-heading hover:bg-white/5"
                  }`}
                  title="More options"
                  aria-label="More options"
                  aria-expanded={menuOpen}
                >
                  <FiMoreVertical size={17} />
                </button>

                {menuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
          absolute right-0 bottom-full mb-2 z-50
          w-44
          rounded-lg
          border border-line
          bg-[var(--bg)]
          shadow-2xl
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-100
        "
                  >
                    <div className="p-1.5">
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={edit}
                        className="
              w-full flex items-center gap-3
              px-3 py-2.5
              rounded-md
              text-sm text-heading
              text-left
              transition-colors
              hover:bg-white/5
              focus:outline-none
              focus:bg-white/5
            "
                      >
                        <FiEdit2 size={15} className="shrink-0 text-muted" />
                        <span>Edit</span>
                      </button>

                      {/* Visibility */}
                      {canToggleVisibility && (
                        <button
                          type="button"
                          onClick={toggleVisibility}
                          className="
      w-full flex items-center gap-3
      px-3 py-2.5
      rounded-md
      text-sm text-heading
      text-left
      transition-colors
      hover:bg-white/5
      focus:outline-none
      focus:bg-white/5
    "
                        >
                          {visibility === WORK_VISIBILITY.PUBLIC ? (
                            <>
                              <FiLock
                                size={15}
                                className="shrink-0 text-muted"
                              />
                              <span>Make private</span>
                            </>
                          ) : (
                            <>
                              <FiUnlock
                                size={15}
                                className="shrink-0 text-muted"
                              />
                              <span>Make public</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Divider */}
                      <div className="my-1.5 border-t border-line" />

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={remove}
                        disabled={deleting}
                        className="
              w-full flex items-center gap-3
              px-3 py-2.5
              rounded-md
              text-sm text-red-400
              text-left
              transition-colors
              hover:bg-red-400/10
              focus:outline-none
              focus:bg-red-400/10
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
                      >
                        <FiTrash2 size={15} className="shrink-0" />
                        <span>{deleting ? "Deleting…" : "Delete"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
