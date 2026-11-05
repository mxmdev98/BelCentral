// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { ApiRequestError } from "../api/client";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full grid place-items-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-lg bg-brand-600 text-white items-center justify-center font-bold text-lg mb-3">
            BC
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Bel Central</h1>
          <p className="text-sm text-slate-500">LLG/Ward Record Book Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold ">Sign in</h2>
            {serverError && (
              <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {serverError}
              </div>
            )}
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input
                id="username"
                className="input"
                autoComplete="username"
                {...register("username")}
              />
              {errors.username && <p className="field-error">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Link to="#" className="text-xs text-slate-400 pointer-events-none">
            For ward officials and LLG administrators
          </Link>
        </div>
      </div>
    </div>
  );
}
