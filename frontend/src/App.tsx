import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from '@/routes/RequireAuth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Today from '@/pages/Today';
import Tasks from '@/pages/Tasks';
import Summary from '@/pages/Summary';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<Today />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
