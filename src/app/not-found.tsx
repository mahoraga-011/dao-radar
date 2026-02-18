import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-accent mb-4">404</p>
      <p className="text-xl font-semibold mb-2">Page Not Found</p>
      <p className="text-sm text-muted mb-6 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
