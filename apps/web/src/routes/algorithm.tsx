import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChartPie,
  Database,
  ListVideo,
  MessageSquareText,
  Signpost,
  UserRound,
  Wrench,
} from "lucide-react";
import { AlgorithmBackstage } from "../components/algorithm/algorithm-backstage";
import { AlgorithmChoice } from "../components/algorithm/algorithm-choice";
import { AlgorithmData } from "../components/algorithm/algorithm-data";
import { AlgorithmFeedback } from "../components/algorithm/algorithm-feedback";
import { AlgorithmGuide } from "../components/algorithm/algorithm-guide";
import { Notice } from "../components/algorithm/algorithm-notice";
import { AlgorithmOverview } from "../components/algorithm/algorithm-overview";
import { AlgorithmProfile } from "../components/algorithm/algorithm-profile";
import { SectionShell, type SectionShellItem } from "../components/section-shell";
import { useInstance } from "../hooks/use-instance";
import { useRecommender } from "../hooks/use-recommender";
import {
  type AlgorithmSection,
  type AlgorithmTarget,
  isAlgorithmSection,
} from "../lib/algorithm-sections";
import { m } from "../paraglide/messages.js";
import { useAlgorithmHighlightStore } from "../stores/algorithm-highlight-store";

function items(): SectionShellItem<AlgorithmSection>[] {
  return [
    {
      key: "overview",
      label: m.algo_section_overview(),
      description: m.algo_section_overview_description(),
      icon: ChartPie,
    },
    {
      key: "algorithm",
      label: m.algo_section_algorithm(),
      description: m.algo_section_algorithm_description(),
      icon: ListVideo,
    },
    {
      key: "guide",
      label: m.algo_section_guide(),
      description: m.algo_section_guide_description(),
      icon: Signpost,
    },
    {
      key: "data",
      label: m.algo_section_data(),
      description: m.algo_section_data_description(),
      icon: Database,
    },
    {
      key: "profile",
      label: m.algo_section_profile(),
      description: m.algo_section_profile_description(),
      icon: UserRound,
    },
    {
      key: "backstage",
      label: m.algo_section_backstage(),
      description: m.algo_section_backstage_description(),
      icon: Wrench,
    },
    {
      key: "feedback",
      label: m.algo_section_feedback(),
      description: m.algo_section_feedback_description(),
      icon: MessageSquareText,
    },
  ];
}

function AlgorithmPage() {
  const { section, category } = Route.useSearch();
  const navigate = useNavigate({ from: "/algorithm" });
  const instance = useInstance();
  const recommender = useRecommender();
  const setHighlight = useAlgorithmHighlightStore((state) => state.setHighlight);

  if (instance.isLoading || recommender.isLoading) return <Notice text={m.ui_loading()} />;
  if (!recommender.available) return <Notice text={m.algo_not_available()} />;
  if (recommender.isRetrying && !recommender.current) return <Notice text={m.ui_loading()} />;
  if (recommender.isError || !recommender.current)
    return (
      <Notice
        text={m.algo_unreachable()}
        action={{ label: m.ui_retry(), run: recommender.retry }}
      />
    );

  const open = (target: AlgorithmTarget) => {
    setHighlight(target.highlight ?? null);
    navigate({ search: { section: target.section, category: target.category } });
    if (!target.highlight) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <SectionShell
      title={m.algo_title()}
      subtitle={m.algo_subtitle()}
      items={items()}
      active={section}
      onSelect={(next) => open({ section: next })}
    >
      <div key={`${section}/${category ?? ""}`} className="algorithm-enter">
        {section === "overview" && <AlgorithmOverview recommender={recommender} onOpen={open} />}
        {section === "algorithm" && (
          <AlgorithmChoice recommender={recommender} onOpen={(next) => open({ section: next })} />
        )}
        {section === "guide" && <AlgorithmGuide recommender={recommender} />}
        {section === "data" && (
          <AlgorithmData
            recommender={recommender}
            category={category}
            onOpen={(id) => open({ section: "data", category: id })}
          />
        )}
        {section === "profile" && <AlgorithmProfile recommender={recommender} />}
        {section === "backstage" && <AlgorithmBackstage recommender={recommender} />}
        {section === "feedback" && <AlgorithmFeedback recommender={recommender} />}
      </div>
    </SectionShell>
  );
}

export const Route = createFileRoute("/algorithm")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { section: AlgorithmSection; category?: string } => {
    const section = isAlgorithmSection(search.section) ? search.section : "algorithm";
    const category =
      section === "data" && typeof search.category === "string" ? search.category : undefined;
    return { section, category };
  },
  component: AlgorithmPage,
});
