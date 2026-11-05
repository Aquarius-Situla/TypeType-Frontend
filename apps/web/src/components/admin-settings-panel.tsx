import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { m } from "../paraglide/messages.js";
import type { AdminSettings } from "../types/admin";
import { AdminAccessMode, AdminTextField, AdminToggleRow } from "./admin-setting-controls";

type Props = {
  settings: AdminSettings;
  pending: boolean;
  onSave: (settings: AdminSettings) => void;
};

const SECTION = "divide-y divide-border border-t border-border";

export function AdminSettingsPanel({ settings, pending, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings],
  );
  const patch = <Key extends keyof AdminSettings>(key: Key, value: AdminSettings[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <section>
        <SectionTitle
          title={m.admin_identity_label()}
          description={m.admin_identity_description()}
        />
        <InstancePreview settings={draft} />
        <div className={`${SECTION} mt-4 grid gap-x-5 md:grid-cols-2`}>
          <AdminTextField
            label={m.admin_instance_name_label()}
            value={draft.name}
            onChange={(value) => patch("name", value)}
          />
          <AdminTextField
            label={m.admin_tagline_label()}
            value={draft.tagline ?? ""}
            onChange={(value) => patch("tagline", value || null)}
          />
          <AdminTextField
            label={m.admin_logo_url_label()}
            value={draft.logoUrl ?? ""}
            placeholder="https://..."
            onChange={(value) => patch("logoUrl", value || null)}
          />
          <AdminTextField
            label={m.admin_banner_url_label()}
            value={draft.bannerUrl ?? ""}
            placeholder="https://..."
            onChange={(value) => patch("bannerUrl", value || null)}
          />
          <AdminTextField
            label={m.admin_min_android_label()}
            value={draft.minAndroidClientVersion ?? ""}
            description={m.admin_min_android_description()}
            onChange={(value) => patch("minAndroidClientVersion", value || null)}
          />
        </div>
      </section>

      <section>
        <SectionTitle title={m.admin_access_label()} description={m.admin_access_description()} />
        <div className={SECTION}>
          <AdminAccessMode
            value={draft.accessMode}
            onChange={(value) => patch("accessMode", value)}
          />
          <AdminToggleRow
            label={m.admin_allow_registration_label()}
            description={m.admin_allow_registration_description()}
            checked={draft.allowRegistration}
            onChange={(value) => patch("allowRegistration", value)}
          />
          <AdminToggleRow
            label={m.admin_allow_guest_label()}
            description={m.admin_allow_guest_description()}
            checked={draft.allowGuest}
            onChange={(value) => patch("allowGuest", value)}
          />
          <AdminToggleRow
            label={m.admin_verified_email_label()}
            description={m.admin_verified_email_description()}
            checked={draft.forceEmailVerification}
            onChange={(value) => patch("forceEmailVerification", value)}
          />
        </div>
      </section>

      <section>
        <SectionTitle
          title={m.admin_authentication_label()}
          description={m.admin_authentication_description()}
        />
        <div className={SECTION}>
          <AdminToggleRow
            label={m.admin_local_login_label()}
            description={m.admin_local_login_description()}
            checked={draft.localLoginEnabled}
            onChange={(value) => patch("localLoginEnabled", value)}
          />
          <AdminToggleRow
            label={m.admin_oidc_label()}
            description={m.admin_oidc_description()}
            checked={draft.oidcAutoRedirect}
            onChange={(value) => patch("oidcAutoRedirect", value)}
          />
          <AdminToggleRow
            label={m.admin_device_login_label()}
            description={m.admin_device_login_description()}
            checked={draft.deviceLoginEnabled ?? true}
            onChange={(value) => patch("deviceLoginEnabled", value)}
          />
          <AdminToggleRow
            label={m.admin_track_sessions_label()}
            description={m.admin_track_sessions_description()}
            checked={draft.activeSessionsEnabled}
            onChange={(value) => patch("activeSessionsEnabled", value)}
          />
        </div>
      </section>

      <section>
        <SectionTitle
          title={m.admin_playback_label()}
          description={m.admin_playback_description()}
        />
        <div className={SECTION}>
          <AdminToggleRow
            label={m.admin_bilibili_mirror_probing_label()}
            description={m.admin_bilibili_mirror_probing_description()}
            checked={draft.bilibiliMirrorProbingEnabled ?? false}
            onChange={(value) => patch("bilibiliMirrorProbingEnabled", value)}
          />
        </div>
      </section>

      <div className="sticky bottom-3 z-10 ml-auto flex w-fit items-center gap-3 rounded-md border border-border-strong bg-surface-strong/95 p-2 shadow-xl backdrop-blur">
        {dirty && <span className="text-xs text-fg-soft">{m.admin_unsaved_changes()}</span>}
        <button
          type="submit"
          disabled={!dirty || pending}
          className="inline-flex min-h-9 items-center gap-2 rounded-md bg-fg px-3 text-sm font-medium text-app transition-colors hover:bg-fg-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="size-4" aria-hidden="true" />
          {pending ? m.admin_saving() : m.admin_save_changes()}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-3">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-0.5 text-xs text-fg-soft">{description}</p>
    </header>
  );
}

function InstancePreview({ settings }: { settings: AdminSettings }) {
  const background = settings.bannerUrl
    ? { backgroundImage: `url(${settings.bannerUrl})` }
    : undefined;
  return (
    <div
      className="relative mt-3 min-h-28 overflow-hidden rounded-md border border-border bg-surface bg-cover bg-center"
      style={background}
    >
      {settings.bannerUrl && <div className="absolute inset-0 bg-black/55" />}
      <div className="relative flex min-h-28 items-center gap-3 p-4">
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt=""
            className="size-12 rounded-md border border-white/20 bg-black object-cover"
          />
        ) : (
          <div className="grid size-12 place-items-center rounded-md bg-fg text-lg font-semibold text-app">
            T
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">
            {settings.name || "TypeType"}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-300">
            {settings.tagline || m.admin_preview_tagline()}
          </p>
        </div>
      </div>
    </div>
  );
}
