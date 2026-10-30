
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import AppShell from './components/AppShell.jsx'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import WatchPage from './pages/WatchPage.jsx'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="route-loading"><span className="spinner" /> Loading your account...</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="signup" element={<AuthPage mode="signup" />} />
        <Route path="watch/:streamId" element={<WatchPage />} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>
}
