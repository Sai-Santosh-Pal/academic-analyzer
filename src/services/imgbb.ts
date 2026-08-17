// imgbb image hosting bridge (used only when EXPO_PUBLIC_IMGBB_KEY is set).
// Uploads base64 image data and returns a hosted URL. Degrades gracefully.

export interface ImgbbResult {
  url: string
  thumbUrl: string
  deleteUrl?: string
}

export function imgbbConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_IMGBB_KEY
}

export async function imgbbUpload(base64: string, fileName = 'photo.png'): Promise<ImgbbResult | null> {
  const key = process.env.EXPO_PUBLIC_IMGBB_KEY
  if (!key) return null
  try {
    const form = new FormData()
    form.append('image', base64)
    form.append('name', fileName)
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: 'POST', body: form })
    const json = (await res.json()) as {
      success?: boolean
      data?: { url?: string; thumb?: { url?: string }; delete_url?: string }
    }
    if (!json.success || !json.data?.url) return null
    return { url: json.data.url, thumbUrl: json.data.thumb?.url ?? json.data.url, deleteUrl: json.data.delete_url }
  } catch (e) {
    console.warn('imgbb upload failed', e)
    return null
  }
}