import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, Sprout } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Email ya password galat hai.");
      } else if (err.code === "auth/invalid-email") {
        setError("Valid email address enter karo.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Thodi der baad try karo.");
      } else {
        setError("Login nahi ho paya. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email) {
      setError("Pehle apna email enter karo.");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link aapke email par bhej diya gaya hai.");
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Valid email address enter karo.");
      } else {
        setError("Password reset email send nahi ho paya.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4 py-8">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center">

        <div className="w-full rounded-[30px] border border-emerald-100 bg-white p-7 shadow-2xl shadow-emerald-100/50">

          {/* LOGO */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Sprout size={32} />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Krishi<span className="text-emerald-600">Setu</span>
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Smart farming, made simple.
            </p>
          </div>

          {/* TITLE */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Welcome back 👋
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Login to continue to your farm dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* FORGOT PASSWORD */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
              >
                {resetLoading
                  ? "Sending..."
                  : "Forgot password?"}
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            )}

            {/* LOGIN */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* CREATE ACCOUNT */}
          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              New to KrishiSetu?
            </p>

            <Link
              to="/create-account"
              className="mt-2 inline-block text-sm font-bold text-emerald-600 hover:text-emerald-700"
            >
              Create a new account →
            </Link>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Your account helps keep your farming data private.
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;