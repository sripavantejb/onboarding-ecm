"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Review } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  goals: z.string().max(4000).optional().default(""),
  performance: z.string().max(4000).optional().default(""),
  strengths: z.string().max(4000).optional().default(""),
  improvements: z.string().max(4000).optional().default(""),
  feedback: z.string().max(4000).optional().default(""),
  nextObjectives: z.string().max(4000).optional().default(""),
  managerComments: z.string().max(4000).optional().default(""),
  complete: z.boolean().optional().default(false),
});

export async function saveReview(reviewId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("reviews");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();
    const review = await Review.findById(reviewId);
    if (!review) return fail("Review not found.");

    Object.assign(review, {
      goals: parsed.data.goals,
      performance: parsed.data.performance,
      strengths: parsed.data.strengths,
      improvements: parsed.data.improvements,
      feedback: parsed.data.feedback,
      nextObjectives: parsed.data.nextObjectives,
      managerComments: parsed.data.managerComments,
      reviewerName: user.name,
    });
    if (parsed.data.complete) {
      review.status = "completed";
      review.completedAt = new Date();
    }
    await review.save();

    if (parsed.data.complete) {
      await logActivity({
        actorType: "admin", actorName: user.name, action: "review.completed",
        message: `Completed ${review.type}-day review`,
        employee: review.employee, instance: review.instance, resourceType: "Review", resourceId: review._id,
      });
    }
    revalidatePath(`/employees/${review.employee}`);
    revalidatePath("/reviews");
    return ok(undefined, parsed.data.complete ? `${review.type}-day review completed` : "Review saved");
  });
}
