/**
 * Signed direct upload to Cloudinary (progress via XMLHttpRequest).
 */

export async function getCloudinaryUploadParams(authFetch) {
  return authFetch('/api/admin/upload/cloudinary-signature')
}

/**
 * @param {File} file
 * @param {{ cloudName: string, apiKey: string, signature: string, timestamp: number, folder: string }} params
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
export function uploadImageToCloudinary(file, params, onProgress) {
  const { cloudName, apiKey, signature, timestamp, folder } = params
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', apiKey)
    formData.append('timestamp', String(timestamp))
    formData.append('signature', signature)
    formData.append('folder', folder)
    if (params.transformation) {
      formData.append('transformation', params.transformation)
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve({ secureUrl: data.secure_url, publicId: data.public_id || '' })
          return
        }
        const msg = data.error?.message || data.message || `Upload failed (${xhr.status})`
        reject(new Error(msg))
      } catch {
        reject(new Error('Invalid response from image host'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

    xhr.send(formData)
  })
}
