import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ScrumProvider } from './context/ScrumContext';

// Components
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProductBacklog from './pages/ProductBacklog';
import SprintPlanning from './pages/SprintPlanning';
import CurrentSprint from './pages/CurrentSprint';
import Reports from './pages/Reports';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <ScrumProvider>
        <DndProvider backend={HTML5Backend}>
          <Router>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="product-backlog" element={<ProductBacklog />} />
                <Route path="sprint-planning" element={<SprintPlanning />} />
                <Route path="current-sprint" element={<CurrentSprint />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </DndProvider>
      </ScrumProvider>
    </AuthProvider>
  );
}

export default App;