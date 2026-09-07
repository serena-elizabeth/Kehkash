import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { WORK_STATUS, WORK_VISIBILITY } from "../lib/workModel";
import toast from "react-hot-toast";

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("pending");
  const load = async () => {
    try {
      const q = query(
        collection(db, "works"),
        where("status", "==", tab),
        orderBy("updatedAt", "desc"),
      );
      const s = await getDocs(q);
      setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setItems([]);
    }
  };
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, tab]);
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  const action = async (id, status, visibility) => {
    try {
      await updateDoc(doc(db, "works", id), {
        status,
        visibility,
        updatedAt: new Date(),
      });
      toast.success(status === "published" ? "Published" : "Rejected");
      load();
    } catch {
      toast.error("Action failed");
    }
  };
  return (
    <div className="min-h-screen pt-28 pb-24 max-w-5xl mx-auto px-4 sm:px-6">
      <span className="eyebrow">Curator</span>
      <h1 className="font-serif text-5xl text-heading mt-2">Approval desk</h1>
      <p className="text-muted mt-3">
        Nothing submitted by another user becomes public without approval.
      </p>
      <div className="flex gap-2 mt-8 mb-8">
        {["pending", "published", "rejected"].map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={`filter ${tab === x ? "filter-active" : ""}`}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {items.map((x) => (
          <div key={x.id} className="glass-card p-5">
            <div className="flex justify-between gap-4">
              <div>
                <span className="eyebrow">{x.category}</span>
                <h2 className="font-serif text-2xl text-heading">{x.title}</h2>
                <p className="text-xs text-muted mt-1">
                  Creator:{" "}
                  {x.ownerUid === user.uid ? "You (admin)" : x.ownerUid}
                </p>
              </div>
              <span className="text-xs text-muted">{x.visibility}</span>
            </div>
            <p className="text-body mt-5 whitespace-pre-wrap line-clamp-6">
              {x.content}
            </p>
            <div className="flex gap-2 mt-5">
              {tab === "pending" && (
                <>
                  <button
                    onClick={() =>
                      action(
                        x.id,
                        WORK_STATUS.PUBLISHED,
                        WORK_VISIBILITY.PUBLIC,
                      )
                    }
                    className="px-4 py-2 bg-gold text-obsidian text-xs uppercase tracking-widest"
                  >
                    Approve & publish
                  </button>

                  <button
                    onClick={() =>
                      action(
                        x.id,
                        WORK_STATUS.PUBLISHED,
                        WORK_VISIBILITY.PRIVATE,
                      )
                    }
                    className="px-4 py-2 border border-gold/40 text-gold text-xs uppercase tracking-widest"
                  >
                    Approve privately
                  </button>

                  <button
                    onClick={() =>
                      action(
                        x.id,
                        WORK_STATUS.REJECTED,
                        WORK_VISIBILITY.PRIVATE,
                      )
                    }
                    className="px-4 py-2 border border-line text-body text-xs uppercase tracking-widest"
                  >
                    Reject
                  </button>
                </>
              )}{" "}
              {tab !== "pending" && (
                <Link to={`/works/${x.id}`} className="small-action">
                  View piece
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
