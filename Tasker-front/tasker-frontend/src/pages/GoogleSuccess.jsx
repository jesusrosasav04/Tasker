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

      if (payload.role === "admin") navigate("/admin");
      else if (payload.role === "trabajador") navigate("/dashboard/trabajador");
      else navigate("/dashboard/cliente");
    } catch {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
        <Wrench className="h-6 w-6 text-white" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm font-medium">
          Iniciando sesión con Google...
        </p>
      </div>
    </div>
  );
}
