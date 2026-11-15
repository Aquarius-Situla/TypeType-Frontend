import {
  useAdminAllowedPlaylists,
  useAdminAllowListMutations,
} from "../hooks/use-admin-granular-allow-list";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { useAllowedChannels } from "../hooks/use-allowed-channels";
import { m } from "../paraglide/messages.js";
import { AdminAllowListChannelList } from "./admin-allow-list-channel-list";
import { AdminAllowListForm } from "./admin-allow-list-form";
import { AdminAllowListPlaylistList } from "./admin-allow-list-playlist-list";
import { AdminAllowListPlaylistSearch } from "./admin-allow-list-playlist-search";
import { AdminAllowListUsers } from "./admin-allow-list-users";
import { AdminToggleRow } from "./admin-setting-controls";

const MODE_BUTTON =
  "h-8 border border-border px-3 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  enabled: boolean;
  onToast: (message: string) => void;
};

export function AdminAllowListSection({ enabled, onToast }: Props) {
  const adminSettings = useAdminSettings(enabled);
  const { query, add, remove } = useAllowedChannels();
  const globalPlaylists = useAdminAllowedPlaylists(enabled);
  const mutations = useAdminAllowListMutations(null);
  const settings = adminSettings.query.data;
  const channels = (query.data ?? []).filter((item) => item.global === true);
  const playlists = globalPlaylists.data ?? [];
  const instanceRestricted = settings?.accessMode === "allow_list";

  function updateSetting(
    patch: {
      accessMode?: "unrestricted" | "allow_list";
      applyParentalControlsToAdmins?: boolean;
    },
    messages: { success: string; error: string },
  ) {
    if (!settings) return;
    adminSettings.update.mutate(
      { ...settings, ...patch },
      {
        onSuccess: () => onToast(messages.success),
        onError: () => onToast(messages.error),
      },
    );
  }

  if (adminSettings.query.isPending) {
    return (
      <section className="border-t border-border pt-4 text-sm text-fg-muted">
        {m.ui_loading_allow_list()}
      </section>
    );
  }

  if (!settings || adminSettings.query.isError) {
    return (
      <section className="border-t border-danger pt-4 text-sm text-danger-strong">
        {m.ui_unable_to_load_allow_list_settings()}
      </section>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section className="border-t border-border pt-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-fg">{m.ui_entire_instance()}</h2>
            <p className="text-xs text-fg-soft">
              {m.ui_restrict_everyone_to_the_admin_allow_list_including_guests()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={adminSettings.update.isPending}
              onClick={() =>
                updateSetting(
                  { accessMode: "unrestricted" },
                  {
                    success: m.ui_allow_list_mode_updated(),
                    error: m.ui_unable_to_update_mode(),
                  },
                )
              }
              className={`${MODE_BUTTON} ${!instanceRestricted ? "bg-fg text-app" : "text-fg-soft hover:text-fg"}`}
            >
              {m.admin_unrestricted_label()}
            </button>
            <button
              type="button"
              disabled={adminSettings.update.isPending}
              onClick={() =>
                updateSetting(
                  { accessMode: "allow_list" },
                  {
                    success: m.ui_allow_list_mode_updated(),
                    error: m.ui_unable_to_update_mode(),
                  },
                )
              }
              className={`${MODE_BUTTON} ${instanceRestricted ? "bg-fg text-app" : "text-fg-soft hover:text-fg"}`}
            >
              {m.ui_restrict_entire_instance()}
            </button>
          </div>
        </div>
      </section>
      <section className="border-t border-border pt-1">
        <AdminToggleRow
          label={m.admin_parental_apply_to_admins_label()}
          description={m.admin_parental_apply_to_admins_description()}
          checked={settings.applyParentalControlsToAdmins ?? false}
          disabled={adminSettings.update.isPending}
          onChange={(value) =>
            updateSetting(
              { applyParentalControlsToAdmins: value },
              {
                success: m.admin_parental_apply_to_admins_updated(),
                error: m.admin_parental_apply_to_admins_update_failed(),
              },
            )
          }
        />
      </section>
      <AdminAllowListUsers
        enabled={enabled}
        instanceRestricted={instanceRestricted}
        onToast={onToast}
      />
      <AdminAllowListForm
        title={m.ui_add_global_channel()}
        description={m.ui_search_by_channel_name_or_handle_added_channels_apply_to_every_restri()}
        trustedUrls={channels.map((item) => item.url)}
        pending={add.isPending}
        onAdd={(channel) =>
          add.mutate({
            url: channel.url,
            name: channel.name,
            thumbnailUrl: channel.thumbnailUrl,
            global: true,
          })
        }
      />
      <AdminAllowListChannelList channels={channels} onRemove={remove.mutate} />
      <AdminAllowListPlaylistSearch
        title={m.ui_add_global_playlist()}
        description={m.ui_search_playlists_by_name_added_playlists_apply_to_every_restricted_us()}
        addedUrls={playlists.map((item) => item.url)}
        pending={mutations.addGlobalPlaylist.isPending}
        onAdd={(playlist) => mutations.addGlobalPlaylist.mutate(playlist)}
      />
      <AdminAllowListPlaylistList
        title={m.ui_allowed_playlists()}
        playlists={playlists}
        onRemove={mutations.removeGlobalPlaylist.mutate}
      />
    </div>
  );
}
