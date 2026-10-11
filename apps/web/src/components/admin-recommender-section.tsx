import { useEffect, useState } from "react";
import { useAdminRecommender } from "../hooks/use-admin-recommender";
import { useAdminSettings } from "../hooks/use-admin-settings";
import { m } from "../paraglide/messages.js";
import type { AdminSettings } from "../types/admin";
import { AdminRecommenderFeedback } from "./admin-recommender-feedback";
import { AdminRecommenderPolicy } from "./admin-recommender-policy";
import { AdminRecommenderStatus } from "./admin-recommender-status";

type Props = { enabled: boolean; onToast: (message: string) => void };

export function AdminRecommenderSection({ enabled, onToast }: Props) {
  const settings = useAdminSettings(enabled);
  const { status, feedback } = useAdminRecommender(enabled);
  const [draft, setDraft] = useState<AdminSettings | null>(null);
  useEffect(() => {
    if (settings.query.data) setDraft(settings.query.data);
  }, [settings.query.data]);

  if (!draft || !status.data) {
    const failed = settings.query.isError || status.isError;
    return (
      <p className="px-1 text-sm text-fg-muted">
        {failed ? m.ui_unable_to_load_admin_settings_2() : m.ui_loading_admin_settings()}
      </p>
    );
  }
  const save = () =>
    settings.update.mutate(draft, {
      onSuccess: () => onToast(m.ui_admin_settings_updated()),
      onError: () => onToast(m.ui_unable_to_update_admin_settings()),
    });

  return (
    <div className="space-y-8">
      <AdminRecommenderStatus status={status.data} />
      <AdminRecommenderPolicy
        value={draft}
        saved={settings.query.data ?? draft}
        algorithms={status.data.algorithms}
        pending={settings.update.isPending}
        onChange={setDraft}
        onSave={save}
      />
      {feedback.data && (
        <AdminRecommenderFeedback feedback={feedback.data} algorithms={status.data.algorithms} />
      )}
    </div>
  );
}
