"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { mcqCategories } from "../mcq-data";
import { pathways } from "../pathways-data";
import { completeStep, isStepCompleted, trackActivity } from "@/lib/pathway-progress";

export default function MCQRoomPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;

  const category = mcqCategories[categoryId];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(200);
  const [isGraduated, setIsGraduated] = useState(false);
  const [showHintMsg, setShowHintMsg] = useState(false);

  // Track room open
  useEffect(() => {
    if (category) {
      trackActivity({
        type: "step_started",
        metadata: { categoryId, categoryName: category.name }
      });
    }
  }, [categoryId, category]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-screen-md mx-auto w-full px-6 py-16 text-center space-y-6">
          <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/30 text-3xl mx-auto">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Assessment Room Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The requested self-assessment module path <code>{categoryId}</code> could not be located in our curricula.
            </p>
          </div>
          <Link
            href="/pathways"
            className="inline-block px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all"
          >
            Return to Pathways
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Find step in pathways matching this categoryId
  let foundPathwayId = "";
  let foundStepIdx = -1;
  let foundXP = 200;

  for (const path of pathways) {
    const idx = path.steps.findIndex(s => s.assessmentCategory === categoryId);
    if (idx !== -1) {
      foundPathwayId = path.id;
      foundStepIdx = idx;
      foundXP = path.steps[idx].xp;
      break;
    }
  }

  const question = category.questions[currentIdx];
  const isCorrectChoice = selectedIdx === question.correctIndex;

  const handleValidate = () => {
    setValidated(true);
    if (selectedIdx !== question.correctIndex) {
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
      setScore(prev => Math.max(50, prev - 10));
      setShowHintMsg(true);
    }
  };

  const handleClaim = () => {
    if (foundPathwayId !== "" && foundStepIdx !== -1) {
      const wasCompleted = isStepCompleted(foundPathwayId, foundStepIdx);
      if (!wasCompleted) {
        completeStep(foundPathwayId, foundStepIdx, 120, score);
      }
    }
    router.push("/pathways");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        
        {/* Navigation breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Link href="/pathways" className="hover:text-primary transition-colors">Pathways</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Self-Assessment</span>
        </div>

        {/* Hero title banner */}
        <div className="border border-border rounded-xl p-6 bg-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary font-mono">Interactive Self-Assessment Room</span>
            <h1 className="text-xl font-bold text-foreground mt-1">{category.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              Demonstrate secure development strategies and mitigate high-impact coding vulnerabilities in this focused laboratory sandbox.
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-muted/40 border border-border/80 px-4 py-2.5 rounded-xl shrink-0 self-start md:self-auto">
            <span className="text-xs text-muted-foreground font-medium font-mono">Available Reward:</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{score} XP</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main MCQ layout */}
          <div className="lg:col-span-2 space-y-5">
            {isGraduated ? (
              <div className="border border-emerald-500/20 bg-emerald-500/[0.01] rounded-xl p-8 text-center space-y-6 flex flex-col items-center shadow-lg">
                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30 text-3xl">
                  🏆
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Assessment Graduated!</h3>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Excellent work! You successfully resolved all secure coding scenarios and validated proper mitigations for <strong>{category.name}</strong>.
                  </p>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card/60 w-full max-w-sm flex items-center justify-between font-mono">
                  <span className="text-xs text-muted-foreground">Final Score Earned:</span>
                  <span className="text-lg font-bold text-primary">+{score} XP</span>
                </div>
                <button
                  onClick={handleClaim}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow-md shadow-primary/10"
                >
                  Claim Score & Exit Room
                </button>
              </div>
            ) : (
              <div className="border border-border rounded-xl p-6 bg-card space-y-6">
                
                {/* Progress Indicators */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>Question {currentIdx + 1} of {category.questions.length}</span>
                  <div className="flex-1 flex gap-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    {category.questions.map((_, i) => (
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

                {/* Question */}
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{question.question}</p>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {question.options.map((opt, oIdx) => {
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
                          "w-full text-left p-4 rounded-lg border text-xs leading-relaxed transition-all flex items-start gap-3",
                          isSelected && !validated
                            ? "border-primary bg-primary/[0.02] text-foreground"
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

                {/* Hint Alert Block */}
                {showHintMsg && (
                  <div className="bg-amber-500/[0.01] border border-amber-500/20 rounded-xl p-4 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
                    <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                    <div>
                      <p className="font-semibold text-amber-500 font-mono text-[10px] uppercase tracking-wider">Defensive Hint</p>
                      <p className="text-muted-foreground mt-0.5 leading-snug">{question.hints[Math.min(hintsUsed - 1, question.hints.length - 1)]}</p>
                    </div>
                  </div>
                )}

                {/* Mitigation Alert Block */}
                {validated && isCorrectChoice && (
                  <div className="bg-emerald-500/[0.01] border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 text-xs animate-in slide-in-from-bottom-2 duration-300">
                    <span className="text-emerald-500 text-base shrink-0 mt-0.5">🛡️</span>
                    <div>
                      <p className="font-semibold text-emerald-500 font-mono text-[10px] uppercase tracking-wider">Defensive Mitigation Insight</p>
                      <p className="text-muted-foreground mt-1 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <button
                    disabled={hintsUsed >= question.hints.length || (validated && isCorrectChoice)}
                    onClick={triggerHint}
                    className={cn(
                      "text-xs px-3.5 py-2 rounded-lg border font-semibold transition-all flex items-center gap-1.5",
                      hintsUsed >= question.hints.length || (validated && isCorrectChoice)
                        ? "border-border text-muted-foreground/30 cursor-not-allowed"
                        : "border-amber-500/20 text-amber-500 hover:bg-amber-500/5"
                    )}
                  >
                    <span>💡 Ask Hint</span>
                    <span className="text-[10px] opacity-60 font-mono">(-10 XP)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/pathways"
                      className="text-xs px-3.5 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all"
                    >
                      Exit Room
                    </Link>

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
                            ? "bg-muted text-muted-foreground/30 cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/10"
                        )}
                      >
                        Validate Option
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Sidebar Guidelines */}
          <div className="space-y-4">
            
            <div className="border border-border rounded-xl p-5 bg-card space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">Self-Assessment Rules</h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground list-disc pl-4 leading-relaxed">
                <li>Every self-assessment category begins with a running potential score of <strong>200 XP</strong>.</li>
                <li>Choosing an incorrect option and validating will deduct <strong>-20 XP</strong> from the reward potential.</li>
                <li>Requesting a defensive hint will deduct <strong>-10 XP</strong> from the reward potential.</li>
                <li>A floor limit of <strong>50 XP</strong> is guaranteed even in the case of multiple wrong trials.</li>
                <li>Completing all questions successfully will save your secure progress to your local storage and the database dynamically.</li>
              </ul>
            </div>

            <div className="border border-border rounded-xl p-5 bg-card space-y-3 font-mono">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Module Metadata</h4>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Category Key:</span>
                  <span className="text-foreground font-semibold">{categoryId}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="text-foreground font-semibold">{category.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mapped Pathway:</span>
                  <span className="text-foreground font-semibold">{foundPathwayId || "owasp"}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
}
