"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import {
  isStepCompleted, completeStep, getPathwayCompletions,
  trackActivity, getActivity, getGlobalStats,
  fetchAndSyncProgress,
  type ActivityEvent,
} from "@/lib/pathway-progress";

import { mcqCategories } from "./mcq-data";
import { pathways, Pathway, Step } from "./pathways-data";


const difficultyClass: Record<string, string> = {
  beginner: "diff-beginner",
  intermediate: "diff-medium",
  advanced: "diff-hard",
};

const typeLabel: Record<string, string> = {
  theory: "Theory",
  lab: "Hands-on Lab",
  project: "Project",
};

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PathwaysPage() {
  const [active, setActive] = useState("sast-dast");
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);
  const [activeAssessment, setActiveAssessment] = useState<{
    categoryId: string;
    stepIdx: number;
    defaultXP: number;
  } | null>(null);

  // Fetch and synchronize progress from GORM backend on mount
  useEffect(() => {
    fetchAndSyncProgress().then(refresh);
  }, [refresh]);

  // Track page open
  useEffect(() => {
    trackActivity({ type: "pathway_opened", pathwayId: active });
  }, [active]);

  const path = pathways.find(p => p.id === active) ?? pathways[0];
  const completions = getPathwayCompletions(path.id);
  const completedSteps = completions.length;
  const progressPct = path.steps.length > 0 ? Math.round((completedSteps / path.steps.length) * 100) : 0;
  const globalStats = getGlobalStats();
  const recentActivity = getActivity(8);

  // Find next incomplete step
  const nextStepIdx = path.steps.findIndex((_, i) => !isStepCompleted(path.id, i));

  const handleCompleteStep = (stepIdx: number) => {
    const step = path.steps[stepIdx];
    if (step.assessmentCategory) {
      setActiveAssessment({
        categoryId: step.assessmentCategory,
        stepIdx,
        defaultXP: step.xp,
      });
    } else {
      completeStep(path.id, stepIdx, 0, step.xp);
      refresh();
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Learning Pathways</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structured curricula linking theory to hands-on lab practice. Your progress is tracked automatically.
          </p>
        </div>

        {/* Global stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MiniStat label="Steps Completed" value={`${globalStats.totalStepsCompleted}`} />
          <MiniStat label="Pathways Started" value={`${globalStats.pathwaysStarted}`} />
          <MiniStat
            label="Time Invested"
            value={globalStats.totalTimeSpent > 0
              ? `${Math.round(globalStats.totalTimeSpent / 60)}m`
              : "—"}
          />
          <MiniStat label="Events Tracked" value={`${globalStats.totalEvents}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar: pathway selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-2">
              {pathways.map(p => {
                const isActive = p.id === active;
                const done = getPathwayCompletions(p.id).length;
                const pct = p.steps.length > 0 ? Math.round((done / p.steps.length) * 100) : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActive(p.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-lg border transition-colors",
                      isActive
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", difficultyClass[p.difficulty])}>
                        {p.difficulty}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{done}/{p.steps.length}</span>
                    </div>
                    <p className={cn("text-sm font-semibold leading-snug", isActive ? "text-primary" : "text-foreground")}>{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.subtitle}</p>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Activity log */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h3>
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentActivity.slice(0, 6).map((evt, i) => (
                    <ActivityRow key={i} event={evt} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">

            {/* Path overview */}
            <div className="border border-border rounded-lg p-5 bg-card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{path.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{path.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Total reward</p>
                  <p className="text-lg font-bold text-primary font-mono">{path.totalXP} XP</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedSteps} of {path.steps.length} steps complete</span>
                  <span className="font-mono">{progressPct}%</span>
                </div>
                <div className="xp-bar">
                  <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              {/* Badge + completion status */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-6 w-6 rounded flex items-center justify-center font-mono text-[10px] font-bold",
                    progressPct >= 100 ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/10 text-primary"
                  )}>
                    {progressPct >= 100 ? "✓" : "B"}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {progressPct >= 100 ? (
                      <>Badge earned: <span className="text-emerald-500 font-medium">{path.badge}</span></>
                    ) : (
                      <>Completion badge: <span className="text-foreground font-medium">{path.badge}</span></>
                    )}
                  </span>
                </div>
                {nextStepIdx >= 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    Next: <span className="text-foreground font-medium">{path.steps[nextStepIdx].title}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Curriculum</h3>

              {path.steps.map((step, idx) => {
                const done = isStepCompleted(path.id, idx);
                const isNext = idx === nextStepIdx;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "border rounded-lg p-4 bg-card flex flex-col sm:flex-row sm:items-center gap-4 transition-colors",
                      done ? "border-emerald-500/20 bg-emerald-500/[0.02]" :
                      isNext ? "border-primary/30 bg-primary/[0.02]" :
                      "border-border hover:border-border/80"
                    )}
                  >
                    {/* Step number / check */}
                    <div className={cn(
                      "h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 font-mono",
                      done
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : isNext
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}>
                      {done ? "✓" : idx + 1}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{step.title}</p>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {typeLabel[step.type]}
                        </span>
                        {done && <span className="text-[10px] diff-beginner px-1.5 py-0.5 rounded">done</span>}
                        {isNext && !done && <span className="text-[10px] text-primary font-semibold">Up next</span>}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>
                    </div>

                    {/* Meta + Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground">{step.duration}</span>
                      <span className="text-[10px] font-mono text-primary font-semibold">+{step.xp} XP</span>

                      {/* Primary action */}
                      {step.challenge ? (
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/challenges/${step.challenge}`}
                            onClick={() => trackActivity({ type: "challenge_opened", challengeSlug: step.challenge, pathwayId: path.id, stepIndex: idx })}
                            className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
                          >
                            {done ? "Review Lab" : "Enter Lab"}
                          </Link>
                          {step.assessmentCategory && (
                            <Link
                              href={`/pathways/${step.assessmentCategory}`}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded font-semibold transition-colors border",
                                done
                                  ? "border-border text-muted-foreground hover:text-foreground"
                                  : "border-primary/40 text-primary hover:bg-primary/5"
                              )}
                            >
                              {done ? "Review Quiz" : "MCQ Quiz"}
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {step.assessmentCategory ? (
                            <Link
                              href={`/pathways/${step.assessmentCategory}`}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded font-semibold transition-colors border",
                                done
                                  ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/5"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
                              )}
                            >
                              {done ? "Review Quiz" : "Start Study"}
                            </Link>
                          ) : (
                            <button
                              disabled={done}
                              onClick={() => {
                                if (!done) {
                                  completeStep(path.id, idx, 0, step.xp);
                                  refresh();
                                }
                              }}
                              className={cn(
                                "text-xs px-3 py-1.5 rounded font-semibold transition-colors",
                                done
                                  ? "border border-emerald-500/30 text-emerald-500 cursor-default"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                              )}
                            >
                              {done ? "Completed" : "Start Study"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </main>
      <Footer />
      {activeAssessment && (
        <MCQAssessmentModal
          categoryId={activeAssessment.categoryId}
          stepIdx={activeAssessment.stepIdx}
          defaultXP={activeAssessment.defaultXP}
          pathwayId={path.id}
          onClose={() => setActiveAssessment(null)}
          onComplete={(earnedXP) => {
            completeStep(path.id, activeAssessment.stepIdx, 120, earnedXP);
            setActiveAssessment(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}


// ─── Sub-components ────────────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

const eventLabels: Record<ActivityEvent["type"], string> = {
  step_completed: "Completed step",
  step_started: "Started study",
  lab_started: "Started lab",
  lab_stopped: "Stopped lab",
  flag_submitted: "Submitted flag",
  pathway_opened: "Opened pathway",
  challenge_opened: "Opened challenge",
};

function ActivityRow({ event }: { event: ActivityEvent }) {
  const label = eventLabels[event.type] ?? event.type;
  const pathName = pathways.find(p => p.id === event.pathwayId)?.title;
  const detail = event.challengeSlug
    ? event.challengeSlug
    : event.stepIndex !== undefined && event.pathwayId
    ? pathways.find(p => p.id === event.pathwayId)?.steps[event.stepIndex]?.title ?? `Step ${event.stepIndex + 1}`
    : pathName ?? "";

  return (
    <div className="flex items-start gap-2">
      <div className={cn(
        "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
        event.type === "step_completed" ? "bg-emerald-500" :
        event.type === "challenge_opened" ? "bg-primary" :
        event.type === "flag_submitted" ? "bg-amber-500" :
        "bg-muted-foreground/40"
      )} />
      <div className="min-w-0">
        <p className="text-xs text-foreground font-medium leading-tight">{label}</p>
        {detail && <p className="text-[10px] text-muted-foreground truncate">{detail}</p>}
        <p className="text-[10px] text-muted-foreground/60">{formatRelative(event.timestamp)}</p>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── MCQ Interactive Self-Assessment Modal ──────────────────────────────────────

interface MCQAssessmentModalProps {
  categoryId: string;
  stepIdx: number;
  defaultXP: number;
  pathwayId: string;
  onClose: () => void;
  onComplete: (earnedXP: number) => void;
}

function MCQAssessmentModal({
  categoryId,
  stepIdx,
  defaultXP,
  pathwayId,
  onClose,
  onComplete,
}: MCQAssessmentModalProps) {
  const category = mcqCategories[categoryId];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(200);
  const [isGraduated, setIsGraduated] = useState(false);
  const [showHintMsg, setShowHintMsg] = useState(false);

  if (!category) return null;

  const question = category.questions[currentIdx];
  const isCorrectChoice = selectedIdx === question.correctIndex;

  const handleValidate = () => {
    setValidated(true);
    if (selectedIdx !== question.correctIndex) {
      // Deduct points on wrong validation (minimum floor is 50 XP)
      setScore(prev => Math.max(50, prev - 20));
    }
  };

  const handleNext = () => {
    if (currentIdx < category.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedIdx(null);
      setValidated(false);
      setShowHintMsg(false);
    } else {
      setIsGraduated(true);
    }
  };

  const triggerHint = () => {
    if (hintsUsed < question.hints.length) {
      setHintsUsed(prev => prev + 1);
      setScore(prev => Math.max(50, prev - 10)); // subtract 10 XP per hint requested
      setShowHintMsg(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl p-6 relative flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary font-mono">Interactive Self-Assessment</span>
            <h2 className="text-base font-bold text-foreground mt-0.5">{category.name}</h2>
          </div>
          <div className="flex items-center gap-2 bg-muted/60 border border-border px-3 py-1.5 rounded-lg">
            <span className="text-xs text-muted-foreground font-medium">Running Potential:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{score} XP</span>
          </div>
        </div>

        {isGraduated ? (
          <div className="text-center py-8 space-y-6 flex flex-col items-center">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30 text-3xl">
              🏆
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Assessment Complete!</h3>
              <p className="text-xs text-muted-foreground max-w-md">
                Excellent! You successfully demonstrated key DevSecOps concepts and defensive implementations for {category.name}.
              </p>
            </div>
            <div className="border border-border/80 rounded-xl p-4 bg-muted/20 w-full max-w-sm flex items-center justify-between font-mono">
              <span className="text-xs text-muted-foreground">Final Score Earned:</span>
              <span className="text-lg font-bold text-primary">+{score} XP</span>
            </div>
            <button
              onClick={() => onComplete(score)}
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow-md shadow-primary/10"
            >
              Claim XP & Progress
            </button>
          </div>
        ) : (
          <>
            {/* Progress indicators */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span>Question {currentIdx + 1} of {category.questions.length}</span>
              <div className="flex-1 flex gap-1 h-1.5 bg-muted rounded-full overflow-hidden ml-2">
                {category.questions.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "h-full flex-1 transition-colors duration-200",
                      i === currentIdx ? "bg-primary" :
                      i < currentIdx ? "bg-emerald-500" :
                      "bg-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground leading-relaxed">{question.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {question.options.map((opt: string, oIdx: number) => {
                const isSelected = selectedIdx === oIdx;
                const isCorrectOption = oIdx === question.correctIndex;
                return (
                  <button
                    key={oIdx}
                    disabled={validated && isCorrectChoice}
                    onClick={() => {
                      if (!validated || !isCorrectChoice) {
                        setSelectedIdx(oIdx);
                        setValidated(false);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-3.5 rounded-lg border text-xs leading-relaxed transition-all flex items-start gap-3",
                      isSelected && !validated
                        ? "border-primary bg-primary/[0.03] text-foreground"
                        : validated && isSelected && isCorrectOption
                        ? "border-emerald-500 bg-emerald-500/[0.04] text-emerald-400"
                        : validated && isSelected && !isCorrectOption
                        ? "border-rose-500 bg-rose-500/[0.04] text-rose-400"
                        : "border-border bg-muted/10 hover:border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "h-4 w-4 rounded-full border shrink-0 flex items-center justify-center mt-0.5",
                      isSelected
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && <span className="h-1.5 w-1.5 bg-current rounded-full" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Hint Section */}
            {showHintMsg && (
              <div className="bg-amber-500/[0.02] border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
                <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                <div>
                  <p className="font-semibold text-amber-500 font-mono text-[10px] uppercase tracking-wider">Defensive Hint</p>
                  <p className="text-muted-foreground mt-0.5 leading-snug">{question.hints[Math.min(hintsUsed - 1, question.hints.length - 1)]}</p>
                </div>
              </div>
            )}

            {/* Validation Feedback Explanation */}
            {validated && isCorrectChoice && (
              <div className="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 text-xs animate-in slide-in-from-bottom-2 duration-300">
                <span className="text-emerald-500 text-base shrink-0 mt-0.5">🛡️</span>
                <div>
                  <p className="font-semibold text-emerald-500 font-mono text-[10px] uppercase tracking-wider">Defensive Mitigation Insight</p>
                  <p className="text-muted-foreground mt-1 leading-relaxed">{question.explanation}</p>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <button
                disabled={hintsUsed >= question.hints.length || (validated && isCorrectChoice)}
                onClick={triggerHint}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5",
                  hintsUsed >= question.hints.length || (validated && isCorrectChoice)
                    ? "border-border text-muted-foreground/40 cursor-not-allowed"
                    : "border-amber-500/30 text-amber-500 hover:bg-amber-500/5"
                )}
              >
                <span>💡 Ask Hint</span>
                <span className="text-[10px] opacity-60 font-mono">(-10 XP)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>

                {validated && isCorrectChoice ? (
                  <button
                    onClick={handleNext}
                    className="text-xs px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center gap-1 shadow-md shadow-emerald-600/10"
                  >
                    <span>{currentIdx < category.questions.length - 1 ? "Next Question" : "Complete Assessment"}</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    disabled={selectedIdx === null}
                    onClick={handleValidate}
                    className={cn(
                      "text-xs px-4 py-2 rounded-lg font-semibold transition-all shadow-md",
                      selectedIdx === null
                        ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/10"
                    )}
                  >
                    Validate Option
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

