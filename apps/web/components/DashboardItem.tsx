import clsx from "clsx";

type TrendDirection = "up" | "down" | "neutral";

export default function DashboardItem({
  name,
  value,
  icon,
  trend,
}: {
  name: string;
  value: number;
  icon: string;
  trend?: TrendDirection;
}) {
  return (
    <div
      className={clsx(
        "group flex items-center justify-between w-full rounded-xl",
        "border border-neutral-content p-4",
        "bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200",
        "hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-default"
      )}
    >
      <div className="w-14 aspect-square flex justify-center items-center bg-primary/20 rounded-xl select-none group-hover:bg-primary/30 transition-colors">
        <i className={`${icon} text-primary text-3xl drop-shadow`}></i>
      </div>
      <div className="ml-4 flex flex-col justify-center">
        <div className="flex items-center justify-end gap-1.5">
          <p className="text-neutral text-xs tracking-wider">{name}</p>
          {trend && trend !== "neutral" && (
            <i
              className={clsx(
                "text-xs",
                trend === "up" && "bi-arrow-up-short text-success",
                trend === "down" && "bi-arrow-down-short text-error"
              )}
            />
          )}
        </div>
        <p className="font-thin text-4xl text-primary mt-0.5 text-right tabular-nums">
          {value || 0}
        </p>
      </div>
    </div>
  );
}
