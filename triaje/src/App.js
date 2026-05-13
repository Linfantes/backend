import React from 'react';

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';

import Registro from './components/Registro';
import InicioSesion from './components/Login';
import Admision from './components/Admision';
import Dashboard from './components/Dashboard';
import Paciente from './components/Paciente';
import SignosVitales from './components/SignosVitales';

const ProtectedRoute = ({
  children,
  rolesPermitidos
}) => {

  const rol =
    localStorage.getItem('rol');

  // SIN LOGIN
  if (!rol) {

    return <Navigate to="/" replace />;

  }

  // SIN PERMISOS
  if (!rolesPermitidos.includes(rol)) {

    return <Navigate to="/" replace />;

  }

  return children;

};

const App = () => {

  return (

    <Router>

      <Routes>

        {/* LOGIN PRINCIPAL */}

        <Route
          path="/"
          element={<InicioSesion />}
        />

        {/* PACIENTE LIBRE */}

        <Route
          path="/paciente"
          element={<Paciente />}
        />

        {/* SOLO ADMIN */}

        <Route
          path="/registro"
          element={
            <ProtectedRoute
              rolesPermitidos={['Admin']}
            >
              <Registro />
            </ProtectedRoute>
          }
        />

        {/* SOLO ADMISION */}

        <Route
          path="/admision"
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'Admision'
              ]}
            >
              <Admision />
            </ProtectedRoute>
          }
        />

        {/* SOLO DOCTOR */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'Doctor'
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* SOLO DOCTOR */}

        <Route
          path="/SignosVitales"
          element={
            <ProtectedRoute
              rolesPermitidos={[
                'Doctor'
              ]}
            >
              <SignosVitales />
            </ProtectedRoute>
          }
        />

        {/* CUALQUIER OTRA */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </Router>

  );

};

export default App;