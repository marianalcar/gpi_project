import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Context Provider
import { ScrumProvider } from './context/ScrumContext';

// Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProductBacklog from './pages/ProductBacklog';
import SprintPlanning from './pages/SprintPlanning';
import CurrentSprint from './pages/CurrentSprint';
import Reports from './pages/Reports';

function App() {
  return (
    <ScrumProvider>
      <DndProvider backend={HTML5Backend}>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="product-backlog" element={<ProductBacklog />} />
              <Route path="sprint-planning" element={<SprintPlanning />} />
              <Route path="current-sprint" element={<CurrentSprint />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </Router>
      </DndProvider>
    </ScrumProvider>
  );
}

export default App;