export const CLOUDINARY_CLOUD  = import.meta.env.VITE_CLOUDINARY_CLOUD as string;
export const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET as string;

export async function uploadAvatar(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_PRESET);
    // NOTE: DO NOT append 'folder' here.
    // For unsigned uploads, Cloudinary requires the folder to be
    // set INSIDE the upload preset — sending it here causes 400.

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url as string);
        } catch {
          reject(new Error('Bad response from Cloudinary'));
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) msg = err.error.message;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

export function avatarUrl(url: string, size = 200): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}