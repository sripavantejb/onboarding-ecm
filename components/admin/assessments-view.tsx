"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck, Plus, Pencil, Archive, ArchiveRestore, MoreHorizontal, Search, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createAssessment, updateAssessment, setAssessmentArchived } from "@/actions/assessments";
import type { QuestionType } from "@/types";

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple choice" },
  { value: "truefalse", label: "True / False" },
  { value: "short", label: "Short answer" },
];

export interface QuestionDTO {
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndex: number;
  correctText: string;
  points: number;
}

export interface AssessmentDTO {
  _id: string;
  title: string;
  key: string;
  description: string;
  category: string;
  passingScore: number;
  maxAttempts: number;
  questions: QuestionDTO[];
  status: "active" | "archived";
}

function blankQuestion(): QuestionDTO {
  return { type: "mcq", prompt: "", options: ["", ""], correctIndex: 0, correctText: "", points: 1 };
}

export function AssessmentsView({ assessments }: { assessments: AssessmentDTO[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<AssessmentDTO | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [archiving, setArchiving] = React.useState<AssessmentDTO | null>(null);
  const [pending, start] = React.useTransition();

  const filtered = assessments.filter((a) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  });

  function toggleArchive(a: AssessmentDTO) {
    start(async () => {
      const res = await setAssessmentArchived(a._id, a.status === "active");
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
      setArchiving(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Build quizzes employees take to confirm they understood their training."
        actions={
          <Button variant="brand" onClick={() => setCreating(true)}>
            <Plus /> New assessment
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assessments…" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments"
          description="Create an assessment to test employees during onboarding."
          action={<Button variant="brand" onClick={() => setCreating(true)}><Plus /> New assessment</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a._id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium leading-tight">{a.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{a.category}</Badge>
                    {a.status === "archived" && <Badge variant="muted"><Archive className="h-3 w-3" /> Archived</Badge>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditing(a)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                    {a.status === "active" ? (
                      <DropdownMenuItem destructive onClick={() => setArchiving(a)}><Archive className="h-4 w-4" /> Archive</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => toggleArchive(a)}><ArchiveRestore className="h-4 w-4" /> Restore</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {a.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{a.questions.length} question{a.questions.length !== 1 && "s"}</span>
                <span>·</span>
                <span>{a.passingScore}% to pass</span>
                <span>·</span>
                <span>{a.maxAttempts} attempt{a.maxAttempts !== 1 && "s"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AssessmentDialog
        open={creating || !!editing}
        assessment={editing}
        onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }}
        onDone={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(v) => !v && setArchiving(null)}
        title={`Archive ${archiving?.title}?`}
        description="Archived assessments are hidden from new onboarding tracks."
        confirmLabel="Archive"
        destructive
        loading={pending}
        onConfirm={() => { if (archiving) toggleArchive(archiving); }}
      />
    </div>
  );
}

function AssessmentDialog({
  open, assessment, onOpenChange, onDone,
}: {
  open: boolean;
  assessment: AssessmentDTO | null;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("General");
  const [description, setDescription] = React.useState("");
  const [passingScore, setPassingScore] = React.useState("70");
  const [maxAttempts, setMaxAttempts] = React.useState("3");
  const [questions, setQuestions] = React.useState<QuestionDTO[]>([]);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setTitle(assessment?.title ?? "");
      setCategory(assessment?.category ?? "General");
      setDescription(assessment?.description ?? "");
      setPassingScore(String(assessment?.passingScore ?? 70));
      setMaxAttempts(String(assessment?.maxAttempts ?? 3));
      setQuestions(assessment?.questions?.map((q) => ({ ...q, options: [...q.options] })) ?? []);
    }
  }, [open, assessment]);

  function patchQuestion(i: number, patch: Partial<QuestionDTO>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function changeType(i: number, type: QuestionType) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== i) return q;
        if (type === "truefalse") return { ...q, type, options: ["True", "False"], correctIndex: 0 };
        if (type === "short") return { ...q, type, options: [] };
        // mcq
        const options = q.options.length >= 2 ? q.options : ["", ""];
        return { ...q, type, options, correctIndex: Math.min(q.correctIndex, options.length - 1) };
      }),
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion()]);
  }
  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addOption(qi: number) {
    setQuestions((prev) => prev.map((q, idx) => (idx === qi ? { ...q, options: [...q.options, ""] } : q)));
  }
  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q,
      ),
    );
  }
  function removeOption(qi: number, oi: number) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qi) return q;
        const options = q.options.filter((_, j) => j !== oi);
        let correctIndex = q.correctIndex;
        if (oi === correctIndex) correctIndex = 0;
        else if (oi < correctIndex) correctIndex -= 1;
        return { ...q, options, correctIndex: Math.max(0, correctIndex) };
      }),
    );
  }

  function submit() {
    const payload = {
      title,
      category,
      description,
      passingScore: Number(passingScore) || 0,
      maxAttempts: Number(maxAttempts) || 1,
      questions: questions.map((q) => ({
        type: q.type,
        prompt: q.prompt.trim(),
        options: q.type === "short" ? [] : q.options,
        correctIndex: q.type === "short" ? 0 : q.correctIndex,
        correctText: q.type === "short" ? q.correctText.trim() : "",
        points: Number(q.points) || 0,
      })),
    };
    start(async () => {
      const res = assessment
        ? await updateAssessment(assessment._id, payload)
        : await createAssessment(payload);
      if (res.ok) { toast.success(res.message); onOpenChange(false); onDone(); }
      else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{assessment ? "Edit assessment" : "New assessment"}</DialogTitle>
          <DialogDescription>Add questions and set the passing score and attempt limit.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto scrollbar-thin pr-1">
          <div className="space-y-2">
            <Label htmlFor="a-title">Title</Label>
            <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Brand Guidelines Quiz" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="a-category">Category</Label>
              <Input id="a-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. General" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-pass">Passing score (%)</Label>
              <Input id="a-pass" type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-attempts">Max attempts</Label>
              <Input id="a-attempts" type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-desc">Description</Label>
            <Textarea id="a-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary of this assessment" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button variant="outline" size="sm" onClick={addQuestion}><Plus /> Add question</Button>
            </div>

            {questions.length === 0 && (
              <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                No questions yet. Add one to get started.
              </p>
            )}

            {questions.map((q, qi) => (
              <div key={qi} className="space-y-3 rounded-lg border bg-muted/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Question {qi + 1}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeQuestion(qi)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <Label className="text-xs">Type</Label>
                    <Select value={q.type} onValueChange={(v) => changeType(qi, v as QuestionType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Points</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={q.points}
                      onChange={(e) => patchQuestion(qi, { points: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Prompt</Label>
                  <Textarea
                    value={q.prompt}
                    onChange={(e) => patchQuestion(qi, { prompt: e.target.value })}
                    placeholder="Enter the question…"
                  />
                </div>

                {(q.type === "mcq" || q.type === "truefalse") && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      {q.type === "truefalse" ? "Correct answer" : "Options (select the correct one)"}
                    </Label>
                    <RadioGroup
                      value={String(q.correctIndex)}
                      onValueChange={(v) => patchQuestion(qi, { correctIndex: Number(v) })}
                    >
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <RadioGroupItem value={String(oi)} id={`q${qi}-o${oi}`} />
                          {q.type === "truefalse" ? (
                            <Label htmlFor={`q${qi}-o${oi}`} className="font-normal">{opt}</Label>
                          ) : (
                            <>
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(qi, oi, e.target.value)}
                                placeholder={`Option ${oi + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => removeOption(qi, oi)}
                                disabled={q.options.length <= 2}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                    {q.type === "mcq" && (
                      <Button variant="outline" size="sm" onClick={() => addOption(qi)}><Plus /> Add option</Button>
                    )}
                  </div>
                )}

                {q.type === "short" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Expected keyword</Label>
                    <Input
                      value={q.correctText}
                      onChange={(e) => patchQuestion(qi, { correctText: e.target.value })}
                      placeholder="e.g. confidentiality"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="brand" onClick={submit} disabled={pending || title.trim().length < 2 || category.trim().length < 1}>
            {pending ? "Saving…" : assessment ? "Save changes" : "Create assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
