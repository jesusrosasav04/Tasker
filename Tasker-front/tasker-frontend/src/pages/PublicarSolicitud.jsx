import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicarSolicitud() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "cliente") navigate("/dashboard/cliente/tareas/nueva", { replace: true });
    else if (user) navigate("/dashboard/cliente", { replace: true });
    else navigate("/login", { replace: true });
  }, [user]);

  return null;
}
