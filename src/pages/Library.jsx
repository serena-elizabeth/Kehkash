import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { getSavedWorks } from "../lib/workModel";
import ContentCard from "../components/ContentCard";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "poems", label: "Poems" },
  { id: "stories", label: "Stories" },
  { id: "quotes", label: "Quotes" },
  { id: "photos", label: "Sketches" },
];

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadLibrary() {
      try {
        setLoading(true);

        const saved = await getSavedWorks(user.uid);

        if (active) {
          setWorks(saved);
        }
      } catch (error) {
        console.error("[Library] failed to load:", error);

        if (active) {
          toast.error("Could not load your library");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLibrary();

    return () => {
      active = false;
    };
  }, [user?.uid]);

    const filteredWorks = useMemo(() => {
    if (filter === "all") return works;

    return works.filter((work) => work.category === filter);
  }, [works, filter]);

  const handleLibrarySaveToggle = (workId, isSaved) => {
    if (!isSaved) {
      setWorks((currentWorks) =>
        currentWorks.filter((work) => work.id !== workId),
      );
    }
  };

  if (!user) {
    return (
      <section className="min-h-screen pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl font-serif text-gold mb-3">My Library</h1>

          <p className="text-muted mb-6">Sign in to view your saved works.</p>

          <button onClick={() => navigate("/login")} className="gold-btn">
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif text-gold">
            My Library
          </h1>

          <p className="text-muted mt-2">
            Your saved works, kept in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                filter === item.id
                  ? "border-gold text-gold bg-gold/10"
                  : "border-line text-muted hover:text-gold hover:border-gold/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted">
            Loading your library...
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted">
              {filter === "all"
                ? "You haven't saved anything yet."
                : `No saved ${filter} yet.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredWorks.map((work) => (
              <ContentCard
                key={work.id}
                item={work}
                category={work.category}
                modern={true}
                deletable={false}
                onSaveToggle={(isSaved) =>
                  handleLibrarySaveToggle(work.id, isSaved)
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
