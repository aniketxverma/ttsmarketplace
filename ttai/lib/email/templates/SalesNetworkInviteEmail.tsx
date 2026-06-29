import { BaseEmail } from './Base'

export function SalesNetworkInviteEmail({ inviterName, company, link }: { inviterName: string; company: string; link: string }) {
  return (
    <BaseEmail preview={`${inviterName} invited you to join their official network on TTAIZ`}>
      <h2>You’re invited to join {inviterName}’s official network</h2>
      <p>
        <strong>{inviterName}</strong> has invited <strong>{company}</strong> to join their Official
        Distribution Network on TTAIZ.
      </p>
      <p>
        Accept the invitation to get your own free online store and dashboard — start receiving orders,
        import {inviterName}’s catalogue, and build and manage your <em>own</em> distribution network.
      </p>
      <p style={{ marginTop: 24 }}>
        <a href={link} className="btn">Accept invitation &amp; set up my store</a>
      </p>
      <p style={{ marginTop: 24, fontSize: 13, color: '#6b7280' }}>
        If you weren’t expecting this invitation, you can safely ignore this email.
      </p>
    </BaseEmail>
  )
}
