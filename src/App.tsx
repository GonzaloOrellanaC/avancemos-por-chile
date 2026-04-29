import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import Home from './pages/Home';
import DynamicPage from './pages/DynamicPage';
import Blog from './pages/Blog';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Editor from './pages/Editor';
import PageEditor from './pages/PageEditor';
import PostDetail from './pages/PostDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Privacy from './pages/Privacy';
import Legal from './pages/Legal';
import Contact from './pages/Contact';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminPages from './pages/AdminPages';
import AdminUsers from './pages/AdminUsers';
import AdminBlog from './pages/AdminBlog';
import AdminDashboard from './pages/AdminDashboard';
import UserEdit from './pages/UserEdit';
import PublicUser from './pages/PublicUser';
import Notifications from './pages/Notifications';

function isProtectedPath(pathname: string) {
  const protectedPrefixes = ['/admin', '/editor', '/profile', '/notifications', '/page-editor', '/blog/manage'];
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('user-updated'));
}

function isTrackablePublicPath(pathname: string) {
  const privatePrefixes = ['/admin', '/editor', '/profile', '/notifications', '/page-editor', '/blog/manage'];
  const privateExactPaths = ['/login', '/forgot-password', '/reset-password'];

  if (privateExactPaths.includes(pathname)) {
    return false;
  }

  return !privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function RouteViewTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackedPath = location.pathname || '/';
    if (!isTrackablePublicPath(trackedPath)) {
      return;
    }

    const controller = new AbortController();

    const trackView = async () => {
      try {
        const { default: fetchApi } = await import('./lib/api');
        const response = await fetchApi('/api/posts/site/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: trackedPath }),
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        window.dispatchEvent(new CustomEvent('site-view-tracked', { detail: data }));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error tracking site view', error);
        }
      }
    };

    trackView();

    return () => controller.abort();
  }, [location.pathname]);

  return null;
}

function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isActive = true;

    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      clearStoredSession();
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    const validateSession = async () => {
      try {
        const { default: fetchApi } = await import('./lib/api');
        const response = await fetchApi('/api/auth/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('La sesión expiró');
        }

        const result = await response.json();
        localStorage.setItem('user', JSON.stringify(result.user));
        window.dispatchEvent(new Event('user-updated'));

        if (isActive) {
          setIsCheckingSession(false);
        }
      } catch (error) {
        clearStoredSession();
        if (isActive) {
          navigate('/login', { replace: true, state: { from: location.pathname } });
        }
      }
    };

    setIsCheckingSession(true);
    validateSession();

    return () => {
      isActive = false;
    };
  }, [location.pathname, navigate]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-white px-5 py-3 text-sm font-semibold text-brand-blue shadow-sm">
          <Loader2 size={18} className="animate-spin text-brand-red" />
          <span>Verificando sesión...</span>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function AdminRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as { role?: string };
      if (parsedUser.role !== 'admin') {
        navigate('/profile', { replace: true });
        return;
      }
    } catch {
      navigate('/profile', { replace: true });
      return;
    }

    setIsCheckingRole(false);
  }, [location.pathname, navigate]);

  if (isCheckingRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-white px-5 py-3 text-sm font-semibold text-brand-blue shadow-sm">
          <Loader2 size={18} className="animate-spin text-brand-red" />
          <span>Validando permisos de administrador...</span>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function SessionValidator() {
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isProtectedPath(location.pathname)) {
      return;
    }

    let isActive = true;

    const validateSession = async () => {
      try {
        const { default: fetchApi } = await import('./lib/api');
        const response = await fetchApi('/api/auth/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('La sesión expiró');
        }

        const result = await response.json();
        if (!isActive) {
          return;
        }

        localStorage.setItem('user', JSON.stringify(result.user));
        window.dispatchEvent(new Event('user-updated'));
      } catch (error) {
        clearStoredSession();
      }
    };

    validateSession();

    return () => {
      isActive = false;
    };
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <RouteViewTracker />
      <SessionValidator />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<DynamicPage />} />
            <Route path="/p/:slug" element={<DynamicPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<PostDetail />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/u/:id" element={<PublicUser />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/legal" element={<Legal />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/blog/manage" element={<AdminBlog />} />
              <Route path="/profile/edit" element={<UserEdit />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/pages" element={<AdminPages />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                <Route path="/page-editor/:slug" element={<PageEditor />} />
              </Route>
            </Route>
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}
