// Projects — every quote and project, as a list with a preview pane.
// Server fetcher hands off to the client dashboard.

import { listAllQuotes } from "@/lib/pipeline";
import { PipelineDashboard } from "@/components/pipeline/PipelineDashboard";
import { assertCanAccess } from "@/lib/page-guard";
import { canMutate } from "@/lib/authz";
import type { StageBucket } from "@/components/pipeline/types";

type SP = { deadlineRisk?: string; stage?: string; stalled?: string };

const DEADLINE_PARAMS = ["needs-attention", "overdue", "red", "yellow"] as const;

// ?stage= deep links from the home page. "active" is what the home page calls
// the signed / awaiting payment / in progress bucket.
const STAGE_PARAMS: Record<string, StageBucket> = {
  draft: "draft",
  sent: "sent",
  awaiting: "sent",
  active: "signed",
  signed: "signed",
  paid: "paid",
  lost: "lost",
  auditing: "auditing",
};

export default async function PipelinePage({ searchParams }: { searchParams?: SP }) {
  await assertCanAccess("/pipeline");
  let quotes: Awaited<ReturnType<typeof listAllQuotes>> = [];
  let error: string | null = null;
  try {
    quotes = await listAllQuotes();
  } catch (e) {
    error = (e as Error).message;
  }
  const canEdit = await canMutate();
  const deadline = DEADLINE_PARAMS.find((d) => d === searchParams?.deadlineRisk);

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {error ? (
        <div role="alert" className="bg-red-soft border border-red/30 rounded-lg p-4 text-[13px] text-red">
          Couldn’t load projects from Airtable: {error}. Refresh to try again.
        </div>
      ) : (
        <PipelineDashboard
          quotes={quotes}
          canEdit={canEdit}
          initialFilter={{
            deadlineRisk: deadline ?? "all",
            stage: STAGE_PARAMS[searchParams?.stage ?? ""] ?? "all",
            stalledOnly: searchParams?.stalled === "1",
          }}
        />
      )}
    </main>
  );
}
