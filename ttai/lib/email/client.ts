import { Resend } from 'resend'

// Lazily instantiated so module import doesn't throw during Next.js build
// when RESEND_API_KEY is not present in the build environment.
let _client: Resend | null = null

export function getResendClient(): Resend {
  if (!_client) {
    _client = new Resend(process.env.RESEND_API_KEY!)
  }
  return _client
}
