## Super Admin Recovery Flow

A safety net to regain Super Admin access without wiping data. Protected by a secret recovery key you store offline.

### 1. Add Cloud secret
- `SUPER_ADMIN_RECOVERY_KEY` — long random string (I'll generate one and prompt you to save it via `add_secret`)

### 2. Public server route — `src/routes/api/public/recover-super-admin.ts`
- `POST { email, recovery_key }`
- Validates input with Zod (email format, key length 32–256)
- Compares `recovery_key` against `process.env.SUPER_ADMIN_RECOVERY_KEY` using `crypto.timingSafeEqual` (constant-time, prevents timing leaks)
- On match:
  - Use `supabaseAdmin` to look up user in `auth.users` by email
  - Insert `{ user_id, role: 'super_admin' }` into `user_roles` (idempotent — ignore unique-constraint conflict)
  - Insert a row into `edit_audit_log` (`table_name='recovery'`, `field_changed='super_admin_granted'`, `new_value=email`, `edited_by_name='RECOVERY'`)
- Responses: 200 success, 400 invalid input, 401 bad key, 404 unknown email, 500 server error
- Generic error messages on bad key/email to avoid revealing which one was wrong
- No rate limiting (per platform guidance — secret-key gate is the protection)

### 3. Hidden recovery page — `src/routes/recover-admin.tsx`
- Public route (NOT under `_app` or `_authenticated`) — not in sidebar
- Reached by typing `/recover-admin` directly
- Form: Email + Recovery Key (password input) + Submit
- Calls the public route via `fetch('/api/public/recover-super-admin', …)`
- Toast on success/error; "Go to login" link after success
- Same `Card` + `Input` + `Button` design tokens as `/login`
- `head()` with `noindex` meta to keep search engines out

### 4. No database migration needed
- Reuses existing `user_roles` and `edit_audit_log` tables
- No new tables (rate-limit table dropped per platform guidance)

### What you do after build
1. Approve the `add_secret` prompt for `SUPER_ADMIN_RECOVERY_KEY` (I'll suggest a strong value)
2. Save the key in your password manager
3. If locked out: open `/recover-admin`, enter your email + the key → role granted → log in normally

### Files
- create `src/routes/api/public/recover-super-admin.ts`
- create `src/routes/recover-admin.tsx`
- (secret added via tool)
