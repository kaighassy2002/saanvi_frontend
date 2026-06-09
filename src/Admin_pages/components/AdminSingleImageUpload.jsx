import React, { useCallback, useRef, useState } from 'react'
import {
  getCloudinaryUploadParams,
  uploadImageToCloudinary,
} from '../services/cloudinaryUpload'
import { productImageUrl } from '../../utils/cloudinaryImage'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const PREVIEW_PRESET = {
  product: 'adminPreview',
  hero: 'hero',
  category: 'category',
  promo: 'promo',
}

function isAllowedFile(file) {
  if (!ACCEPT_TYPES.includes(file.type)) return 'Use JPEG, PNG, WebP, or GIF'
  if (file.size > MAX_BYTES) return 'Image must be 5 MB or smaller'
  return null
}

/**
 * Single-image Cloudinary uploader for admin (hero, category, etc.).
 * @param {{
 *   imageUrl: string,
 *   onChange: (url: string) => void,
 *   authFetch: Function,
 *   purpose?: 'product' | 'hero' | 'category' | 'promo',
 *   label?: string,
 *   hint?: string,
 *   allowUrl?: boolean,
 *   previewClassName?: string,
 * }} props
 */
export default function AdminSingleImageUpload({
  imageUrl = '',
  onChange,
  authFetch,
  purpose = 'product',
  label = 'Image',
  hint = '',
  allowUrl = true,
  previewClassName = '',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const previewPreset = PREVIEW_PRESET[purpose] || 'adminPreview'

  const uploadFile = useCallback(
    async (file) => {
      const validationError = isAllowedFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setUploading(true)
      setError('')
      try {
        const params = await getCloudinaryUploadParams(authFetch, purpose)
        const result = await uploadImageToCloudinary(file, {
          cloudName: params.cloudName,
          apiKey: params.apiKey,
          signature: params.signature,
          timestamp: params.timestamp,
          folder: params.folder,
          transformation: params.transformation,
        })
        onChange(result.secureUrl)
      } catch (err) {
        setError(err?.message || 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [authFetch, onChange, purpose]
  )

  const onPick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) uploadFile(file)
  }

  const previewClass =
    previewClassName ||
    (purpose === 'hero'
      ? 'aspect-[4/5] w-full max-w-[10rem]'
      : purpose === 'category'
        ? 'h-20 w-20 rounded-full'
        : 'h-24 w-20')

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted">{label}</p>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={`relative shrink-0 overflow-hidden border border-[#e8d5c0] bg-[#f8f2e7] ${previewClass}`}
        >
          {imageUrl ? (
            <img
              src={productImageUrl(imageUrl, previewPreset)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[5rem] w-full items-center justify-center text-[11px] text-muted">
              No image
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/85 text-xs text-muted">
              Uploading…
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_TYPES.join(',')}
            className="hidden"
            onChange={onPick}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-fit rounded-lg border border-[#d8c4a7] px-3 py-1.5 text-xs text-ink hover:bg-[#fdfaf6] disabled:opacity-50"
          >
            {imageUrl ? 'Replace image' : 'Upload image'}
          </button>
          {imageUrl ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="w-fit text-left text-xs text-red-700 hover:underline"
            >
              Remove
            </button>
          ) : null}
          {allowUrl ? (
            <input
              className="w-full rounded-lg border border-[#e8d5c0] bg-white px-3 py-2 text-xs"
              placeholder="Or paste image URL"
              value={imageUrl}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : null}
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
