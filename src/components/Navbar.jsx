import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiSun,
  FiMoon,
  FiSearch,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiPlus,
  FiBookmark,
  FiChevronsUp,
  FiChevronsDown,
} from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const ref = useRef();
  useEffect(() => {
    setOpen(false);
    setImageError(false);
  }, [loc.pathname, user?.uid]);
  useEffect(() => {
    const f = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        setNavbarVisible((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const logout = async () => {
    await signOut(auth);
    toast.success("Signed out");
    nav("/");
  };

  return (
    <>
      <nav
        style={{
          transform: navbarVisible
            ? "translateY(0)"
            : "translateY(calc(-100% + 15px))",
        }}
        className={`fixed top-0 left-3 right-3 z-50
          bg-[var(--bg)]/55 backdrop-saturate-150
          ${navbarVisible ? "backdrop-blur-xl" : "backdrop-blur-none"}
          border-x border-t border-white/15 shadow-lg rounded-b-2xl
          transition-transform duration-300`}
      >
        <div className="w-[94%] sm:w-[92%] lg:w-[90%] xl:w-[88%] 2xl:w-[86%] mx-auto h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" className="w-8 h-8" />
            <span className="font-serif text-xl text-gold hidden sm:block">
              Kehkash
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-6">
            <Link className="nav-link" to="/explore">
              Explore
            </Link>
            <Link className="nav-link" to="/quotes">
              Quotes
            </Link>
            <Link className="nav-link" to="/poems">
              Poems
            </Link>
            <Link className="nav-link" to="/stories">
              Stories
            </Link>
            <Link className="nav-link" to="/songs">
              Music
            </Link>
            <Link className="nav-link" to="/about">
              About
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => nav("/search")} className="icon-action p-2">
              <FiSearch />
            </button>
            <button onClick={toggleTheme} className="icon-action p-2">
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>
            <div ref={ref} className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="w-8 h-8 rounded-full border border-gold/40 overflow-hidden flex items-center justify-center"
                aria-label="Open profile menu"
              >
                {user?.photoURL && !imageError ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <FiUser className="w-5 h-5 text-gold" />
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg)] border border-line p-2 shadow-lg">
                  <div className="px-3 py-2 border-b border-line">
                    <p className="text-xs text-muted truncate">
                      {user?.email || "Guest"}
                    </p>
                  </div>
                  {user ? (
                    <>
                      <Link to="/me" className="menu-link">
                        <FiUser /> My Space
                      </Link>

                      <Link to="/library" className="menu-link">
                        <FiBookmark /> My Library
                      </Link>

                      <Link to="/write" className="menu-link">
                        <FiPlus /> Create
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="menu-link">
                          <FiSettings /> Approval desk
                        </Link>
                      )}
                      <button onClick={logout} className="menu-link w-full">
                        <FiLogOut /> Sign out
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="menu-link">
                      <FiUser /> Sign in
                    </Link>
                  )}
                </div>
              )}
            </div>
            <button
              className="lg:hidden icon-action p-2"
              onClick={() => setOpen(!open)}
            >
              {open ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        <button
          onClick={() => setNavbarVisible(!navbarVisible)}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-[var(--bg)]/55 backdrop-blur-none border-x border-b border-white/15 rounded-b-xl shadow-lg flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-all duration-200"
          aria-label={navbarVisible ? "Hide navigation" : "Show navigation"}
          title={navbarVisible ? "Hide navigation" : "Show navigation"}
        >
          {navbarVisible ? (
            <FiChevronsUp className="w-4 h-4" />
          ) : (
            <FiChevronsDown className="w-4 h-4" />
          )}
        </button>

        <style>{`.nav-link{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.nav-link:hover,.menu-link:hover{color:var(--gold)}.menu-link{display:flex;gap:.6rem;align-items:center;padding:.65rem .75rem;color:var(--body);font-size:.8rem}`}</style>
      </nav>
    </>
  );
}
