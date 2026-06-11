// Private R2 storage for compliance documents (attestation fiscale, quitus CNSS —
// company financial PII). Bina rule #1: private bucket, 15-min signed URLs,
// contractor+admin only, every access audit-logged.
//
// This module is IO glue (S3/R2 SDK) — excluded from unit coverage like the
// db query/mutations layers. Authorization happens BEFORE these are ever called
// (server action checks session + RLS scopes the row); this layer only moves bytes.

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 15-minute signed-URL expiry (Bina non-negotiable).
export const SIGNED_URL_TTL_SECONDS = 15 * 60;

// File validation — compliance docs are PDF or image scans, capped at 5 MB.
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export type FileValidation = { ok: true } | { ok: false; reason: "type" | "size" | "empty" };

export function validateUpload(mime: string, sizeBytes: number): FileValidation {
  if (sizeBytes <= 0) return { ok: false, reason: "empty" };
  if (sizeBytes > MAX_FILE_SIZE_BYTES) return { ok: false, reason: "size" };
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mime))
    return { ok: false, reason: "type" };
  return { ok: true };
}

// Structured, non-guessable private key: compliance/{contractorId}/{type}/{uuid}.{ext}
// The UUID prevents enumeration; the contractorId prefix scopes audit + lifecycle.
export function buildFileKey(contractorId: string, docType: string, mime: string): string {
  const ext = EXT_BY_MIME[mime] ?? "bin";
  return `compliance/${contractorId}/${docType}/${randomUUID()}.${ext}`;
}

// R2 is configured via env (S3-compatible). When unset (local dev / CI), storage
// degrades to a no-op so the rest of the app keeps working without leaking errors.
function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured(): boolean {
  return r2Config() !== null;
}

let cachedClient: S3Client | null = null;
function r2Client() {
  const cfg = r2Config();
  if (!cfg) return null;
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
  }
  return cachedClient;
}

// Upload bytes to the private bucket under the given key. Returns false when R2
// is not configured (the caller still records metadata so the vault works in dev).
export async function putObject(key: string, body: Buffer, mime: string): Promise<boolean> {
  const cfg = r2Config();
  const client = r2Client();
  if (!cfg || !client) return false;
  await client.send(
    new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: mime })
  );
  return true;
}

// Generate a short-lived (15-min) signed GET URL. Authorization MUST be verified
// by the caller first — this only mints the URL. Returns null when R2 is unset.
export async function generateSignedUrl(
  key: string,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  const cfg = r2Config();
  const client = r2Client();
  if (!cfg || !client) return null;
  return getSignedUrl(client, new GetObjectCommand({ Bucket: cfg.bucket, Key: key }), {
    expiresIn: ttlSeconds,
  });
}

export async function deleteObject(key: string): Promise<boolean> {
  const cfg = r2Config();
  const client = r2Client();
  if (!cfg || !client) return false;
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
  return true;
}
