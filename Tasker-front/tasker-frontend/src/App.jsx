import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Proveedores from "./pages/Proveedores";
import PerfilTrabajador from "./pages/PerfilTrabajador";
import PublicarSolicitud from "./pages/PublicarSolicitud";
import DashboardCliente from "./pages/DashboardCliente";
import DashboardTrabajador from "./pages/DashboardTrabajador";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/trabajador/:id" element={<PerfilTrabajador />} />
        <Route path="/publicar" element={<PublicarSolicitud />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protegidas */}
        <Route
          path="/dashboard/cliente"
          element={
            <ProtectedRoute roles={["cliente"]}>
              <DashboardCliente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trabajador"
          element={
            <ProtectedRoute roles={["trabajador"]}>
              <DashboardTrabajador />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
