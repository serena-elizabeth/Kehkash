import { useEffect, useState } from "react";
import { wordCount } from "../lib/inputLimits";
import RichTextRenderer from "../components/RichTextRenderer";
import { workContentToText, getReadingTime } from "../lib/richText";
import {
  useNavigate,
  useParams,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getWork, getSpace, toggleLike, toggleLegacyLike, deleteWork } from "../lib/workModel";
import { useAuth } from "../context/AuthContext";
import Comments from "../components/Comments";
import toast from "react-hot-toast";
import {
  FiHeart,
  FiShare2,
  FiArrowLeft,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";

export default function ContentView() {
  const { category, id } = useParams();
  const location = useLocation();
  const modern = location.pathname.startsWith("/works/");
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [accent, setAccent] = useState("#d4af37");
  const [coverBroken, setCoverBroken] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [space, setSpace] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const snap = modern ? null : await getDoc(doc(db, category, id));
        const x = modern
          ? await getWork(id)
          : snap?.exists()
            ? { id, ...snap.data() }
            : null;
        setItem(x);
        setLikes(x?.likes || 0);
        setLiked(x?.likedBy?.includes(user?.uid) || false);
        if (modern && x?.spaceId) {
          try {
            const s = await getSpace(x.spaceId);
            setSpace(s);
            if (s?.theme?.startsWith?.("#")) setAccent(s.theme);
          } catch {}
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [id, category, user]);
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  if (!item)
    return (
      <div className="min-h-screen pt-32 text-center text-muted">
        This piece does not exist.
      </div>
    );
  if (
    modern &&
    (item.status !== "published" || item.visibility !== "public") &&
    item.ownerUid !== user?.uid &&
    !isAdmin
  )
    return <Navigate to="/explore" replace />;
  const like = async () => {
    if (!user) return toast.error("Sign in to like");
    try {
      if (modern) {
        const x = await toggleLike(item, user.uid);
        setLiked(x);
        setLikes((n) => n + (x ? 1 : -1));
      } else {
        const x = await toggleLegacyLike(category, id);
        setLiked(x.liked);
        setLikes(x.likes);
      }
    } catch {
      toast.error("Could not update like");
    }
  };
  const canDelete = modern && (item.ownerUid === user?.uid || isAdmin);
  const remove = async () => {
    if (!window.confirm("Delete this work? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteWork(item.id, {
        ownerUid: item.ownerUid,
        currentUserUid: user.uid,
        isAdmin,
      });
      toast.success("Work deleted");
      nav("/me");
    } catch (e) {
      toast.error(
        e?.code === "permission-denied"
          ? "Firebase permission denied."
          : "Could not delete",
      );
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div
      className="space-themed-content"
      style={{
        "--gold": accent,
        "--space-selection-color": accent,
      }}
    >
      <div className="min-h-screen pt-28 pb-24 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => nav(-1)} className="icon-action">
            <FiArrowLeft />
            Back
          </button>
          {canDelete && (
            <button
              onClick={remove}
              disabled={deleting}
              className="icon-action text-red-400"
            >
              <FiTrash2 />
              {deleting ? "Deleting…" : "Delete work"}
            </button>
          )}
        </div>
        {item.coverUrl && !coverBroken && (
          <img
            src={item.coverUrl}
            alt=""
            onError={() => setCoverBroken(true)}
            className="w-full max-h-[60vh] object-cover rounded-sm mb-8"
          />
        )}
        {item.coverUrl && coverBroken && (
          <p className="text-xs text-muted mb-8">
            Cover image could not be loaded.
          </p>
        )}
        <span className="eyebrow">{item.category || category}</span>
        <h1 className="font-serif text-5xl text-heading leading-tight mt-2">
          {item.title}
        </h1>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <p className="text-xs text-muted">
            {item.createdAt?.toDate
              ? new Date(item.createdAt.toDate()).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </p>
          {space && (
            <Link
              to={`/space/${item.ownerUid}/${space.id}`}
              className="text-xs text-muted hover:text-gold"
            >
              · in {space.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted mt-2">
          <span>
            {wordCount(workContentToText(item.content)).toLocaleString()} words
          </span>

          {getReadingTime(item.content) > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{getReadingTime(item.content)} min read</span>
            </>
          )}
        </div>
        <div className="gold-divider my-8" />
        {item.attachmentUrl && (
          <div className="mb-8 p-4 glass-card flex items-center justify-between">
            <span className="text-body text-sm">
              {item.attachmentName || "Attached file"}
            </span>
            <a
              href={item.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="icon-action-active"
            >
              <FiDownload />
            </a>
          </div>
        )}
        {item.content && (
          <RichTextRenderer value={item.content} accent={accent} />
        )}
        <div className="flex gap-5 mt-12 pt-6 border-t border-line">
          <button
            onClick={like}
            className={`${liked ? "icon-action-active" : "icon-action"} flex items-center gap-1.5`}
          >
            <FiHeart className={liked ? "fill-current" : ""} />
            {likes > 0 && <span>{likes}</span>}
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(location.href);
              toast.success("Link copied");
            }}
            className="icon-action"
            aria-label="Share"
            title="Share"
          >
            <FiShare2 />
          </button>
        </div>

        <Comments category={modern ? "works" : category} contentId={id} />
      </div>
    </div>
  );
}
