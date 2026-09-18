interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  PendingApproval: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Canceled: "bg-gray-100 text-gray-500",
  Issued: "bg-blue-100 text-blue-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Unpaid: "bg-orange-100 text-orange-700",
  Paid: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  PendingApproval: "Pending Approval",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
