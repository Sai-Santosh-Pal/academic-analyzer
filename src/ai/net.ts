/** fetch with a timeout that works in React Native (Hermes has no AbortSignal.timeout). */
export function fetchWithTimeout(url: string, options: RequestInit & { signal?: AbortSignal }, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  const { signal, ...rest } = options
  if (signal) signal.addEventListener('abort', () => controller.abort())
  return fetch(url, { ...rest, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}
