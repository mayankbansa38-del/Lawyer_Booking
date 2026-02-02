import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AuthProvider } from "./context/mockAuth";
import Layout from "./layouts/Layout";
import LawyerLayout from "./layouts/LawyerLayout";
import UserLayout from "./layouts/UserLayout";

// Public pages
import Home from "./pages/Home";
import Lawyers from "./pages/All_lawyer";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import LawyerProfilePage from "./pages/public/LawyerProfilePage";
import BookingPage from "./pages/public/BookingPage";

// Lawyer Dashboard pages
import LawyerDashboard from "./pages/lawyer/LawyerDashboard";
import LawyerProfile from "./pages/lawyer/LawyerProfile";
import LawyerAppointments from "./pages/lawyer/LawyerAppointments";
import LawyerCalendar from "./pages/lawyer/LawyerCalendar";
import LawyerClients from "./pages/lawyer/LawyerClients";
import LawyerCases from "./pages/lawyer/LawyerCases";
import LawyerEarnings from "./pages/lawyer/LawyerEarnings";
import LawyerAnalytics from "./pages/lawyer/LawyerAnalytics";
import LawyerDocuments from "./pages/lawyer/LawyerDocuments";
import LawyerAvailability from "./pages/lawyer/LawyerAvailability";

// User Dashboard pages
import UserDashboard from "./pages/user/UserDashboard";
import UserAppointments from "./pages/user/UserAppointments";
import UserSavedLawyers from "./pages/user/UserSavedLawyers";
import UserCases from "./pages/user/UserCases";
import UserPayments from "./pages/user/UserPayments";
import UserNotifications from "./pages/user/UserNotifications";
import UserSettings from "./pages/user/UserSettings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "lawyers", element: <Lawyers /> },
      { path: "lawyers/:id", element: <LawyerProfilePage /> },
      { path: "lawyers/:id/book", element: <BookingPage /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "signup", element: <Signup /> },
      // Legacy routes
      { path: "All_lawyer", element: <Lawyers /> },
      { path: "About", element: <About /> },
      { path: "Contact", element: <Contact /> },
    ],
  },
  // Lawyer Dashboard
  {
    path: "/lawyer",
    element: <LawyerLayout />,
    children: [
      { index: true, element: <LawyerDashboard /> },
      { path: "dashboard", element: <LawyerDashboard /> },
      { path: "profile", element: <LawyerProfile /> },
      { path: "appointments", element: <LawyerAppointments /> },
      { path: "calendar", element: <LawyerCalendar /> },
      { path: "clients", element: <LawyerClients /> },
      { path: "cases", element: <LawyerCases /> },
      { path: "earnings", element: <LawyerEarnings /> },
      { path: "analytics", element: <LawyerAnalytics /> },
      { path: "documents", element: <LawyerDocuments /> },
      { path: "availability", element: <LawyerAvailability /> },
    ],
  },
  // User Dashboard
  {
    path: "/user",
    element: <UserLayout />,
    children: [
      { index: true, element: <UserDashboard /> },
      { path: "dashboard", element: <UserDashboard /> },
      { path: "appointments", element: <UserAppointments /> },
      { path: "saved-lawyers", element: <UserSavedLawyers /> },
      { path: "cases", element: <UserCases /> },
      { path: "payments", element: <UserPayments /> },
      { path: "notifications", element: <UserNotifications /> },
      { path: "settings", element: <UserSettings /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
