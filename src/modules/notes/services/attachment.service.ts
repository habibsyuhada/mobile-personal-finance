// Service untuk upload lampiran (image). Best-effort: web pakai object URL,
// native akan memakai Capacitor Filesystem (akan diimplementasikan di v2).
// Untuk v1 fokus ke interface + recording di DB; file handling disederhanakan.

import type { Database } from '@/data/db/database';
import { newId, nowIso } from '@/lib/id';
import type { Attachment } from '../data/models';
import { SqliteNotesRepository } from '../data/notes.repo';

export class AttachmentService {
  private repo: SqliteNotesRepository;

  constructor(db: Database) {
    this.repo = new SqliteNotesRepository(db);
  }

  /**
   * Upload image ke page. Mengembalikan attachment row + URL untuk dirender.
   * Pada web: file dibaca sebagai data URL (object URL tidak persisten lintas reload).
   * Pada native (Capacitor): akan menyimpan ke filesystem (TODO v2).
   */
  async uploadImage(file: File | Blob, pageId: string): Promise<Attachment> {
    const filename = (file as File).name ?? `image-${Date.now()}.png`;
    const mimeType = file.type || 'image/png';
    const sizeBytes = file.size;

    // Baca sebagai data URL agar persistent di web (no plugin needed).
    const dataUrl = await readAsDataUrl(file);

    const id = newId();
    const filePath = dataUrl; // Untuk v1: data URL disimpan langsung di file_path.
    const att: Omit<Attachment, 'createdAt'> = {
      id,
      pageId,
      filename,
      mimeType,
      sizeBytes,
      filePath,
    };
    return this.repo.createAttachment(att);
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.repo.deleteAttachment(id);
  }

  async listForPage(pageId: string): Promise<Attachment[]> {
    return this.repo.listAttachments(pageId);
  }

  async totalSize(): Promise<number> {
    return this.repo.totalAttachmentSize();
  }
}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

// Default quota constant untuk UI.
export const ATTACHMENT_QUOTA_BYTES = 50 * 1024 * 1024; // 50 MB
export const ATTACHMENT_WARN_RATIO = 0.8;

export function isAttachmentWarning(totalBytes: number, quotaBytes: number = ATTACHMENT_QUOTA_BYTES): boolean {
  return totalBytes >= quotaBytes * ATTACHMENT_WARN_RATIO;
}

void nowIso; // re-export placeholder untuk konsistensi ekspor.
