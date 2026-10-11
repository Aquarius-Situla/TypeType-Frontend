import { type CreditSection, MUSIC_CREDITS, SOUND_CREDITS, VIDEO_CREDITS } from "./asset-credits";
import { DISCLAIMER, OPENING, ROLES } from "./credit-roles";
import { CODE_CREDITS, IMAGE_CREDITS, MODEL_CREDITS } from "./model-credits";

const SECTIONS: readonly CreditSection[] = [
  MUSIC_CREDITS,
  SOUND_CREDITS,
  VIDEO_CREDITS,
  MODEL_CREDITS,
  IMAGE_CREDITS,
  CODE_CREDITS,
];

export function CreditRoll() {
  return (
    <div className="mx-auto flex w-[min(92vw,40rem)] flex-col items-center gap-20 py-24 text-center text-white">
      <p className="font-serif text-3xl italic">{OPENING}</p>
      <dl className="flex flex-col gap-8">
        {ROLES.map(([role, name], index) => (
          <div key={role}>
            <dt className="text-xs uppercase tracking-[0.3em] text-white/55">{role}</dt>
            <dd
              className={`mt-1.5 font-serif text-2xl ${index % 2 === 0 ? "-rotate-2" : "rotate-1"} ${name === "Priveetee" ? "" : "text-orange-300 italic"}`}
            >
              {name}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm italic text-white/60">{DISCLAIMER}</p>
      {SECTIONS.map((section) => (
        <section key={section.heading()} className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-orange-400">
            {section.heading()}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-white/80">
            {section.credits.map(([title, author]) => (
              <li key={title}>
                {title}
                <span className="text-white/45"> · {author}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
