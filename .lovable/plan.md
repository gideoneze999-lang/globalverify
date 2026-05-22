## GlobalVerify — Phase 1: Foundation

Phase 1 ships the public landing page, full authentication, the dashboard shell with sidebar navigation, and the admin panel skeleton with role-based access. All wallet/buy-number/marketplace/cart flows are scaffolded as placeholder sections in the dashboard but not wired to real logic — they come in Phase 2+.

### What gets built

**Branding & design system**
- Dark navy + royal purple palette with cyan accents, glassmorphism, gradient backgrounds, defined as semantic tokens in `src/styles.css` (oklch).
- Great Vibes cursive for section headings; Inter for body.
- Fully responsive.

**Landing page (`/`)**
- Sticky nav with Login / Get Started.
- Hero with animated mock OTP card (WhatsApp + Telegram incoming codes).
- Features section (6 cards), How It Works (4 steps), stats banner, CTA, multi-column footer with social/support links.
- Full SEO meta (title, description, og tags).

**Auth (Lovable Cloud)**
- `/login`, `/signup`, `/forgot-password`, `/reset-password` routes.
- Signup collects first name, last name, email, phone, password, terms checkbox.
- Email/password via Supabase Auth, session persistence, `onAuthStateChange` wired at root for cache invalidation.
- After login → redirect to `/dashboard`.
- `_authenticated` layout route guards all dashboard pages.

**User dashboard (`/dashboard/*`)**
- Collapsible sidebar (shadcn Sidebar) with sections: Overview, Buy Number, Send Gifts, Marketplace, Fund Wallet, Cart, Transactions, Profile, Support.
- Overview shows wallet balance (₦0.00), Fund Wallet button, totals, empty recent-transactions table — reads from `profiles`.
- All other sections rendered as styled placeholder pages ("Coming soon" with the intended layout sketched) so the shell is fully navigable.
- Profile page shows email/name, sign-out button.

**Admin panel (`/admin/*`)**
- Separate `_admin` layout route, protected by `has_role(auth.uid(), 'admin')` check in `beforeLoad` via a server function — NOT hardcoded credentials.
- Sidebar with sections: Overview, Wallet Approvals, 5sim Config, Pricing Manager, Upload Product, Manage Products, Users.
- All sections rendered as placeholder pages in Phase 1.
- A note in Overview tells the admin how they were granted the role.

**Database (Lovable Cloud / Supabase)**
- `profiles` table: `id` (FK → auth.users, PK), `first_name`, `last_name`, `phone`, `wallet_balance` (numeric, default 0), `updated_at`.
- `user_roles` table + `app_role` enum (`admin`, `user`) + `has_role()` SECURITY DEFINER function — the canonical Lovable role pattern.
- Trigger on `auth.users` insert → creates `profiles` row and assigns default `user` role.
- RLS enabled on both tables: users can read/update own profile; only admins can read/modify `user_roles`.
- `deposits` and `products` tables + `receipts` and `products` storage buckets are deferred to Phase 2.

**Bootstrapping the first admin**
- Since admin is role-based, the first admin must be promoted manually. After you sign up, I'll insert a `user_roles` row for your account via a one-shot SQL action so you can access `/admin`.

### Technical notes

- Stack: TanStack Start + React, TanStack Query, shadcn/ui, Tailwind v4, Lovable Cloud (Supabase).
- Auth gating uses `_authenticated` layout (`beforeLoad` redirect) and `_authenticated/_admin` nested layout (server-fn role check).
- 5sim API key will be added as a Lovable Cloud secret in Phase 2 when the Buy Number flow is built; all 5sim calls go through `createServerFn` so the key never reaches the browser.
- No hardcoded admin password anywhere.

### Out of scope for Phase 1 (Phase 2+)

Buy Number (5sim integration), Send Gifts catalog, Marketplace items + pagination/search, Fund Wallet upload + admin approvals (Realtime), Cart + checkout + shipping form, Transaction history population, Pricing Manager, Product upload/management, User balance adjustment, deposits/products tables and storage buckets.

### Deliverable at end of Phase 1

A polished, branded, fully navigable site: visitors land on the marketing page, sign up, log in, and explore the dashboard shell. You can be promoted to admin and explore the admin shell. All visual design, routing, auth, and role gating are production-ready; feature pages are clearly marked placeholders ready to be filled in.
