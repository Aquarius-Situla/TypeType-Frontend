import { m } from "../paraglide/messages.js";
import type { RecommenderAdminFeedback, RecommenderAdminStatus } from "../types/admin";

type Props = {
  feedback: RecommenderAdminFeedback;
  algorithms: RecommenderAdminStatus["algorithms"];
};

export function AdminRecommenderFeedback({ feedback, algorithms }: Props) {
  const nameOf = (id: string) =>
    id === ""
      ? m.admin_recommender_default_auto()
      : (algorithms.find((algorithm) => algorithm.id === id)?.name ?? id);
  const ids = [
    ...new Set([
      ...Object.keys(feedback.usersByAlgorithm),
      ...feedback.verdicts.map((verdict) => verdict.algorithmId),
    ]),
  ];
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-sm font-semibold text-fg">
        {m.admin_recommender_users({ count: feedback.usersEnabled })}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-fg-soft">
            <tr className="border-y border-border">
              <th className="px-1 py-2 font-medium">{m.admin_recommender_algorithm()}</th>
              <th className="px-1 py-2 font-medium">{m.admin_recommender_chosen()}</th>
              <th className="px-1 py-2 font-medium">{m.algo_feedback_good()}</th>
              <th className="px-1 py-2 font-medium">{m.algo_feedback_bad()}</th>
              <th className="px-1 py-2 font-medium">{m.algo_feedback_not_for_me()}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums text-fg">
            {ids.map((id) => {
              const verdict = feedback.verdicts.find((item) => item.algorithmId === id);
              return (
                <tr key={id} className="border-b border-border">
                  <td className="px-1 py-2">{nameOf(id)}</td>
                  <td className="px-1 py-2">{feedback.usersByAlgorithm[id] ?? 0}</td>
                  <td className="px-1 py-2">{verdict?.good ?? 0}</td>
                  <td className="px-1 py-2">{verdict?.bad ?? 0}</td>
                  <td className="px-1 py-2">{verdict?.notForMe ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {feedback.comments.length > 0 && (
        <ul className="divide-y divide-border border-y border-border">
          {feedback.comments.map((comment) => (
            <li key={`${comment.createdAt}-${comment.comment}`} className="px-1 py-2">
              <p className="text-sm text-fg">{comment.comment}</p>
              <p className="mt-0.5 text-xs text-fg-soft">
                {comment.verdict === "good" ? m.algo_feedback_good() : m.algo_feedback_bad()}
                {" · "}
                {nameOf(comment.algorithmId)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
