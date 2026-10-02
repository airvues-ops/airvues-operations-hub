"use client";

import { useRouter } from "next/navigation";
import { DeleteControl } from "@/components/ui/DeleteControl";
import { useCanDelete } from "@/components/DeletePermission";
import { setQuoteArchived } from "@/lib/mutations/quote";

/**
 * Projects have no hard delete — they carry invoices, payments and a project
 * log. Archiving takes the project off the board and leaves all of it addressable.
 * Mounted in the project page header and the project drawer's header.
 */
export function ArchiveQuoteControl({
  quoteId,
  projectName,
  onArchived,
  label = "Archive project",
  className,
  redirectTo,
}: {
  quoteId: string;
  projectName: string;
  onArchived?: () => void;
  label?: string;
  className?: string;
  /** Navigate here after archiving (an archived project's own page 404s). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const canDelete = useCanDelete();
  if (!canDelete) return null;

  return (
    <DeleteControl
      variant="archive"
      label={label}
      className={className}
      question={`Archive "${projectName}"?`}
      confirmLabel="Yes, archive"
      consequence="Leaves the Projects board; stories and invoices stay. Restore from the Archive page."
      onConfirm={() => setQuoteArchived(quoteId, true)}
      onDone={() => {
        onArchived?.();
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      }}
    />
  );
}
