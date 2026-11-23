import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const GoogleSuccess = lazy(() => import("./pages/GoogleSuccess"));
const Bienvenida = lazy(() => import("./pages/Bienvenida"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const PerfilTrabajador = lazy(() => import("./pages/PerfilTrabajador"));
const PublicarSolicitud = lazy(() => import("./pages/PublicarSolicitud"));
const DashboardCliente = lazy(() => import("./pages/DashboardCliente"));
const DashboardTrabajador = lazy(() => import("./pages/DashboardTrabajador"));
const NuevaTarea = lazy(() => import("./pages/NuevaTarea"));
const EditarTarea = lazy(() => import("./pages/EditarTarea"));
const PostulacionesTarea = lazy(() => import("./pages/PostulacionesTarea"));
const EditarPerfilTrabajador = lazy(() => import("./pages/EditarPerfilTrabajador"));
const Chat = lazy(() => import("./pages/Chat"));
const DetalleTarea = lazy(() => import("./pages/DetalleTarea"));
const Admin = lazy(() => import("./pages/admin/Admin"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios"));
const AdminUsuarioDetalle = lazy(() => import("./pages/admin/AdminUsuarioDetalle"));
const AdminTrabajadores = lazy(() => import("./pages/admin/AdminTrabajadores"));
const AdminTareas = lazy(() => import("./pages/admin/AdminTareas"));
const AdminCategorias = lazy(() => import("./pages/admin/AdminCategorias"));
const MisPagos = lazy(() => import("./pages/MisPagos"));
const RecuperarPassword = lazy(() => import("./pages/RecuperarPassword"));
const RestablecerPassword = lazy(() => import("./pages/RestablecerPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Soporte = lazy(() => import("./pages/Soporte"));
const AdminReportes = lazy(() => import("./pages/admin/AdminReportes"));

function App() {
  const { user } = useAuth();
  const location = useLocation();
  // Usuario de Google que aún no elige rol: queda "encerrado" en la bienvenida
  const onboarding = !!user && user.perfil_completo === 0;

  if (onboarding && location.pathname !== "/bienvenida") {
    return <Navigate to="/bienvenida" replace />;
  }
  // Quien ya eligió rol no tiene nada que hacer en la bienvenida
  if (user && !onboarding && location.pathname === "/bienvenida") {
    const panel = { admin: "/admin", trabajador: "/dashboard/trabajador" }[user.role];
    return <Navigate to={panel || "/dashboard/cliente"} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!onboarding && <Navbar />}
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/trabajador/:id" element={<PerfilTrabajador />} />
        <Route path="/publicar" element={<PublicarSolicitud />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />
        <Route path="/restablecer" element={<RestablecerPassword />} />
        <Route
          path="/pagos"
          element={
            <ProtectedRoute roles={["cliente", "trabajador"]}>
              <MisPagos />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/google/success" element={<GoogleSuccess />} />
        <Route
          path="/bienvenida"
          element={
            <ProtectedRoute>
              <Bienvenida />
            </ProtectedRoute>
          }
        />

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
          path="/dashboard/cliente/tareas/:id/editar"
          element={
            <ProtectedRoute roles={["cliente"]}>
              <EditarTarea />
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
          path="/tareas/:id"
          element={
            <ProtectedRoute roles={["cliente", "trabajador"]}>
              <DetalleTarea />
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
        {["/soporte", "/soporte/:id"].map((p) => (
          <Route key={p} path={p} element={
            <ProtectedRoute roles={["cliente", "trabajador"]}><Soporte /></ProtectedRoute>
          } />
        ))}
        {["/admin/reportes", "/admin/reportes/:id"].map((p) => (
          <Route key={p} path={p} element={
            <ProtectedRoute roles={["admin"]}><AdminReportes /></ProtectedRoute>
          } />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      {!onboarding && <Footer />}
    </div>
  );
}

export default App;
