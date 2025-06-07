import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white p-4">
      <div className="text-center max-w-lg bg-slate-800/50 p-8 rounded-lg shadow-xl border border-slate-600">
        <h1 className="text-6xl font-bold mb-6 text-red-400">404</h1>
        <h2 className="text-3xl font-semibold mb-6 text-[#94C3D2]">
          Page Not Found
        </h2>
        <div className="h-1 w-24 bg-[#94C3D2] mx-auto mb-6 rounded-full"></div>

        <p className="text-lg mb-4 text-slate-200">
          The page you're trying to access doesn't exist.
        </p>
        <p className="mb-8 text-slate-300">
          You'll be redirected to the dashboard in a few seconds.
        </p>

        <Link
          to="/dashboard"
          className="px-6 py-3 bg-[#94C3D2] text-[#0f172a] font-bold rounded-md hover:bg-[#7BA8B7] transition-colors inline-flex items-center gap-2"
        >
          Go to Dashboard Now
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
