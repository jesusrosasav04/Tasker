import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      localStorage.setItem("token", token);
      const payload = JSON.parse(atob(token.split(".")[1]));

      // Recarga completa (no navigate): AuthContext solo lee el token al montar;
      // con navigate el usuario seguía en null y ProtectedRoute lo mandaba a /login.
      const destino =
        payload.perfil_completo === 0 ? "/bienvenida" // aún no eligió rol
        : payload.role === "admin" ? "/admin"
        : payload.role === "trabajador" ? "/dashboard/trabajador"
        : "/dashboard/cliente";
      window.location.replace(destino);
    } catch {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-crema gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <Wrench className="h-6 w-6 text-white" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-piedra text-sm font-medium">
          Iniciando sesión con Google...
        </p>
      </div>
    </div>
  );
}
