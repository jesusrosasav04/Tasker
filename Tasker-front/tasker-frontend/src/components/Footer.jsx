import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Tasker</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2024 Tasker. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
