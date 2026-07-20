import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeasonChart } from "@/components/season-chart";
import { getLeagueSeasonSlugs, getManagers, getSeasonGameweeks } from "@/lib/data";
import { MANAGER_COLOR } from "@/lib/constants";

export function generateStaticParams() {
  return getLeagueSeasonSlugs().map((season) => ({ season }));
}

function leadChangeCount(rows: { mike: number; jack: number }[]): number {
  let changes = 0;
  let lastLeader: "mike" | "jack" | "tie" | null = null;
  for (const row of rows) {
    const leader = row.mike === row.jack ? "tie" : row.mike > row.jack ? "mike" : "jack";
    if (lastLeader !== null && leader !== "tie" && leader !== lastLeader) changes += 1;
    if (leader !== "tie") lastLeader = leader;
  }
  return changes;
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season: slug } = await params;
  const season = getSeasonGameweeks(slug);
  if (!season) notFound();

  const managers = getManagers();
  const chartData = season.gameweeks.mike.map((entry, i) => ({
    event: entry.event,
    mike: entry.totalPoints,
    jack: season.gameweeks.jack[i]?.totalPoints ?? 0,
  }));

  const changes = leadChangeCount(chartData);
  const gap = Math.abs(season.points.mike - season.points.jack);
  const leader =
    season.points.mike === season.points.jack
      ? null
      : season.points.mike > season.points.jack
        ? "mike"
        : "jack";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 border border-primary px-4 py-2 text-xs tracking-[0.15em] text-primary uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <ArrowLeft className="size-3" /> Back to rivalry
      </Link>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[0.05em] text-primary uppercase">
            {season.season} season
          </h1>
          <p className="text-sm text-muted-foreground">
            {season.winner
              ? `Final: ${managers.mike.name} ${season.points.mike} — ${season.points.jack} ${managers.jack.name}`
              : `In progress: ${managers.mike.name} ${season.points.mike} — ${season.points.jack} ${managers.jack.name}`}
          </p>
        </div>
        {season.winner && season.winner !== "tie" && (
          <Badge variant="secondary" className="gap-1 uppercase tracking-[0.1em]">
            <Trophy className="size-3" />
            {managers[season.winner].name} won
          </Badge>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Cumulative points by gameweek
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SeasonChart data={chartData} managers={managers} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Current gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {gap} pt{gap === 1 ? "" : "s"}
              {leader && (
                <span
                  className="ml-2 text-sm font-normal"
                  style={{ color: MANAGER_COLOR[leader] }}
                >
                  {managers[leader].name} ahead
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Lead changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{changes}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
