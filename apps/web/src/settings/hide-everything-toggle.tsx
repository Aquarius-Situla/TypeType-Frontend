import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ConfirmModal } from "../components/confirm-modal";
import { useSettings } from "../hooks/use-settings";
import { allowHideEverything } from "../lib/hide-everything";
import { m } from "../paraglide/messages.js";
import { ROW, ToggleSwitch } from "./settings-toggle-switch";

function hideSteps() {
  return [
    {
      title: m.ui_hide_everything_question(),
      description: m.ui_all_those_recommendations_comments_and_shorts_we_worked_so_hard_on_go(),
      confirm: m.ui_yeah_hide_it(),
    },
    {
      title: m.ui_are_you_sure(),
      description: m.ui_like_actually_sure_you_will_have_nothing_left_to_scroll(),
      confirm: m.ui_i_am_sure(),
    },
    {
      title: m.ui_are_you_sure_sure(),
      description: m.ui_we_spent_months_on_this_months_and_poof_you_want_it_gone(),
      confirm: m.ui_yes_gone(),
    },
    {
      title: m.ui_last_chance(),
      description: m.ui_okay_fine_do_not_say_we_did_not_warn_you(),
      confirm: m.ui_fine_i_ll_hide_it(),
    },
  ];
}

export function HideEverythingToggle() {
  const { update } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const current = step >= 0 ? hideSteps()[step] : null;
  const onConfirm = () => {
    if (step < hideSteps().length - 1) {
      setStep(step + 1);
      return;
    }
    update.mutate({
      hideContinueWatching: true,
      hideHomeRecommendations: true,
      hideRelatedVideos: true,
      hideEndScreens: true,
      hideComments: true,
      hideShorts: true,
      hideSubscriptionLiveStreams: true,
      hideMembersOnlyContent: true,
    });
    allowHideEverything();
    navigate({ to: "/hide-everything" });
  };
  return (
    <>
      <div className={ROW}>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-sm">{m.ui_hide_everything()}</span>
          <span className="text-fg-soft text-xs">
            {m.ui_hide_every_recommendation_comment_and_surface_at_once()}
          </span>
        </div>
        <ToggleSwitch checked={step >= 0} onClick={() => setStep(0)} />
      </div>
      {current && (
        <ConfirmModal
          title={current.title}
          description={current.description}
          confirmLabel={current.confirm}
          onConfirm={onConfirm}
          onCancel={() => setStep(-1)}
        />
      )}
    </>
  );
}
