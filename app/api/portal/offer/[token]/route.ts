import { NextResponse } from "next/server";
import { resolvePortal } from "@/lib/portal";
import { employeeAuthedFor } from "@/lib/employee-auth";
import { OfferLetter } from "@/models";
import { getFile } from "@/lib/gridfs";
import type { ReadableStream as WebReadableStream } from "stream/web";
import { Readable } from "stream";

export const runtime = "nodejs";

/** Stream an employee's offer-letter PDF, authorized by their onboarding token. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await resolvePortal(token);
  if (!portal.ok) return new NextResponse("Link is no longer valid", { status: 403 });
  if (!(await employeeAuthedFor(portal.employee._id.toString(), portal.instance._id.toString()))) {
    return new NextResponse("Please sign in to your portal first", { status: 401 });
  }

  const offer = await OfferLetter.findOne({ instance: portal.instance._id });
  if (!offer || offer.status === "revoked") return new NextResponse("Not found", { status: 404 });

  const file = await getFile(String(offer.fileId));
  if (!file) return new NextResponse("Not found", { status: 404 });

  const webStream = Readable.toWeb(file.stream as Readable) as unknown as WebReadableStream<Uint8Array>;
  return new NextResponse(webStream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
