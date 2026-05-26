import React, { useCallback, useRef, useState } from 'react'
import {
  getCloudinaryUploadParams,
  uploadImageToCloudinary,
} from '../services/cloudinaryUpload'

const MAX_IMAGES = 10
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function isAllowedFile(file) {
  if (!ACCEPT_TYPES.includes(file.type)) {
    return 'Use JPEG, PNG, WebP, or GIF'
  }
  if (file.size > MAX_BYTES) {
    return 'Each image must be 5 MB or smaller'
  }
  return null
}

/**
 * @param {{ images: string[], onChange: (urls: string[]) => void, authFetch: Function, error?: string }} props
 */
export default function ProductImageUpload({ images, onChange, authFetch, error: externalError }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [configError, setConfigError] = useState('')
  const [pending, setPending] = useState([])

  const totalCount = images.length + pending.length
  const canAddMore = totalCount < MAX_IMAGES

  const updatePending = useCallback((tempId, patch) => {
    setPending((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item))
    )
  }, [])

  const removePending = useCallback((tempId) => {
    setPending((prev) => {
      const item = prev.find((p) => p.tempId === tempId)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.tempId !== tempId)
    })
  }, [])

  const uploadOne = useCallback(
    async (tempId, file) => {
      try {
        const params = await getCloudinaryUploadParams(authFetch)
        setConfigError('')
        const result = await uploadImageToCloudinary(file, {
          cloudName: params.cloudName,
          apiKey: params.apiKey,
          signature: params.signature,
          timestamp: params.timestamp,
          folder: params.folder,
        }, (percent) => {
          updatePending(tempId, { progress: percent })
        })
        onChange((prev) => [...prev, result.secureUrl])
        removePending(tempId)
      } catch (err) {
        const message = err?.message || 'Upload failed'
        if (message.includes('not configured') || message.includes('503')) {
          setConfigError(message)
        }
        updatePending(tempId, { status: 'error', error: message, progress: 0 })
      }
    },
    [authFetch, onChange, removePending, updatePending]
  )

  const processFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || [])
      if (!files.length) return

      let slotsLeft = MAX_IMAGES - images.length - pending.length
      if (slotsLeft <= 0) {
        setConfigError(`Maximum ${MAX_IMAGES} images per product`)
        return
      }

      const toQueue = []
      for (const file of files) {
        if (slotsLeft <= 0) break
        const validationError = isAllowedFile(file)
        if (validationError) {
          setConfigError(validationError)
          continue
        }
        const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
        toQueue.push({
          tempId,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'uploading',
          file,
        })
        slotsLeft -= 1
      }

      if (!toQueue.length) return
      setConfigError('')
      setPending((prev) => [...prev, ...toQueue])
      toQueue.forEach(({ tempId, file }) => uploadOne(tempId, file))
    },
    [images.length, pending.length, uploadOne]
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (!canAddMore) return
    processFiles(e.dataTransfer.files)
  }

  const handleRemoveUrl = (url) => {
    onChange((prev) => prev.filter((u) => u !== url))
  }

  const retryUpload = (item) => {
    if (!item.file) return
    updatePending(item.tempId, { status: 'uploading', progress: 0, error: '' })
    uploadOne(item.tempId, item.file)
  }

  const displayError = externalError || configError

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-muted">Product images *</label>
        <span className="text-xs text-muted">
          {images.length} saved
          {pending.length ? ` · ${pending.length} uploading` : ''} · max {MAX_IMAGES}
        </span>
      </div>

      {(images.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[#e8d5c0] bg-[#f8f2e7]"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveUrl(url)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                aria-label="Remove image"
              >
                Remove
              </button>
            </li>
          ))}
          {pending.map((item) => (
            <li
              key={item.tempId}
              className="relative aspect-square overflow-hidden rounded-lg border border-[#e8d5c0] bg-[#f8f2e7]"
            >
              <img src={item.preview} alt="" className="h-full w-full object-cover opacity-80" />
              {item.status === 'uploading' ? (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-2">
                  <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="text-center text-[10px] text-white">{item.progress}%</p>
                </div>
              ) : null}
              {item.status === 'error' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 p-2">
                  <p className="text-center text-[10px] text-white">{item.error}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => retryUpload(item)}
                      className="rounded bg-white px-2 py-0.5 text-[10px] text-ink"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => removePending(item.tempId)}
                      className="rounded bg-red-600 px-2 py-0.5 text-[10px] text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
              {item.status === 'uploading' ? (
                <button
                  type="button"
                  onClick={() => removePending(item.tempId)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                  aria-label="Cancel upload"
                >
                  Cancel
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (canAddMore) inputRef.current?.click()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          if (canAddMore) setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (canAddMore) setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false)
        }}
        onDrop={handleDrop}
        onClick={() => canAddMore && inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          !canAddMore
            ? 'cursor-not-allowed border-[#e8d5c0]/60 bg-[#faf6ef] opacity-60'
            : dragOver
              ? 'cursor-pointer border-gold bg-[#f8f2e7]'
              : 'cursor-pointer border-[#e8d5c0] bg-white hover:border-gold hover:bg-[#faf6ef]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_TYPES.join(',')}
          multiple
          className="sr-only"
          disabled={!canAddMore}
          onChange={(e) => {
            processFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <p className="text-sm font-medium text-ink">
          {canAddMore ? 'Drag & drop images here' : 'Image limit reached'}
        </p>
        <p className="mt-1 text-xs text-muted">
          {canAddMore
            ? 'or click to browse · JPEG, PNG, WebP, GIF · up to 5 MB each'
            : `Remove an image to add more (max ${MAX_IMAGES})`}
        </p>
      </div>

      {displayError ? <p className="text-xs text-red-700">{displayError}</p> : null}
      <p className="text-xs text-muted">
        First image is used as the main thumbnail in listings. Upload at least one image before saving.
      </p>
    </div>
  )
}
