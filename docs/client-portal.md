# Client portal: focused M8 delivery

[Client login preview](https://med-assurance-bi0h5cd1y-readmemaybes-projects.vercel.app/client/login). Vercel preview protection remains enabled. The portal migration is applied to the existing hosted Supabase project; production has not been promoted.

Routes: `/client/login`, `/client`, `/client/dossiers`, `/client/dossiers/[reference]`, `/client/declarer`, `/client/profil`.

Implemented: separate mobile client interface, French/Arabic switch and RTL, owned-case tracking with simplified statuses, five-step declaration with saved Supabase drafts, optional camera/file uploads, review and idempotent submission, private document viewing/replacement, and name/photo/password settings. Login and welcome screens use a locally hosted background image. Existing broker records receive new declarations and uploaded documents; internal notes/tasks/activity are never included in the client projection.

The additive migration `20260919030000_client_portal.sql` contains client-safe RPCs and private Storage policies. Use the existing linked client account; client ownership remains the explicit `clients.portal_profile_id` relationship. No service-role key is required by the application. Uploads go directly to Supabase (10 MiB documents, 2 MiB avatars), avoiding Vercel function body limits. File writes use new paths; verified files cannot be overwritten. Password changes require the current password.

New claims enter the organization's first team's unassigned queue. Injury or uncertain injury is flagged for human attention. The existing supervisor/admin accounts can see these claims. Assignment controls remain part of the later broker milestone.

Not part of this focused delivery: an asynchronous broker/client message inbox, broker document verification controls, self-registration, invitation delivery or forgotten-password email delivery. The login directs clients needing access recovery to their cabinet. M8 is therefore in progress, not fully complete.

No tests were added for this slice. Production builds (local and Vercel), focused lint and database function lint pass. A local browser walkthrough completed login, declaration submission, case tracking, avatar save/reload and private document upload/opening. Mobile French and Arabic screens were inspected. Hosted client authentication and the client-safe workspace RPC are working.

## Background asset

`public/images/coastal-road.webp` (about 180 KiB) was generated with the built-in image-generation tool, then optimized to WebP for the website.

Final prompt: “Use case: photorealistic-natural. Create a wide landscape photograph background asset for a calm Moroccan automobile insurance client portal. A quiet coastal road curving gently along the Atlantic coast of Morocco, soft morning light, muted sea blue and warm sandy stone, a few natural olive green plants, distant hills and open sky. Editorial architectural/travel photography, realistic textures, understated, reassuring, elegant. Wide 3:2 composition with ample quiet space to overlay interface text. No accidents, no people, no text, no logos, no watermarks. This asset will be used as a website login and welcome background.”
