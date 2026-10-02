"use client";

import { useRouter } from "next/navigation";
import { DeleteControl } from "@/components/ui/DeleteControl";
import { useCanDelete } from "@/components/DeletePermission";
import { setQuoteArchived } from "@/lib/mutations/quote";

/**
 * Projects have no hard delete — they carry invoices, payments and a project
 * log. Archiving takes the project off the board and leaves all of it addressable.
 * Mounted in the project drawer's sticky header, next to the close button.
 */
export function ArchiveQuoteControl({
  quoteId,
  projectName,
  onArchived,
  label = "Archive project",
  className,
}: {
  quoteId: string;
  projectName: string;
  onArchived?: () => void;
  label?: string;
  className?: string;
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
        router.refresh();
      }}
    />
  );
}
