# Shared components

`workspace/` holds the broker shell/provider, used screens and native SVG icons. Authenticated pages and the synthetic demo share these screens, with separate mutation adapters. `login-form.tsx` manages the Supabase sign-in action. `layout/` and `feedback/` retain the public/client foundation components.

Keep new components focused on real workflows rather than building an unused catalogue.
