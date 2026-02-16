/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker - Main Application Router
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Production-optimized router with:
 * - Lazy loading for all dashboard pages (code splitting)
 * - Unified DashboardLayout for all roles
 * - Suspense boundaries with loading states
 *
 * @module App
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Layout from "./layouts/Layout";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardRedirect from "./components/DashboardRedirect";

// ═══════════════════════════════════════════════════════════════════════════
// LOADING COMPONENT
// Displayed while lazy-loaded pages are being fetched
// ═══════════════════════════════════════════════════════════════════════════

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Single fallback element instance (avoids re-creating the same element many times)
const pageLoaderEl = <PageLoader />;

// Memoized Suspense wrapper to produce stable elements for routes.
// Using a Map keyed by the lazy component prevents recreating identical
// Suspense elements repeatedly (small perf + stable identity for router).
const suspenseCache = new Map();
const withSuspense = (Component) => {
  if (!suspenseCache.has(Component)) {
    suspenseCache.set(
      Component,
      <Suspense fallback={pageLoaderEl}>
        <Component />
      </Suspense>
    );
  }
  return suspenseCache.get(Component);
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC PAGES - Lazy loaded for code splitting
// ═══════════════════════════════════════════════════════════════════════════

const Home = lazy(() => import("./pages/Home"));
const Lawyers = lazy(() => import("./pages/AllLawyers"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const LawyerProfilePage = lazy(() => import("./pages/public/LawyerProfilePage"));
const BookingPage = lazy(() => import("./pages/public/BookingPage"));
const CheckoutPage = lazy(() => import("./pages/public/CheckoutPage"));

// ═══════════════════════════════════════════════════════════════════════════
// LAWYER DASHBOARD PAGES
// ═══════════════════════════════════════════════════════════════════════════

const LawyerDashboard = lazy(() => import("./pages/lawyer/LawyerDashboard"));
const LawyerProfile = lazy(() => import("./pages/lawyer/LawyerProfile"));
const LawyerAppointments = lazy(() => import("./pages/lawyer/LawyerAppointments"));
const LawyerCalendar = lazy(() => import("./pages/lawyer/LawyerCalendar"));
const LawyerClients = lazy(() => import("./pages/lawyer/LawyerClients"));
const LawyerCases = lazy(() => import("./pages/lawyer/LawyerCases"));
const LawyerEarnings = lazy(() => import("./pages/lawyer/LawyerEarnings"));
const LawyerDocuments = lazy(() => import("./pages/lawyer/LawyerDocuments"));
const LawyerAvailability = lazy(() => import("./pages/lawyer/LawyerAvailability"));
const LawyerNotifications = lazy(() => import("./pages/lawyer/LawyerNotifications"));

// ═══════════════════════════════════════════════════════════════════════════
// USER DASHBOARD PAGES
// ═══════════════════════════════════════════════════════════════════════════

const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const UserAppointments = lazy(() => import("./pages/user/UserAppointments"));
const UserSavedLawyers = lazy(() => import("./pages/user/UserSavedLawyers"));
const UserCases = lazy(() => import("./pages/user/UserCases"));
const UserPayments = lazy(() => import("./pages/user/UserPayments"));
const UserNotifications = lazy(() => import("./pages/user/UserNotifications"));
const UserSettings = lazy(() => import("./pages/user/UserSettings"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const CaseDetail = lazy(() => import("./pages/cases/CaseDetail"));
const CreateCase = lazy(() => import("./pages/cases/CreateCase"));

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD PAGES
// ═══════════════════════════════════════════════════════════════════════════

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const LawyerVerification = lazy(() => import("./pages/admin/LawyerVerification"));
const LawyerManagement = lazy(() => import("./pages/admin/LawyerManagement"));

// ═══════════════════════════════════════════════════════════════════════════
// ROOT LAYOUT - Provides AuthContext to all routes
// ═══════════════════════════════════════════════════════════════════════════

function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Outlet />
      </SocketProvider>
    </AuthProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ─────────────────────────────────────────────────────────────────
      // Public Routes
      // ─────────────────────────────────────────────────────────────────
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: withSuspense(Home) },
          { path: "login", element: withSuspense(Login) },
          { path: "lawyers", element: withSuspense(Lawyers) },
          { path: "lawyers/:id", element: withSuspense(LawyerProfilePage) },
          { path: "lawyers/:id/book", element: withSuspense(BookingPage) },
          { path: "lawyers/:id/checkout", element: withSuspense(CheckoutPage) },
          { path: "about", element: withSuspense(About) },
          { path: "contact", element: withSuspense(Contact) },
          { path: "signup", element: withSuspense(Signup) },
          { path: "verify-email", element: withSuspense(VerifyEmail) },
          // Legacy routes (for backward compatibility)
          { path: "About", element: withSuspense(About) },
          { path: "Contact", element: withSuspense(Contact) },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      // Unified Dashboard Redirect
      // ─────────────────────────────────────────────────────────────────
      {
        path: "/dashboard",
        element: <DashboardRedirect />,
      },

      // ─────────────────────────────────────────────────────────────────
      // Lawyer Dashboard (uses unified DashboardLayout with role="lawyer")
      // ─────────────────────────────────────────────────────────────────
      {
        path: "/lawyer",
        element: <DashboardLayout role="lawyer" />,
        children: [
          { index: true, element: withSuspense(LawyerDashboard) },
          { path: "dashboard", element: withSuspense(LawyerDashboard) },
          { path: "profile", element: withSuspense(LawyerProfile) },
          { path: "appointments", element: withSuspense(LawyerAppointments) },
          { path: "calendar", element: withSuspense(LawyerCalendar) },
          { path: "clients", element: withSuspense(LawyerClients) },
          { path: "cases", element: withSuspense(LawyerCases) },
          { path: "earnings", element: withSuspense(LawyerEarnings) },

          { path: "documents", element: withSuspense(LawyerDocuments) },
          { path: "availability", element: withSuspense(LawyerAvailability) },
          { path: "notifications", element: withSuspense(LawyerNotifications) },
          { path: "chat", element: withSuspense(ChatPage) },
          { path: "cases/:id", element: withSuspense(CaseDetail) },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      // User Dashboard (uses unified DashboardLayout with role="user")
      // ─────────────────────────────────────────────────────────────────
      {
        path: "/user",
        element: <DashboardLayout role="user" />,
        children: [
          { index: true, element: withSuspense(UserDashboard) },
          { path: "dashboard", element: withSuspense(UserDashboard) },
          { path: "appointments", element: withSuspense(UserAppointments) },
          { path: "saved-lawyers", element: withSuspense(UserSavedLawyers) },
          { path: "cases", element: withSuspense(UserCases) },
          { path: "payments", element: withSuspense(UserPayments) },
          { path: "notifications", element: withSuspense(UserNotifications) },
          { path: "settings", element: withSuspense(UserSettings) },
          { path: "chat", element: withSuspense(ChatPage) },
          { path: "cases/:id", element: withSuspense(CaseDetail) },
          { path: "create-case", element: withSuspense(CreateCase) },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      // Admin Dashboard (uses unified DashboardLayout with role="admin")
      // ─────────────────────────────────────────────────────────────────
      {
        path: "/admin",
        element: <DashboardLayout role="admin" />,
        children: [
          { index: true, element: withSuspense(AdminDashboard) },
          { path: "dashboard", element: withSuspense(AdminDashboard) },
          { path: "users", element: withSuspense(UserManagement) },
          { path: "lawyers", element: withSuspense(LawyerManagement) },
          { path: "verification", element: withSuspense(LawyerVerification) },
        ],
      },
    ],
  },
]);

// ═══════════════════════════════════════════════════════════════════════════
// APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function App() {
  return <RouterProvider router={router} />;
}

export default App;
