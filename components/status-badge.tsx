import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

interface StatusBadgeProps {
  status: "PENDING" | "APPROVED" | "REJECTED"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<
    StatusBadgeProps["status"],
    {
      variant: "default" | "destructive" | "secondary"
      icon: React.FC<React.SVGProps<SVGSVGElement>>
      label: string
      className?: string
    }
  > = {
    PENDING: {
      variant: "secondary",
      icon: Clock,
      label: "Pending",
    },
    APPROVED: {
      variant: "default",
      icon: CheckCircle2,
      label: "Approved",
      className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    },
    REJECTED: {
      variant: "destructive",
      icon: XCircle,
      label: "Rejected",
    },
  }

  const config = variants[status]

  if (!config) return null 

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}
