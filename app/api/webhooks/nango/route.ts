import { createHmac, timingSafeEqual } from "node:crypto"

import {
  buildWebhookIdempotencyKey,
  claimWebhookDelivery,
  type NangoWebhookPayload,
} from "@/src/workflows/runtime/idempotency"
import { handleNangoWebhook } from "@/src/workflows/runtime/webhook-handlers"

const HMAC_HEADER = "x-nango-hmac-sha256"

function verifyNangoWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")

  try {
    const expectedBuf = Buffer.from(expected, "utf8")
    const signatureBuf = Buffer.from(signature, "utf8")
    if (expectedBuf.length !== signatureBuf.length) return false
    return timingSafeEqual(expectedBuf, signatureBuf)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const secret = process.env.NANGO_WEBHOOK_SECRET?.trim()
  if (!secret) {
    console.error("[webhook/nango] NANGO_WEBHOOK_SECRET is not configured")
    return Response.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get(HMAC_HEADER)

  if (!verifyNangoWebhookSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: NangoWebhookPayload
  try {
    payload = JSON.parse(rawBody) as NangoWebhookPayload
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const key = buildWebhookIdempotencyKey(payload)
  if (!(await claimWebhookDelivery(key))) {
    return Response.json({ ok: true, duplicate: true })
  }

  try {
    const result = await handleNangoWebhook(payload)
    return Response.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[webhook/nango] handler error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
