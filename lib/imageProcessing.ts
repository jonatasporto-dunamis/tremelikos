export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** se true, converte para WebP (mantém extensão caso não suporte) */
  asWebp?: boolean;
  /** tamanho máximo em bytes (default 500KB) */
  maxBytes?: number;
}

export interface ProcessedImage {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  mime: string;
  /** preview object URL */
  previewUrl: string;
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DEFAULT_MAX_BYTES = 500 * 1024;

export function validateImageType(file: File): string | null {
  if (!ALLOWED_MIMES.includes(file.type as any)) {
    return `Tipo não permitido. Use JPG, PNG ou WebP.`;
  }
  return null;
}

export function validateImageSize(file: File, maxBytes: number = DEFAULT_MAX_BYTES): string | null {
  if (file.size > maxBytes) {
    const mb = (maxBytes / 1024).toFixed(0);
    return `Arquivo muito grande. Máximo ${mb} KB.`;
  }
  return null;
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem'));
    };
    img.src = url;
  });
}

export function validateMinDimensions(
  dims: { width: number; height: number },
  min: number = 600
): string | null {
  if (dims.width < min || dims.height < min) {
    return `Resolução mínima: ${min}×${min}px. Esta imagem tem ${dims.width}×${dims.height}px.`;
  }
  return null;
}

/**
 * Redimensiona e comprime a imagem via Canvas.
 * Mantém a proporção, cabe no retângulo maxWidth×maxHeight.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<ProcessedImage> {
  const maxWidth = opts.maxWidth ?? 1200;
  const maxHeight = opts.maxHeight ?? 1200;
  const quality = opts.quality ?? 0.85;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;

  const dims = await getImageDimensions(file);
  const ratio = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
  const targetW = Math.round(dims.width * ratio);
  const targetH = Math.round(dims.height * ratio);

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // tenta WebP primeiro, cai para JPEG se não suportar
  let blob: Blob | null = null;
  let mime = file.type;
  if (opts.asWebp !== false && hasWebPSupport()) {
    mime = 'image/webp';
    blob = await canvasToBlob(canvas, 'image/webp', quality);
  }
  if (!blob) {
    mime = 'image/jpeg';
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }
  if (!blob) throw new Error('Falha ao processar imagem');

  // Se ainda passou do limite, baixa qualidade progressivamente
  let finalBlob = blob;
  let finalQuality = quality;
  while (finalBlob.size > maxBytes && finalQuality > 0.4) {
    finalQuality -= 0.1;
    finalBlob = (await canvasToBlob(canvas, mime, finalQuality)) || finalBlob;
  }

  const ext = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const fileName = `${baseName}.${ext}`;

  return {
    blob: finalBlob,
    fileName,
    width: targetW,
    height: targetH,
    mime,
    previewUrl: URL.createObjectURL(finalBlob),
  };
}

/** Recorta a imagem em formato quadrado 1:1, centralizado */
export async function cropSquare(file: File | Blob, size: number = 1200): Promise<ProcessedImage> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = Math.floor((img.naturalWidth - side) / 2);
  const sy = Math.floor((img.naturalHeight - side) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

  const mime = 'image/webp';
  const blob = (await canvasToBlob(canvas, mime, 0.9)) || (await canvasToBlob(canvas, 'image/jpeg', 0.9));
  if (!blob) throw new Error('Falha ao processar imagem');

  return {
    blob,
    fileName: 'cropped.webp',
    width: size,
    height: size,
    mime: blob.type,
    previewUrl: URL.createObjectURL(blob),
  };
}

function loadImage(src: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mime, quality);
  });
}

let webpSupport: boolean | null = null;
function hasWebPSupport(): boolean {
  if (webpSupport !== null) return webpSupport;
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const data = canvas.toDataURL('image/webp');
  webpSupport = data.startsWith('data:image/webp');
  return webpSupport;
}
