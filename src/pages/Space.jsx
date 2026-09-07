import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  getMyWorks,
  getUserProfile,
  getPublicSpace,
  getPublicWorksByOwner,
  saveUserProfile,
  uploadSpaceImage,
  getSpacesByOwner,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpaceAndContent,
  deleteSpaceKeepContent,
  WORK_STATUS,
  WORK_VISIBILITY,
} from "../lib/workModel";
import ContentCard from "../components/ContentCard";

const SPACE_THEMES = [
  "#d4af37",
  "#a47de8",
  "#5e9ae8",
  "#df7fa4",
  "#57b68a",
  "#d96c72",
  "#7d83dc",
  "#e5a83d",
];
const MAX_SPACES = 20;

export default function Space() {
  const { uid, spaceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dashboard = !uid;
  const target = uid || user?.uid;
  const own = !!user && user.uid === target;
  const [account, setAccount] = useState(null);
  const [spacesList, setSpacesList] = useState(null);
  const [activeId, setActiveId] = useState(spaceId || null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [works, setWorks] = useState([]);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState("works");
  const [spaceTab, setSpaceTab] = useState("published");
  const [sort, setSort] = useState("newest");
  const [photoFile, setPhotoFile] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    bio: "",
    theme: "#d4af37",
    iconURL: "",
    coverURL: "",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const closeMenu = () => setMenuOpenId(null);

    document.addEventListener("click", closeMenu);

    return () => {
      document.removeEventListener("click", closeMenu);
    };
  }, []);

  useEffect(() => {
    if (!target) return;
    let active = true;
    (async () => {
      try {
        let acc;
        try {
          acc =
            own || dashboard
              ? await getUserProfile(target)
              : (await getPublicSpace(target)) || {
                  name: "",
                  bio: "",
                  photoURL: "",
                  spaceName: "",
                  spaceTheme: "#d4af37",
                };
        } catch (e) {
          console.error("[Space] profile fetch failed:", e);
          throw e;
        }

        let list;
        try {
          list = await getSpacesByOwner(target);
        } catch (e) {
          console.error("[Space] getSpacesByOwner failed:", e);
          throw e;
        }

        if (list.length === 0 && acc.spaceName?.trim()) {
          try {
            const hex = acc.spaceTheme?.startsWith?.("#")
              ? acc.spaceTheme
              : "#d4af37";
            await createSpace(target, {
              name: acc.spaceName,
              bio: acc.bio,
              theme: hex,
              iconURL: acc.spaceIconURL || acc.photoURL,
            });
            list = await getSpacesByOwner(target);
          } catch (migErr) {
            console.error("[Space] migration createSpace failed:", migErr);
          }
        }

        let w;
        try {
          w =
            dashboard || own
              ? await getMyWorks(target)
              : await getPublicWorksByOwner(target);
        } catch (e) {
          console.error(
            dashboard || own
              ? "[Space] getMyWorks failed:"
              : "[Space] getPublicWorksByOwner failed:",
            e,
          );
          throw e;
        }

        if (!active) return;
        setAccount(acc);
        setSpacesList(list || []);
        setWorks(w || []);
        setActiveId(spaceId || list[0]?.id || null);
      } catch (e) {
        console.error("[Space] load failed overall:", e);
        if (active) {
          toast.error("Couldn't brew this coffee :(");
          setSpacesList([]);
          setWorks([]);
          setAccount(
            (a) =>
              a || {
                name: "",
                bio: "",
                photoURL: "",
                spaceName: "",
                spaceTheme: "#d4af37",
              },
          );
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [target, dashboard, own, spaceId]);

  useEffect(() => {
    const root = document.documentElement;

    // Dashboard: always use the default gold
    if (!spaceId) {
      root.style.setProperty("--space-scrollbar", "#d4af37");
      return;
    }

    // Inside a Space: use that Space's theme
    const active = spacesList?.find((s) => s.id === spaceId);

    root.style.setProperty(
      "--space-scrollbar",
      active?.theme?.startsWith?.("#") ? active.theme : "#d4af37",
    );

    return () => {
      root.style.removeProperty("--space-scrollbar");
    };
  }, [spaceId, spacesList]);

  if (!target)
    return (
      <div className="min-h-screen pt-32 text-center text-muted">
        Sign in to create your Space.
      </div>
    );
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-muted text-center text-xl sm:text-2xl font-medium">
          Brewing☕...
        </div>
      </div>
    );
  }

  const spaces = spacesList || [];
  const activeSpace = spaces.find((s) => s.id === activeId) || null;
  const accent = activeSpace?.theme?.startsWith?.("#")
    ? activeSpace.theme
    : "#d4af37";
  const belongsToActive = (w) =>
    activeId === "my-works"
      ? !w.spaceId
      : activeSpace && w.spaceId === activeSpace.id;

  const applySort = (list) => {
    const a = [...list];
    if (sort === "oldest") a.reverse();
    if (sort === "popular") a.sort((x, y) => (y.likes || 0) - (x.likes || 0));
    if (sort === "az")
      a.sort((x, y) => (x.title || "").localeCompare(y.title || ""));
    return a;
  };

  const startCreate = () => {
    if (spaces.length >= MAX_SPACES) {
      return toast.error(`You can have up to ${MAX_SPACES} Spaces.`);
    }

    setDraft({
      name: "",
      bio: "",
      theme: "#d4af37",
      iconURL: "",
      coverURL: "",
    });

    setCreating(true);
    setEditing(false);
  };
  const startEdit = () => {
    if (!activeSpace) return;

    setDraft({
      name: activeSpace.name || "",
      bio: activeSpace.bio || "",
      theme: activeSpace.theme || "#d4af37",
      iconURL: activeSpace.iconURL || "",
      coverURL: activeSpace.coverURL || "",
    });

    setEditing(true);
    setCreating(false);
  };
  const saveSpace = async () => {
    if (!draft.name?.trim()) {
      return toast.error("Give your Space a name");
    }

    setSaving(true);

    try {
      let next = {
        name: draft.name,
        bio: draft.bio,
        theme: draft.theme,
        iconURL: draft.iconURL,
        coverURL: draft.coverURL,
      };

      if (photoFile) {
        const r = await uploadSpaceImage(user.uid, photoFile, "profile");
        next.iconURL = r.url;
      }

      if (iconFile) {
        const r = await uploadSpaceImage(user.uid, iconFile, "icon");
        next.iconURL = r.url;
      }

      if (coverFile) {
        const r = await uploadSpaceImage(user.uid, coverFile, "cover");
        next.coverURL = r.url;
      }

      // Save the creator's name separately from the Space name.
      if (draft.creatorName !== account?.name) {
        await saveUserProfile(target, {
          ...account,
          name: draft.creatorName,
        });

        setAccount((a) => ({
          ...a,
          name: draft.creatorName,
        }));
      }

      if (creating) {
        const id = await createSpace(target, next);

        setSpacesList((l) => [
          ...(l || []),
          {
            id,
            ...next,
            ownerUid: target,
          },
        ]);

        setActiveId(id);
        toast.success("Space created");
      } else {
        await updateSpace(activeSpace.id, next);

        setSpacesList((l) =>
          (l || []).map((s) =>
            s.id === activeSpace.id ? { ...s, ...next } : s,
          ),
        );

        toast.success("Space saved");
      }

      setPhotoFile(null);
      setIconFile(null);
      setCoverFile(null);
      setEditing(false);
      setCreating(false);
    } catch (e) {
      toast.error(
        e.message ||
          (e?.code === "permission-denied"
            ? "Firebase permission denied."
            : "Could not save Space"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpace = async (
    deleteContent,
    spaceToDelete = activeSpace,
  ) => {
    if (!spaceToDelete) return;

    const message = deleteContent
      ? `Delete "${spaceToDelete.name}" and ALL content inside it? This cannot be undone.`
      : `Delete "${spaceToDelete.name}" but keep its content in My Works?`;

    if (!window.confirm(message)) return;

    setDeleting(true);

    try {
      if (deleteContent) {
        await deleteSpaceAndContent(spaceToDelete.id);
      } else {
        await deleteSpaceKeepContent(spaceToDelete.id);
      }

      const deletedId = spaceToDelete.id;

      setSpacesList((l) => (l || []).filter((s) => s.id !== deletedId));

      if (deleteContent) {
        setWorks((w) => w.filter((x) => x.spaceId !== deletedId));
      } else {
        setWorks((w) =>
          w.map((x) =>
            x.spaceId === deletedId ? { ...x, spaceId: "", spaceName: "" } : x,
          ),
        );
      }

      setActiveId(null);
      setEditing(false);
      setCreating(false);

      toast.success(
        deleteContent
          ? "Space and its content deleted"
          : "Space deleted. Content moved to My Works.",
      );
    } catch (e) {
      console.error("[Space] delete failed:", e);
      toast.error(e.message || "Could not delete Space");
    } finally {
      setDeleting(false);
    }
  };

  const spaceWorks = works.filter(belongsToActive);

  if (dashboard) {
    const publishedWorks = applySort(
      (activeId === "my-works"
        ? works.filter((w) => !w.spaceId)
        : spaceWorks
      ).filter(
        (x) => x.status === WORK_STATUS.PUBLISHED && x.visibility === "public",
      ),
    );

    const submissionWorks = applySort(
      (activeId === "my-works"
        ? works.filter((w) => !w.spaceId)
        : spaceWorks
      ).filter((x) => x.status === WORK_STATUS.PENDING),
    );

    const privateWorks = applySort(
      (activeId === "my-works"
        ? works.filter((w) => !w.spaceId)
        : spaceWorks
      ).filter(
        (x) => x.status === WORK_STATUS.PUBLISHED && x.visibility === "private",
      ),
    );

    const draftWorks = applySort(
      (activeId === "my-works"
        ? works.filter((w) => !w.spaceId)
        : spaceWorks
      ).filter((x) => x.status === WORK_STATUS.DRAFT),
    );
    const scheduledWorks = applySort(
      (activeId === "my-works"
        ? works.filter((w) => !w.spaceId)
        : spaceWorks
      ).filter((x) => x.status === WORK_STATUS.SCHEDULED),
    );
    const renderWorkSection = (title, items, emptyText) => (
      <section className="mb-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <span className="eyebrow">{title}</span>
            <p className="text-xs text-muted mt-1">
              {items.length} {items.length === 1 ? "work" : "works"}
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((x) => (
              <ContentCard
                key={x.id}
                item={x}
                category={x.category}
                modern
                deletable
                showVisibilityControl
                onDeleted={(id) =>
                  setWorks((w) => w.filter((y) => y.id !== id))
                }
                onVisibilityChanged={(id, visibility) => {
                  setWorks((w) =>
                    w.map((y) => (y.id === id ? { ...y, visibility } : y)),
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted border border-dashed border-line/70 rounded-2xl">
            <p className="text-sm">{emptyText}</p>
          </div>
        )}
      </section>
    );
    const shown = applySort(
      activeId === "my-works"
        ? works.filter((w) => !w.spaceId)
        : tab === "works"
          ? spaceWorks.filter(
              (x) =>
                x.status === WORK_STATUS.PUBLISHED && x.visibility === "public",
            )
          : tab === "drafts"
            ? spaceWorks.filter((x) => x.status === WORK_STATUS.DRAFT)
            : tab === "submissions"
              ? spaceWorks.filter((x) => x.status === WORK_STATUS.PENDING)
              : spaceWorks.filter(
                  (x) =>
                    x.status === WORK_STATUS.PUBLISHED &&
                    x.visibility === "private",
                ),
    );

    return (
      <div
        style={{ "--gold": "#d4af37" }}
        className="min-h-screen pt-24 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {activeId !== "my-works" && (
          <div className="mb-10">
            <span className="eyebrow">Your account</span>

            <h1 className="font-serif text-5xl text-heading mt-2">My Spaces</h1>

            <p className="text-muted mt-2">
              Your personal collection of creative spaces.
            </p>
          </div>
        )}

        {activeId !== "my-works" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* My Works */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="group"
            >
              <div
                onClick={() => setActiveId("my-works")}
                className="relative overflow-hidden rounded-2xl border border-line/70 bg-[var(--bg)] shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--gold)]/50 group-hover:shadow-2xl cursor-pointer"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src="/default-space-cover.png"
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />

                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-70"
                    style={{ background: "#d4af37" }}
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src="/logo.png"
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-line/80 ring-2 ring-[var(--bg)]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-xl text-heading truncate">
                        My Works
                      </h2>

                      <p className="text-xs text-muted truncate mt-1">
                        {works.filter((w) => !w.spaceId).length} unassigned
                        works
                      </p>
                    </div>

                    <span
                      className="text-muted opacity-0 group-hover:opacity-100 transition-opacity text-lg"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {spaces.map((space) => (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="group relative"
              >
                <div className="absolute top-3 right-3 z-30">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === space.id ? null : space.id);
                    }}
                    className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 hover:text-gold hover:border-gold/40 transition-all flex items-center justify-center"
                    aria-label={`Options for ${space.name}`}
                    aria-expanded={menuOpenId === space.id}
                  >
                    <span className="text-xl leading-none">⋮</span>
                  </button>

                  {menuOpenId === space.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line bg-[var(--bg)] shadow-2xl p-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpenId(null);
                          handleDeleteSpace(false, space);
                        }}
                        disabled={deleting}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-xs text-muted hover:text-gold hover:bg-white/[0.03] transition-colors disabled:opacity-50"
                      >
                        Delete Space · Keep Content
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpenId(null);
                          handleDeleteSpace(true, space);
                        }}
                        disabled={deleting}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-xs text-red-400 hover:bg-red-500/[0.05] transition-colors disabled:opacity-50"
                      >
                        Delete Space · Delete Content
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="relative overflow-hidden rounded-2xl border border-line/70 bg-[var(--bg)] shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--space-accent)]/50 group-hover:shadow-2xl"
                  style={{
                    "--space-accent": space.theme || "#d4af37",
                  }}
                >
                  {/* Cover */}
                  <div
                    onClick={() => navigate(`/space/${user.uid}/${space.id}`)}
                    className="w-full text-left cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate(`/space/${user.uid}/${space.id}`);
                      }
                    }}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={space.coverURL || "/default-space-cover.png"}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/default-space-cover.png";
                        }}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Subtle dark gradient over the cover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />

                      {/* Space accent */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-70"
                        style={{ background: "var(--space-accent)" }}
                      />
                    </div>

                    {/* Information */}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={space.iconURL || "/logo.png"}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/logo.png";
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-line/80 ring-2 ring-[var(--bg)]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h2 className="font-serif text-xl text-heading truncate">
                              {space.name}
                            </h2>

                            <span className="ml-1 text-[11px] text-muted/70 tracking-wide tabular-nums">
                              {
                                works.filter((w) => w.spaceId === space.id)
                                  .length
                              }
                            </span>
                          </div>

                          {space.bio && (
                            <p className="text-xs text-muted truncate mt-1">
                              {space.bio}
                            </p>
                          )}
                        </div>

                        <span
                          className="text-muted opacity-0 group-hover:opacity-100 transition-opacity text-lg"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit */}
                </div>
              </motion.div>
            ))}

            {spaces.length < MAX_SPACES && (
              <button
                type="button"
                onClick={startCreate}
                className="aspect-[16/9] sm:aspect-auto min-h-[190px] rounded-2xl border border-dashed border-[var(--gold)]/35 flex flex-col items-center justify-center text-muted hover:text-gold hover:border-gold/90 hover:bg-white/[0.02] transition-all duration-200"
              >
                <span className="text-3xl mb-3 font-light opacity-70">+</span>

                <span className="text-xs uppercase tracking-widest">
                  Create Space
                </span>
              </button>
            )}
          </div>
        )}

        {activeId === "my-works" && (
          <div className="mt-10">
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="text-xs uppercase tracking-widest text-muted hover:text-gold transition-colors block mb-8"
              >
                ← My Spaces
              </button>

              <span className="eyebrow">Unassigned</span>

              <h2 className="font-serif text-3xl text-heading mt-1">
                My Works
              </h2>

              <p className="text-muted mt-2">
                Works that aren't inside any Space.
              </p>
            </div>

            {renderWorkSection(
              "Published",
              publishedWorks,
              "No published works yet.",
            )}

            {renderWorkSection(
              "Scheduled",
              scheduledWorks,
              "No scheduled works.",
            )}

            {renderWorkSection(
              "Submissions",
              submissionWorks,
              "No pending submissions.",
            )}

            {renderWorkSection("Private", privateWorks, "No private works.")}

            {renderWorkSection("Drafts", draftWorks, "No drafts yet.")}
          </div>
        )}
        {spaces.length >= MAX_SPACES && (
          <p className="text-xs text-muted mt-6">
            You have reached the maximum of {MAX_SPACES} Spaces.
          </p>
        )}

        {(editing || creating) && (
          <div className="mt-10">
            <SpaceEditor
              draft={draft}
              setDraft={setDraft}
              creating={creating}
              editing={editing}
              setEditing={setEditing}
              setCreating={setCreating}
              photoFile={photoFile}
              setPhotoFile={setPhotoFile}
              iconFile={iconFile}
              setIconFile={setIconFile}
              coverFile={coverFile}
              setCoverFile={setCoverFile}
              save={saveSpace}
              saving={saving}
              canCancel={true}
              onDelete={handleDeleteSpace}
              deleting={deleting}
            />
          </div>
        )}
      </div>
    );
  }

  if (!activeSpace)
    return (
      <div className="min-h-screen pt-32 text-center text-muted">
        Couldn't brew this coffee :&#40;
      </div>
    );
  if (editing) {
    return (
      <div
        style={{ "--gold": accent }}
        className="min-h-screen pt-24 pb-24 max-w-4xl mx-auto px-4 sm:px-6"
      >
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted hover:text-gold transition-colors"
          >
            ← Back to Space
          </button>
        </div>

        <div className="mb-8">
          <span className="eyebrow">Edit</span>

          <h1 className="font-serif text-5xl text-heading mt-2">Details</h1>

          <p className="text-muted mt-2">
            Change the name, description, appearance, icon, or cover of this
            Space.
          </p>
        </div>

        <SpaceEditor
          draft={draft}
          setDraft={setDraft}
          creating={false}
          editing={true}
          setEditing={setEditing}
          setCreating={setCreating}
          photoFile={photoFile}
          setPhotoFile={setPhotoFile}
          iconFile={iconFile}
          setIconFile={setIconFile}
          coverFile={coverFile}
          setCoverFile={setCoverFile}
          save={saveSpace}
          saving={saving}
          canCancel={true}
          onDelete={handleDeleteSpace}
          deleting={deleting}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ "--gold": accent }}
      className="min-h-screen pt-8 pb-24 max-w-6xl mx-auto px-4 sm:px-6"
    >
      <div className="pt-20 mb-5">
        <Link
          to="/me"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted hover:text-gold transition-colors"
        >
          ← My Spaces
        </Link>
      </div>
      <div
        className="space-card !p-0 !border-0 !shadow-none overflow-hidden rounded-3xl"
        style={{ "--space-accent": accent }}
      >
        {/* Large Space Cover */}
        <div className="relative w-full h-[280px] sm:h-[360px] lg:h-[430px] overflow-hidden rounded-t-2xl">
          <img
            src={activeSpace.coverURL || "/default-space-cover.png"}
            alt=""
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/default-space-cover.png";
            }}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: "var(--space-accent)" }}
          />
        </div>

        {/* Space information */}
        <div className="px-6 sm:px-10 pb-9 pt-7 sm:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Space Icon */}
            <div className="flex-shrink-0 -mt-10 sm:-mt-12 relative z-10 translate-y-3">
              <img
                src={activeSpace.iconURL || "/logo.png"}
                alt=""
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/logo.png";
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[var(--bg)] shadow-lg"
              />
            </div>

            {/* Name + Bio */}
            <div className="flex-1 min-w-0 sm:pb-1">
              <span className="eyebrow block mb-2">Kehkash-E-Dil Space</span>

              <h1 className="font-serif text-4xl sm:text-5xl text-heading leading-tight">
                {activeSpace.name}
              </h1>

              {activeSpace.bio && (
                <p className="text-muted mt-3 max-w-2xl leading-relaxed">
                  {activeSpace.bio}
                </p>
              )}
            </div>

            {/* Actions */}
            {own && (
              <div className="flex gap-2 flex-shrink-0 sm:-translate-y-3">
                <button
                  type="button"
                  onClick={startEdit}
                  className="px-4 py-2 border border-[var(--gold)]/40 text-[var(--gold)] text-xs uppercase tracking-widest hover:bg-[var(--gold)]/5 transition-colors"
                >
                  Details
                </button>

                <Link
                  to={`/write?space=${activeSpace.id}`}
                  className="px-4 py-2 bg-[var(--gold)] text-obsidian text-xs uppercase tracking-widest"
                >
                  Create
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Work tabs */}
      <div className="mt-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center border-b border-line w-full">
            <button
              type="button"
              onClick={() => setSpaceTab("published")}
              className={`
          px-5 py-3
          text-xs uppercase tracking-widest
          transition-all duration-200
          border-b-2 -mb-px
          ${
            spaceTab === "published"
              ? "text-heading border-[var(--gold)]"
              : "text-muted border-transparent hover:text-heading"
          }
        `}
            >
              Published
            </button>

            {own && (
              <>
                <button
                  type="button"
                  onClick={() => setSpaceTab("submissions")}
                  className={`
              px-5 py-3
              text-xs uppercase tracking-widest
              transition-all duration-200
              border-b-2 -mb-px
              ${
                spaceTab === "submissions"
                  ? "text-heading border-[var(--gold)]"
                  : "text-muted border-transparent hover:text-heading"
              }
            `}
                >
                  Submissions
                </button>

                <button
                  type="button"
                  onClick={() => setSpaceTab("private")}
                  className={`
              px-5 py-3
              text-xs uppercase tracking-widest
              transition-all duration-200
              border-b-2 -mb-px
              ${
                spaceTab === "private"
                  ? "text-heading border-[var(--gold)]"
                  : "text-muted border-transparent hover:text-heading"
              }
            `}
                >
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setSpaceTab("scheduled")}
                  className={`
    px-5 py-3
    text-xs uppercase tracking-widest
    transition-all duration-200
    border-b-2 -mb-px
    ${
      spaceTab === "scheduled"
        ? "text-heading border-[var(--gold)]"
        : "text-muted border-transparent hover:text-heading"
    }
  `}
                >
                  Scheduled
                </button>
                <button
                  type="button"
                  onClick={() => setSpaceTab("drafts")}
                  className={`
              px-5 py-3
              text-xs uppercase tracking-widest
              transition-all duration-200
              border-b-2 -mb-px
              ${
                spaceTab === "drafts"
                  ? "text-heading border-[var(--gold)]"
                  : "text-muted border-transparent hover:text-heading"
              }
            `}
                >
                  Drafts
                </button>
              </>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent border border-line text-xs uppercase tracking-widest text-muted px-3 py-2 mb-3"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most liked</option>
            <option value="az">A–Z</option>
          </select>
        </div>

        {/* Active tab content */}

        {(() => {
          const filteredWorks =
            spaceTab === "published"
              ? spaceWorks.filter(
                  (x) =>
                    x.status === WORK_STATUS.PUBLISHED &&
                    x.visibility === WORK_VISIBILITY.PUBLIC,
                )
              : spaceTab === "submissions"
                ? spaceWorks.filter((x) => x.status === WORK_STATUS.PENDING)
                : spaceTab === "private"
                  ? spaceWorks.filter(
                      (x) =>
                        x.status === WORK_STATUS.PUBLISHED &&
                        x.visibility === WORK_VISIBILITY.PRIVATE,
                    )
                  : spaceTab === "scheduled"
                    ? spaceWorks.filter(
                        (x) => x.status === WORK_STATUS.SCHEDULED,
                      )
                    : spaceWorks.filter((x) => x.status === WORK_STATUS.DRAFT);

          const shownWorks = applySort(filteredWorks);

          return shownWorks.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {shownWorks.map((x) => (
                <ContentCard
                  key={x.id}
                  item={x}
                  category={x.category}
                  modern
                  deletable={own}
                  showVisibilityControl={own}
                  onDeleted={(id) =>
                    setWorks((w) => w.filter((y) => y.id !== id))
                  }
                  onVisibilityChanged={(id, visibility) => {
                    setWorks((w) =>
                      w.map((y) => (y.id === id ? { ...y, visibility } : y)),
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted">
              <p className="font-serif text-2xl">
                {spaceTab === "published"
                  ? "No published works yet."
                  : spaceTab === "submissions"
                    ? "No submissions yet."
                    : spaceTab === "private"
                      ? "No private works."
                      : spaceTab === "scheduled"
                        ? "No scheduled works."
                        : "No drafts yet."}
              </p>

              {own && spaceTab === "drafts" && (
                <p className="text-xs mt-2">
                  Your unfinished works will appear here.
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}

function SpaceEditor({
  draft,
  setDraft,
  creating,
  editing,
  setEditing,
  setCreating,
  photoFile,
  setPhotoFile,
  iconFile,
  setIconFile,
  coverFile,
  setCoverFile,
  save,
  saving,
  canCancel,
  onDelete,
  deleting,
}) {
  return (
    <div className="space-editor glass-card p-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="field">
          <span>Name</span>

          <input
            value={draft.creatorName || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                creatorName: e.target.value,
              })
            }
            placeholder="Your name"
            maxLength={80}
          />
        </label>

        <label className="field">
          <span>Space name</span>

          <input
            value={draft.name || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                name: e.target.value,
              })
            }
            placeholder="Your Space name"
            maxLength={80}
          />
        </label>
      </div>

      <label className="field mt-4">
        <span>Bio</span>

        <textarea
          value={draft.bio || ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              bio: e.target.value,
            })
          }
          maxLength={500}
          rows={4}
          placeholder="A short introduction"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-5 mt-5">
        <div>
          <p className="field-label">Space icon</p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setIconFile(e.target.files?.[0] || null)}
            className="file-input"
          />

          <p className="text-xs text-muted mt-2">JPG, PNG or WebP · 2MB max</p>

          {draft.iconURL && !iconFile && (
            <img
              src={draft.iconURL}
              alt="Current Space icon"
              className="mt-3 w-16 h-16 rounded-full object-cover border border-line"
            />
          )}
        </div>

        <div>
          <p className="field-label">Space cover</p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="file-input"
          />

          <p className="text-xs text-muted mt-2">JPG, PNG or WebP · 2MB max</p>

          {(coverFile || draft.coverURL) && (
            <div className="mt-3">
              <img
                src={
                  coverFile ? URL.createObjectURL(coverFile) : draft.coverURL
                }
                alt="Space cover preview"
                className="w-full max-w-sm aspect-[16/9] object-cover border border-line"
              />
            </div>
          )}

          {!coverFile && !draft.coverURL && (
            <div
              className="mt-3 w-full max-w-sm aspect-[16/9] border border-line flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${draft.theme || "#d4af37"}33, var(--bg))`,
              }}
            >
              <div className="text-center">
                <div className="text-3xl text-gold mb-2">∞</div>
                <p className="font-serif text-lg text-heading">
                  {draft.name || "Your Space"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="field-label">Space color</p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={draft.theme || "#d4af37"}
            onChange={(e) =>
              setDraft({
                ...draft,
                theme: e.target.value,
              })
            }
            className="w-12 h-10 border border-line bg-transparent cursor-pointer p-0"
          />

          {SPACE_THEMES.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={t}
              onClick={() =>
                setDraft({
                  ...draft,
                  theme: t,
                })
              }
              className={`theme-dot ${
                draft.theme === t ? "theme-dot-active" : ""
              }`}
              style={{ background: t }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={save}
          disabled={saving || deleting}
          className="px-5 py-2 bg-[var(--gold)] text-obsidian text-xs uppercase tracking-widest"
        >
          {saving ? "Saving…" : creating ? "Create Space" : "Save Space"}
        </button>

        {canCancel && (
          <button
            onClick={() => {
              setEditing(false);
              setCreating(false);
            }}
            disabled={saving || deleting}
            className="px-5 py-2 border border-line text-body text-xs uppercase tracking-widest"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
