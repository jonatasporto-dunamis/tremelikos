'use client';

import { useEffect, useRef, useState } from 'react';
import {
  compressImage,
  cropSquare,
  validateImageType,
  validateImageSize,
  validateMinDimensions,
  getImageDimensions,
  type ProcessedImage,
} from '@/lib/imageProcessing';

interface Props {
  value?: string | null;
  onChange: (path: string | null) => void;
  productId: string;
  label?: string;
  /** se true, força crop 1:1 antes de upload */
  forceSquare?: boolean;
}

export default function ProductImageUploader({
  value,
  onChange,
  productId,
  label = 'Imagem do produto',
  forceSquare = true,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0, size: 100 });
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (processed?.previewUrl) URL.revokeObjectURL(processed.previewUrl);
    };
  }, [originalPreview, processed]);

  const handleFile = async (file: File) => {
    setError(null);
    setProcessed(null);
    let err = validateImageType(file);
    if (err) { setError(err); return; }
    err = validateImageSize(file);
    if (err) { setError(err); return; }
    const dims = await getImageDimensions(file);
    err = validateMinDimensions(dims, 600);
    if (err) { setError(err); return; }

    setOriginalDims({ w: dims.width, h: dims.height });
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(URL.createObjectURL(file));
    // Crop 1:1 + compressão WebP
    try {
      const cropped = await cropSquare(file, 1200);
      const final = await compressImage(
        new File([cropped.blob], cropped.fileName, { type: cropped.mime }),
        { asWebp: true, maxBytes: 450 * 1024, quality: 0.85 }
      );
      setProcessed(final);
    } catch (e: any) {
      setError(e?.message || 'Erro ao processar imagem');
    }
  };

  const handleUpload = async () => {
    if (!processed) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const path = `products/${productId}/${Date.now()}-${processed.fileName}`;
      const formData = new FormData();
      formData.append('file', processed.blob, processed.fileName);
      formData.append('path', path);
      // upload via XHR para tracking de progresso
      const stored = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/upload-image');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              setProgress(100);
              resolve(json.path);
            } catch (e) { reject(new Error('Resposta inválida do servidor')); }
          } else {
            try {
              const json = JSON.parse(xhr.responseText);
              reject(new Error(json.error || `HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Erro de rede'));
        xhr.send(formData);
      });
      onChange(stored);
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar');
    } finally {
      setUploading(false);
    }
  };

  const cropStyle: React.CSSProperties = forceSquare && originalDims
    ? {
        position: 'absolute',
        left: `${cropOffset.x}%`,
        top: `${cropOffset.y}%`,
        width: `${cropOffset.size}%`,
        height: `${cropOffset.size}%`,
        border: '2px solid white',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        pointerEvents: 'none',
      }
    : { display: 'none' };

  // preview de tamanho para o crop offset
  const previewBox = { w: 300, h: 300 };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {value ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
            <img
              src={`/api/image?path=${encodeURIComponent(value)}`}
              alt="preview"
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 font-medium truncate">{value}</p>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-xs text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-brand-soft file:text-brand-text hover:file:bg-brand-soft/70"
          />
          <p className="text-xs text-gray-500 mt-1">
            JPG/PNG/WebP · 600×600 mínimo · até 500KB. Será convertida para WebP e cortada 1:1.
          </p>
        </div>
      )}

      {originalPreview && (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-medium text-gray-700">Pré-visualização do crop 1:1:</p>
          <div
            className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
            style={{ width: previewBox.w, height: previewBox.h }}
          >
            <img
              src={originalPreview}
              alt="origem"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'brightness(0.4)' }}
            />
            <div style={cropStyle} aria-hidden="true" />
            {/* imagem já cortada em preview */}
            {processed && (
              <img
                src={processed.previewUrl}
                alt="resultado"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
          {forceSquare && originalDims && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1">
                Posição X
                <input
                  type="range"
                  min={0}
                  max={100 - cropOffset.size}
                  value={cropOffset.x}
                  onChange={(e) => setCropOffset((p) => ({ ...p, x: Number(e.target.value) }))}
                  className="w-24"
                />
              </label>
              <label className="flex items-center gap-1">
                Posição Y
                <input
                  type="range"
                  min={0}
                  max={100 - cropOffset.size}
                  value={cropOffset.y}
                  onChange={(e) => setCropOffset((p) => ({ ...p, y: Number(e.target.value) }))}
                  className="w-24"
                />
              </label>
              <label className="flex items-center gap-1">
                Tamanho
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={cropOffset.size}
                  onChange={(e) => {
                    const s = Number(e.target.value);
                    setCropOffset((p) => ({
                      ...p,
                      size: s,
                      x: Math.min(p.x, 100 - s),
                      y: Math.min(p.y, 100 - s),
                    }));
                  }}
                  className="w-24"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {processed && !value && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            {processed.width}×{processed.height}px · {(processed.blob.size / 1024).toFixed(0)}KB · {processed.mime}
          </p>
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2" aria-label="Progresso de upload">
              <div
                className="bg-brand h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {uploading ? `Enviando ${progress}%...` : 'Enviar imagem'}
            </button>
            <button
              type="button"
              onClick={() => { setProcessed(null); setOriginalPreview(null); setError(null); }}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
