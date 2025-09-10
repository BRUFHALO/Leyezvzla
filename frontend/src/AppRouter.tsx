import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './App';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProvider } from './context/AdminContext';
import { ProtectedRoute } from './components/ProtectedRoute';
export function AppRouter() {
  return <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>;
}