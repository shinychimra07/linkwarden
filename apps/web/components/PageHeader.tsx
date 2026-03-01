import clsx from "clsx";
import React from "react";

export default function PageHeader({
  title,
  description,
  icon,
  className,
  badge,
}: {
  title: string;
  description?: string;
  icon: string;
  className?: string;
  badge?: string | number;
}) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <i className={`${icon} text-primary text-2xl drop-shadow`}></i>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-2xl capitalize font-thin">{title}</p>
          {badge !== undefined && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary/15 text-primary rounded-full min-w-[1.25rem]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-neutral">{description}</p>
        )}
      </div>
    </div>
  );
}
