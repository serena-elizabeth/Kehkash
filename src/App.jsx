import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";

const MusicRoom = lazy(() => import("./pages/MusicRoom"));
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Search = lazy(() => import("./pages/Search"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const Explore = lazy(() => import("./pages/Explore"));
const WorkEditor = lazy(() => import("./pages/WorkEditor"));
const Space = lazy(() => import("./pages/Space"));
const ContentView = lazy(() => import("./pages/ContentView"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Library = lazy(() => import("./pages/Library"));

const loadPage = (Page) => (
  <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted">Loading…</div>}>
    <Page />
  </Suspense>
);

export default function App() {
  const location = useLocation();
  const isMusicRoom = location.pathname === "/songs/room";

  return (
    <ThemeProvider>
      <AuthProvider>
        <div
          className={isMusicRoom ? "music-room-app" : "min-h-screen site-bg"}
        >
          {!isMusicRoom && <Navbar />}

          <main className={isMusicRoom ? "" : "page-enter"}>
            <Routes>
              <Route path="/" element={loadPage(Home)} />
              <Route path="/about" element={loadPage(About)} />
              <Route path="/search" element={loadPage(Search)} />
              <Route path="/login" element={loadPage(Login)} />
              <Route path="/admin" element={loadPage(Admin)} />
              <Route path="/explore" element={loadPage(Explore)} />
              <Route path="/write" element={loadPage(WorkEditor)} />
              <Route path="/write/:id" element={loadPage(WorkEditor)} />
              <Route path="/me" element={loadPage(Space)} />
              <Route path="/library" element={loadPage(Library)} />
              <Route path="/space/:uid" element={loadPage(Space)} />
              <Route path="/space/:uid/:spaceId" element={loadPage(Space)} />
              <Route path="/works/:id" element={loadPage(ContentView)} />
              <Route
                path="/songs/room"
                element={
                  <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted">Loading room…</div>}>
                    <MusicRoom />
                  </Suspense>
                }
              />
              <Route path="/:category" element={loadPage(CategoryPage)} />
              <Route path="/:category/:id" element={loadPage(ContentView)} />
            </Routes>
          </main>
          {!isMusicRoom && (
            <Toaster
              position="bottom-center"
              toastOptions={{ className: "dek-toast" }}
            />
          )}
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
