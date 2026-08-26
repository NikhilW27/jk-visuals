"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "./actions";
import { initialLoginState, type LoginState } from "./state";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 w-full cursor-pointer border border-bone/20 py-3 font-mono text-[10px] tracking-[0.22em] text-bone uppercase transition-colors duration-300 hover:border-signal hover:text-signal disabled:cursor-wait disabled:text-bone/40"
    >
      {pending ? "Checking" : "Sign in"}
    </button>
  );
}

export default function LoginForm({ configured }: { configured: boolean }) {
  const [state, action] = useActionState<LoginState, FormData>(
    login,
    initialLoginState,
  );

  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] tracking-[0.22em] text-bone/35 uppercase">
          JK Visuals
        </p>
        <h1 className="font-display tracking-display mt-3 text-4xl text-bone">
          Admin
        </h1>

        {configured ? (
          <form action={action} className="mt-10">
            <label
              htmlFor="password"
              className="block font-mono text-[10px] tracking-[0.22em] text-bone/40 uppercase"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-3 w-full border-b border-bone/15 bg-transparent pb-3 text-[15px] text-bone outline-none transition-colors duration-300 focus:border-signal"
            />
            {state.error ? (
              <p role="alert" className="mt-3 text-xs text-signal">
                {state.error}
              </p>
            ) : null}
            <Submit />
          </form>
        ) : (
          <div className="mt-10 border-l border-signal/40 pl-5">
            <p className="text-sm leading-relaxed text-bone/60">
              <code className="text-bone">ADMIN_PASSWORD</code> is not set, so
              there is nothing to sign in against.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-bone/45">
              Add it to <code className="text-bone/70">.env.local</code> for
              local use, or to the project&apos;s environment variables in
              Vercel, then reload.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
