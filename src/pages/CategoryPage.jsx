import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ContentCard from "../components/ContentCard";

const VALID_CATEGORIES = [
  "quotes",
  "poems",
  "articles",
  "songs",
  "photos",
  "stories",
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function CategoryPage() {
  const navigate = useNavigate();
  const { category } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("newest");

  // Security: reject invalid category routes
  if (!VALID_CATEGORIES.includes(category)) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, category), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category]);

  const sorted = [...items].sort((a, b) => {
    if (filter === "popular") return (b.likes || 0) - (a.likes || 0);
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  });

  return (
    <div className="min-h-screen pt-28 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <span className="font-sans text-xs tracking-widest uppercase text-gold/60 block mb-2">
          Collection
        </span>
        <h1 className="font-serif text-5xl sm:text-6xl text-heading capitalize">
          {category === "songs" ? "Music" : category}
        </h1>
        {category === "songs" && (
          <button
            type="button"
            onClick={() => navigate("/songs/room")}
            className="music-room-entry"
          >
            Enter the Room
          </button>
        )}

        <div className="gold-divider mt-6 w-32" />
      </motion.div>

      {/* Filter */}
      <div className="flex gap-4 mb-10">
        {["newest", "popular"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-sans text-xs tracking-widest uppercase px-4 py-2 border transition-all duration-200 ${
              filter === f
                ? "border-gold text-gold"
                : "border-line text-muted hover:border-gold/40 hover:text-gold/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-sm h-48 animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-32">
          <p className="font-serif text-3xl text-muted">Nothing here yet.</p>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sorted.map((item) => (
            <motion.div key={item.id} variants={fadeUp}>
              <ContentCard item={item} category={category} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
