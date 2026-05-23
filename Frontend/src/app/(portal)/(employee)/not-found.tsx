import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6">
      <div className="bento-card p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-[--color-accent] mb-4">404</h1>
        <h2 className="text-xl font-semibold text-[--color-text-primary] mb-2">
          Page Not Found
        </h2>
        <p className="text-[--color-text-secondary] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/employee/dashboard" className="btn-primary inline-flex items-center gap-2">
          <Home size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
