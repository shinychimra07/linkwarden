import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";

export default function WelcomeBanner({
  userName,
  linkCount,
  onAddLink,
}: {
  userName?: string;
  linkCount: number;
  onAddLink: () => void;
}) {
  const { t } = useTranslation();

  const greeting = getGreeting();
  const displayName = userName?.split(" ")[0] || t("there");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">
            {greeting}, {displayName}
          </h2>
          <p className="text-sm text-neutral mt-1">
            {linkCount === 0
              ? t("get_started_by_adding_first_link")
              : `${t("you_have")} ${linkCount} ${linkCount === 1 ? t("link") : t("links")} ${t("saved")}`}
          </p>
        </div>
        {linkCount === 0 && (
          <Button onClick={onAddLink} variant="accent" size="sm">
            <i className="bi-plus-lg mr-1" />
            {t("add_link")}
          </Button>
        )}
      </div>
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full" />
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full" />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
