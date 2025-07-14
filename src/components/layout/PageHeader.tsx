import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AJIcon } from "@/components/ui/aj-icon";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  breadcrumbs,
  badge,
  badgeVariant = "secondary",
  actions,
  className
}: PageHeaderProps) {
  return (
    <div className={cn(
      "bg-card/95 backdrop-blur border-b border-border shadow-card",
      className
    )}>
      <div className="container mx-auto px-lg py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-4">
            <BreadcrumbList className="text-label">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator className="mx-2" />}
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink 
                        href={crumb.href}
                        className="text-muted-foreground hover:text-accent font-poppins"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-foreground font-poppins font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Header Content */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center shadow-elevated">
                <AJIcon icon={icon} variant="white" size="lg" hover={false} />
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-header font-poppins font-bold text-foreground">
                  {title}
                </h1>
                {badge && (
                  <Badge variant={badgeVariant} className="font-poppins">
                    {badge}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-body text-muted-foreground font-poppins mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}