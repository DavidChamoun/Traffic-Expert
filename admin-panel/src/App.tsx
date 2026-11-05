import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpertsListPage } from './pages/ExpertsListPage';
import { AddExpertPage } from './pages/AddExpertPage';
import { EditExpertPage } from './pages/EditExpertPage';
import { ExpertDetailsPage } from './pages/ExpertDetailsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '13px',
              borderRadius: '8px',
            },
          }}
        />
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected syndicate administration routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="experts" element={<ExpertsListPage />} />
            <Route path="experts/new" element={<AddExpertPage />} />
            <Route path="experts/:licenseNumber" element={<ExpertDetailsPage />} />
            <Route path="experts/:licenseNumber/edit" element={<EditExpertPage />} />
            <Route path="activity" element={<ActivityLogPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
