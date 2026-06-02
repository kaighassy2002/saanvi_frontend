import React, { useCallback, useRef, useState } from 'react'
import {
  getCloudinaryUploadParams,
  uploadImageToCloudinary,
} from '../services/cloudinaryUpload'
import { productImageUrl } from '../../utils/cloudinaryImage'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function isAllowedFile(file) {
  if (!ACCEPT_TYPES.includes(file.type)) return 'Use JPEG, PNG, WebP, or GIF'
  if (file.size > MAX_BYTES) return 'Image must be 5 MB or smaller'
  return null
}

/**
 * Single swatch image for a colour variant.
 * @param {{ imageUrl: string, onChange: (url: string) => void, authFetch: Function, label?: string }} props
 */
export default function VariantImageUpload({ imageUrl = '', onChange, authFetch, label = 'Swatch' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

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
        const params = await getCloudinaryUploadParams(authFetch)
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
    [authFetch, onChange]
  )

  const onPick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) uploadFile(file)
  }

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <div className="flex items-start gap-2">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#e8d5c0] bg-[#f8f2e7]">
          {imageUrl ? (
            <img
              src={productImageUrl(imageUrl, 'thumb')}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
              No img
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-[10px] text-muted">
              …
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <input ref={inputRef} type="file" accept={ACCEPT_TYPES.join(',')} className="hidden" onChange={onPick} />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-[#d8c4a7] px-2 py-1 text-[11px] text-ink hover:bg-[#fdfaf6] disabled:opacity-50"
          >
            {imageUrl ? 'Change' : 'Upload'}
          </button>
          {imageUrl ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-left text-[11px] text-red-600 hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  )
}
