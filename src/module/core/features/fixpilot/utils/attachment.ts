// Mirrors the server caps in fixpilot-be internal/modules/core/issues/service/attachment.go.
// The server is still the authority; these numbers only let the UI reject a bad
// file before spending an upload on it.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ACCEPT_ATTR = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',');

export type AttachmentRejection =
  | { reason: 'type' }
  | { reason: 'size'; kind: 'image' | 'video'; limitMb: number };

/** Returns null when the file is acceptable, or why it was rejected. */
export function checkAttachment(file: File): AttachmentRejection | null {
  const type = file.type.split(';')[0].trim().toLowerCase();

  if (ACCEPTED_IMAGE_TYPES.includes(type)) {
    return file.size > MAX_IMAGE_BYTES
      ? { reason: 'size', kind: 'image', limitMb: MAX_IMAGE_BYTES / 1024 / 1024 }
      : null;
  }
  if (ACCEPTED_VIDEO_TYPES.includes(type)) {
    return file.size > MAX_VIDEO_BYTES
      ? { reason: 'size', kind: 'video', limitMb: MAX_VIDEO_BYTES / 1024 / 1024 }
      : null;
  }
  return { reason: 'type' };
}
