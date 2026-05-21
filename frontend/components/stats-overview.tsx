"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLevelName } from "@/lib/utils";
import { Trophy, Target, Flame, Star } from "lucide-react";

// Mock stats - would come from API
const stats = {
  level: 5,
  xp: 12500,
  xpToNextLevel: 15000,
  challengesSolved: 23,
  totalChallenges: 50,
  streak: 7,
  rank: 42,
  badges: 12,
};

export function StatsOverview() {
  const xpProgress = (stats.xp / stats.xpToNextLevel) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">Level {stats.level}</span>
            <span className="text-sm text-muted-foreground">
              {getLevelName(stats.level)}
            </span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.xp} / {stats.xpToNextLevel} XP
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Challenges</p>
              <p className="text-xs text-muted-foreground">
                {stats.challengesSolved} / {stats.totalChallenges} solved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Streak</p>
              <p className="text-xs text-muted-foreground">
                {stats.streak} day{stats.streak !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Rank</p>
              <p className="text-xs text-muted-foreground">#{stats.rank}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-purple-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Badges</p>
              <p className="text-xs text-muted-foreground">
                {stats.badges} earned
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}