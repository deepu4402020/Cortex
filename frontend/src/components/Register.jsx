import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/p/welcome");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/signup", { user_name: username, email, password });
      if (res.data.success) {
        // Automatically route them to login
        navigate("/login");
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Error creating account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
      <div className="w-full max-w-md p-8 md:p-10 border border-border shadow-minimal rounded-xl bg-background">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
        <p className="text-muted-foreground text-sm mb-8">Start organizing your digital life.</p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-border rounded focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-border rounded focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow"
              placeholder="Choose a username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-border rounded focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-2 px-4 bg-foreground text-background font-medium rounded hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground underline hover:text-foreground/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
