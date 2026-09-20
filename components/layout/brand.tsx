import Link from "next/link";
import type { Route } from "next";

export function Brand({ href = "/" }: { href?: Route }) {
  return (
    <Link
      href={href}
      className="shared-brand inline-flex items-center gap-2 rounded text-sm font-semibold tracking-tight"
      aria-label="Med Assurance, accueil"
    >
      <span className="shared-brand-mark" aria-hidden="true">
        m<span>·</span>
      </span>
      <span>
        med<span className="shared-brand-light">assurance</span>
      </span>
    </Link>
  );
}
