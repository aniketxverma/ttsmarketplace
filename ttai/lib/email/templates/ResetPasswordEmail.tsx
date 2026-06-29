import { BaseEmail } from './Base'

export function ResetPasswordEmail({ link }: { link: string }) {
  return (
    <BaseEmail preview="Reset your TTAI EMA password">
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for your TTAI EMA account. Click the button below to choose a new password.</p>
      <p style={{ marginTop: 24 }}>
        <a href={link} className="btn">Reset my password</a>
      </p>
      <p style={{ marginTop: 24, fontSize: 13, color: '#6b7280' }}>
        This link expires in 1 hour. If you didn’t request a password reset, you can safely ignore this email — your password won’t change.
      </p>
    </BaseEmail>
  )
}
