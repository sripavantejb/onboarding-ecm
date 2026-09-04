import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFile } from "@/lib/gridfs";
import type { ReadableStream as WebReadableStream } from "stream/web";
import { Readable } from "stream";

export const runtime = "nodejs";

/**
 * Serve an uploaded document. Requires an authenticated admin session — raw
 * document URLs are never public. Files live in GridFS, not on a public path.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { fileId } = await params;
  const file = await getFile(fileId);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const webStream = Readable.toWeb(file.stream as Readable) as unknown as WebReadableStream<Uint8Array>;
  return new NextResponse(webStream as unknown as BodyInit, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.length),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
