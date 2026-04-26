# ════════════════════════════════════════════════════════════════
# EDITH — TTAI AUTH & IDENTITY
# Packet 2 of 9 · Status: READY TO EXECUTE
# ════════════════════════════════════════════════════════════════

You are building the authentication and identity layer of the TTAI marketplace. Execute this packet end-to-end.

## MISSION
Build login, registration, email verification, and password reset flows using Supabase Auth. Implement role-based access control (RBAC) utilities. Build the shared header/footer components used across all pages. Wire the middleware to protect dashboard routes.

## STACK ADDITIONS
None new — uses Supabase Auth from JARVIS.

## DEPENDENCIES
- **JARVIS must be complete.** Database, profiles table, Supabase clients, and middleware shell must exist.

## FILES TO CREATE

### Auth pages
- `app/(auth)/layout.tsx` — centered card layout for auth screens
- `app/(auth)/login/page.tsx` — email + password login form
- `app/(auth)/register/page.tsx` — registration form with full_name, email, password, role selector
- `app/(auth)/verify-email/page.tsx` — confirmation page after registration
- `app/(auth)/reset-password/page.tsx` — password reset request + confirmation flow
- `app/(auth)/auth-error/page.tsx` — generic auth error display

### Auth utilities
- `lib/auth/rbac.ts` — `getSession()`, `getProfile()`, `requireAuth()`, `requireRole()`, `hasRole()` helpers
- `lib/auth/actions.ts` — server actions for `signIn`, `signUp`, `signOut`, `requestPasswordReset`, `updatePassword`

### API routes
- `app/api/auth/callback/route.ts` — handles Supabase OAuth/magic-link callbacks
- `app/api/auth/signout/route.ts` — POST endpoint that signs out and redirects to `/`

### Middleware extension
- Update `middleware.ts` to: refresh session, protect `/supplier/**`, `/broker/**`, `/buyer/**`, `/admin/**` (redirect unauthed users to `/login?redirect={original}`)

### Shared components
- `components/shared/Header.tsx` — top nav with logo, marketplace link, store link, login/dashboard button (conditional on session)
- `components/shared/Footer.tsx` — minimal footer with copyright + links
- `components/shared/UserMenu.tsx` — dropdown showing role-aware nav (Supplier Dashboard, Broker Dashboard, Buyer Orders, Admin Panel) + logout
- `components/ui/button.tsx` — shadcn/ui Button primitive
- `components/ui/input.tsx` — shadcn/ui Input primitive
- `components/ui/label.tsx` — shadcn/ui Label primitive
- `components/ui/form.tsx` — shadcn/ui Form wrapper for react-hook-form
- `components/ui/dropdown-menu.tsx` — shadcn/ui Dropdown
- `components/ui/toast.tsx` + `components/ui/toaster.tsx` + `components/ui/use-toast.ts` — shadcn/ui Toast system
- `lib/utils.ts` — `cn()` helper combining `clsx` and `tailwind-merge`

## SPECIFICATIONS

### Validation schemas (add to lib/validation/schemas.ts)
```typescript
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 characters'),
  fullName: z.string().min(2).max(100),
  role: z.enum(['buyer', 'business_client', 'supplier', 'broker']).default('buyer'),
})

export const resetRequestSchema = z.object({ email: z.string().email() })
export const resetConfirmSchema = z.object({
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
}).refine(d => d.password === d.passwordConfirm, { message: "Passwords don't match", path: ['passwordConfirm'] })
```

### lib/auth/rbac.ts (exact API)
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/domain'

export async function getSession()
export async function getProfile()           // returns profile row or null
export async function requireAuth()           // redirects to /login if no session
export async function requireRole(roles: UserRole | UserRole[])  // redirects to / if wrong role
export function hasRole(profileRole: string, roles: UserRole[]): boolean
```

### Registration flow
1. User submits register form
2. Call `supabase.auth.signUp({ email, password, options: { data: { full_name, requested_role } } })`
3. Trigger `handle_new_user()` already creates the profile row (from JARVIS) with role='buyer'
4. After signup, server action updates profile: `UPDATE profiles SET full_name=?, role=? WHERE id=?` (only if requested_role is buyer or business_client — supplier/broker requires onboarding flow in later packets, so default those to 'buyer' until they complete onboarding)
5. Send verification email (Supabase handles this automatically with default email templates)
6. Redirect to `/verify-email`

### Login flow
1. User submits login form
2. Call `supabase.auth.signInWithPassword({ email, password })`
3. On success: read `?redirect` param; if present, redirect there; otherwise:
   - role=admin → `/admin`
   - role=supplier → `/supplier`
   - role=broker → `/broker`
   - role=buyer/business_client → `/buyer`
4. On failure: show toast with error message

### Header behavior
- Always show: TTAI logo (links to `/`), Marketplace, Store
- If logged in: show UserMenu with role-appropriate links + logout
- If logged out: show Login + Register buttons

### Middleware (replace existing)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/supplier', '/broker', '/buyer', '/admin']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  if (!user && PROTECTED.some(p => path.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### shadcn/ui components
Use these exact patterns (the official shadcn/ui patterns). Install via copy: each `components/ui/*.tsx` should follow the standard shadcn/ui implementation with `class-variance-authority` for variants. Reference: https://ui.shadcn.com/docs/components.

### lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## ACCEPTANCE CRITERIA
- [ ] `/register` form creates new auth.users + profile rows (verified in DB)
- [ ] `/login` authenticates and redirects to role-appropriate dashboard route (route returns 404 — that's fine, dashboards come in later packets)
- [ ] `/logout` POST signs out and redirects to `/`
- [ ] Visiting `/supplier`, `/broker`, `/buyer`, `/admin` while logged out redirects to `/login?redirect=...`
- [ ] After login, `/login?redirect=/supplier` actually redirects to `/supplier`
- [ ] Header shows correct state (logged in vs out) on every page
- [ ] Reset password email is sent and reset link works
- [ ] `requireRole(['admin'])` correctly blocks non-admin users
- [ ] Toasts display on error/success

## HAND-OFF TO NEXT PACKET (VERONICA)
- Working auth on every page
- `requireAuth()` and `requireRole()` ready to gate any future page
- Header + Footer components ready to use
- Profile data accessible via `getProfile()`

## EXECUTION COMMAND
Build all files. Test the full auth flow end-to-end (register → verify email → login → access protected page → logout). Report PASS/FAIL on each acceptance criterion.
