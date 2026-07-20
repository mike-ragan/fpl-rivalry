import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCompletedSeasonSummaries,
  getInProgressSeasonSlugs,
  getLeague,
  getManagers,
  getRivalrySummary,
  getSeasonGameweeks,
} from "@/lib/data";
import { MANAGER_COLOR } from "@/lib/constants";

export default function Home() {
  const league = getLeague();
  const managers = getManagers();
  const { wins, ties, champion } = getRivalrySummary();
  const seasons = getCompletedSeasonSummaries().slice().reverse();
  const inProgress = getInProgressSeasonSlugs();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          {league.leagueName}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-[0.05em] text-primary uppercase">
          {managers.mike.name} vs {managers.jack.name}
        </h1>
      </header>

      {inProgress.length > 0 && (
        <Link
          href={`/season/${inProgress[0]}`}
          className="mb-6 flex items-center justify-between border border-primary bg-primary px-6 py-3 text-sm tracking-[0.1em] text-primary-foreground uppercase transition-colors hover:bg-transparent hover:text-primary"
        >
          <span>{getSeasonGameweeks(inProgress[0])?.season} is live — see the race</span>
          <span>&rarr;</span>
        </Link>
      )}

      {champion && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground uppercase">
              <Trophy className="size-4" /> Current champion 💵
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {champion.winner === "tie" ? "Tied" : managers[champion.winner].name}
            </p>
            <p className="text-sm text-muted-foreground">
              {champion.season} &middot; {champion.points.mike} — {champion.points.jack}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            All-time record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-semibold" style={{ color: MANAGER_COLOR.mike }}>
                {wins.mike}
              </p>
              <p className="text-xs text-muted-foreground">{managers.mike.name}</p>
            </div>
            <p className="text-muted-foreground">—</p>
            <div>
              <p className="text-2xl font-semibold" style={{ color: MANAGER_COLOR.jack }}>
                {wins.jack}
              </p>
              <p className="text-xs text-muted-foreground">{managers.jack.name}</p>
            </div>
            {ties > 0 && (
              <div>
                <p className="text-2xl font-semibold text-muted-foreground">{ties}</p>
                <p className="text-xs text-muted-foreground">ties</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-heading text-xs tracking-[0.2em] text-primary uppercase">
          Season by season
        </h2>
        <div className="mb-2 grid grid-cols-[6rem_1fr_5rem_12rem] gap-4 px-4 text-[0.65rem] tracking-[0.15em] text-muted-foreground uppercase">
          <span>Season</span>
          <span>Total</span>
          <span>Diff</span>
          <span>Winner</span>
        </div>
        <div className="flex flex-col gap-2">
          {seasons.map((s) => {
            const diff = Math.abs(s.points.mike - s.points.jack);
            const row = (
              <Card
                key={s.season}
                className={s.slug ? "hover:ring-primary/40 transition-colors" : undefined}
              >
                <CardContent className="grid grid-cols-[6rem_1fr_5rem_12rem] items-center gap-4">
                  <span className="text-sm font-medium">{s.season}</span>
                  <span className="text-sm text-muted-foreground">
                    {s.points.mike} — {s.points.jack}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: s.winner === "tie" ? undefined : MANAGER_COLOR[s.winner],
                    }}
                  >
                    {s.winner === "tie" ? "—" : `${diff} pt${diff === 1 ? "" : "s"}`}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        s.winner === "tie" ? undefined : MANAGER_COLOR[s.winner],
                    }}
                  >
                    {s.winner === "tie" ? "Tie" : managers[s.winner].name}
                  </span>
                </CardContent>
              </Card>
            );
            return s.slug ? (
              <Link key={s.season} href={`/season/${s.slug}`}>
                {row}
              </Link>
            ) : (
              row
            );
          })}
        </div>
      </section>
    </main>
  );
}
