import { Link } from "@tanstack/react-router";
import { ArrowLeft, House } from "lucide-react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";
import { ReactionGif } from "./reaction-gif";

export function NotFoundPage() {
  useInterfaceLocale();

  return (
    <section className="fixed inset-0 z-50 flex min-h-svh flex-col items-center justify-center gap-5 overflow-y-auto bg-black px-4 py-8 text-center text-white">
      <ReactionGif kind="notFound" size={400} className="h-auto w-full max-w-[15rem]" />
      <div data-interface-copy className="max-w-sm">
        <h1 className="text-base font-semibold text-white">{m.not_found_title()}</h1>
        <p className="mt-1.5 text-sm leading-6 text-zinc-400">{m.not_found_description()}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-10 items-center gap-2 rounded-md !bg-zinc-900 px-4 text-sm font-medium !text-white transition-colors hover:!bg-zinc-700 hover:!text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {m.not_found_back()}
          </button>
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 rounded-md !bg-white px-4 text-sm font-medium !text-black transition-colors hover:!bg-zinc-200 hover:!text-black"
          >
            <House className="size-4" aria-hidden="true" />
            {m.not_found_home()}
          </Link>
        </div>
      </div>
    </section>
  );
}
