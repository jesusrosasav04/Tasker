import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GoogleSuccess from "./pages/GoogleSuccess";
import Proveedores from "./pages/Proveedores";
import PerfilTrabajador from "./pages/PerfilTrabajador";
import PublicarSolicitud from "./pages/PublicarSolicitud";
import DashboardCliente from "./pages/DashboardCliente";
import DashboardTrabajador from "./pages/DashboardTrabajador";
import NuevaTarea from "./pages/NuevaTarea";
import PostulacionesTarea from "./pages/PostulacionesTarea";
import EditarPerfilTrabajador from "./pages/EditarPerfilTrabajador";
import Chat from "./pages/Chat";
import Admin from "./pages/admin/Admin";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminUsuarioDetalle from "./pages/admin/AdminUsuarioDetalle";
import AdminTrabajadores from "./pages/admin/AdminTrabajadores";
import AdminTareas from "./pages/admin/AdminTareas";
import AdminCategorias from "./pages/admin/AdminCategorias";

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
        <Route path="/auth/google/success" element={<GoogleSuccess />} />

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
          path="/dashboard/cliente/tareas/nueva"
          element={
            <ProtectedRoute roles={["cliente"]}>
              <NuevaTarea />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/cliente/tareas/:id"
          element={
            <ProtectedRoute roles={["cliente"]}>
              <PostulacionesTarea />
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
        <Route
          path="/dashboard/trabajador/perfil"
          element={
            <ProtectedRoute roles={["trabajador"]}>
              <EditarPerfilTrabajador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:tarea_id"
          element={
            <ProtectedRoute roles={["cliente", "trabajador"]}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios/:id"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsuarioDetalle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/trabajadores"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminTrabajadores />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tareas"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminTareas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminCategorias />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
