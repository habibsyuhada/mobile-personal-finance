import { z } from 'zod';

// Skema hasil ekstraksi struk dari AI (Design §7.2).
export const ReceiptItemSchema = z.object({
  name: z.string(),
  qty: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
});

export const ReceiptExtractionSchema = z.object({
  merchant: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  currency: z.string().default('IDR'),
  total: z.number().nullable().optional(),
  items: z.array(ReceiptItemSchema).default([]),
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

export interface AiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
}

const SYSTEM_PROMPT =
  'Anda adalah asisten ekstraksi data struk belanja. ' +
  'Analisis gambar struk dan balas HANYA dengan JSON valid tanpa teks lain, ' +
  'tanpa blok kode markdown. Skema: ' +
  '{"merchant": string|null, "date": string|null (format ISO YYYY-MM-DD bila bisa), ' +
  '"currency": string (mis. "IDR"), "total": number|null, ' +
  '"items": [{"name": string, "qty": number|null, "price": number|null}]}. ' +
  'Angka tanpa pemisah ribuan dan tanpa simbol mata uang.';

/** Bersihkan kemungkinan pembungkus ```json ... ``` dari respons. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

/** Ambil objek JSON pertama dari teks bebas. */
function extractJsonObject(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

export class ReceiptAiError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ReceiptAiError';
  }
}

/**
 * Panggil endpoint OpenAI-compatible dengan gambar struk (base64 data URL).
 * Mengembalikan hasil tervalidasi Zod (R5.2, R5.3).
 */
export async function extractReceipt(
  config: AiConfig,
  imageDataUrl: string,
  timeoutMs = 30000
): Promise<ReceiptExtraction> {
  if (!config.endpoint) {
    throw new ReceiptAiError('Endpoint AI belum dikonfigurasi');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${config.endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Ekstrak data dari struk ini.' },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ReceiptAiError(
        `Permintaan gagal (HTTP ${res.status}). ${body.slice(0, 200)}`
      );
    }

    const data = await res.json();
    const content: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';
    if (!content) {
      throw new ReceiptAiError('Respons AI kosong');
    }

    return parseReceiptResponse(content);
  } catch (e) {
    if (e instanceof ReceiptAiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ReceiptAiError('Waktu tunggu habis. Coba lagi atau input manual.');
    }
    throw new ReceiptAiError('Gagal menghubungi layanan AI', e);
  } finally {
    clearTimeout(timer);
  }
}

/** Parse + validasi teks respons menjadi ReceiptExtraction. Diekspor untuk diuji. */
export function parseReceiptResponse(content: string): ReceiptExtraction {
  const cleaned = extractJsonObject(stripCodeFence(content));
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new ReceiptAiError('Format respons AI tidak valid (bukan JSON).');
  }
  const parsed = ReceiptExtractionSchema.safeParse(json);
  if (!parsed.success) {
    throw new ReceiptAiError('Data hasil scan tidak sesuai format yang diharapkan.');
  }
  return parsed.data;
}
