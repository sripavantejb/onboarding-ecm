import "server-only";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { dbConnect } from "@/lib/db";

const BUCKET = "documents";

export async function getBucket(): Promise<GridFSBucket> {
  await dbConnect();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready.");
  return new GridFSBucket(db, { bucketName: BUCKET });
}

export async function uploadBuffer(
  filename: string,
  buffer: Buffer,
  metadata: Record<string, unknown>,
  contentType: string,
): Promise<ObjectId> {
  const bucket = await getBucket();
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, { metadata: { ...metadata, contentType } });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id as ObjectId));
    stream.end(buffer);
  });
}

export async function getFile(
  fileId: string,
): Promise<{ stream: NodeJS.ReadableStream; contentType: string; filename: string; length: number } | null> {
  const bucket = await getBucket();
  let _id: ObjectId;
  try {
    _id = new ObjectId(fileId);
  } catch {
    return null;
  }
  const files = await bucket.find({ _id }).toArray();
  if (files.length === 0) return null;
  const file = files[0];
  const contentType = (file.metadata?.contentType as string) || "application/octet-stream";
  return {
    stream: bucket.openDownloadStream(_id),
    contentType,
    filename: file.filename,
    length: file.length,
  };
}

export async function deleteFile(fileId: string): Promise<void> {
  const bucket = await getBucket();
  try {
    await bucket.delete(new ObjectId(fileId));
  } catch {
    /* already gone */
  }
}
