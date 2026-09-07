import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiTrash2, FiSend } from "react-icons/fi";

const MAX_COMMENT_LENGTH = 500;

export default function Comments({ category, contentId }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, category, contentId, "comments"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [category, contentId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      toast.error(`Max ${MAX_COMMENT_LENGTH} characters`);
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, category, contentId, "comments"), {
        text: trimmed,
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      });

      setText("");
      toast.success("Comment added");
    } catch {
      toast.error("Could not post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId, commentUid) => {
    if (!isAdmin && user?.uid !== commentUid) return;
    try {
      await deleteDoc(doc(db, category, contentId, "comments", commentId));

      toast.success("Comment deleted");
    } catch {
      toast.error("Could not delete comment");
    }
  };

  return (
    <section id="comments" className="mt-12">
      <div className="gold-divider mb-8" />
      <h3 className="font-serif text-2xl text-gold mb-6">Comments</h3>

      {/* Input */}
      {user ? (
        <div className="glass-card rounded-sm p-4 mb-8 flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full bg-transparent font-sans text-sm text-body placeholder-muted resize-none outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {text.length}/{MAX_COMMENT_LENGTH}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
              className="flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold text-xs font-sans tracking-widest uppercase hover:bg-gold hover:text-obsidian transition-all duration-200 disabled:opacity-30"
            >
              <FiSend size={12} />
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted mb-8 font-sans">
          <a href="/login" className="text-gold hover:underline">
            Sign in
          </a>{" "}
          to leave a comment.
        </p>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {comments.length === 0 && (
            <p className="text-sm text-muted font-sans">
              No comments yet. Be the first.
            </p>
          )}
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-sm p-4 flex gap-3"
            >
              {comment.photoURL ? (
                <img
                  src={comment.photoURL}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-xs font-serif">
                    {comment.displayName?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-gold font-sans">
                    {comment.displayName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">
                      {comment.createdAt?.toDate
                        ? new Date(
                            comment.createdAt.toDate(),
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                    {(isAdmin || user?.uid === comment.uid) && (
                      <button
                        onClick={() => handleDelete(comment.id, comment.uid)}
                        className="text-muted hover:text-red-400 transition-colors"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-body font-sans leading-relaxed break-words">
                  {comment.text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
