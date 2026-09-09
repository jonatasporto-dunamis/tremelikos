import { redirect } from 'next/navigation';

export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = Array.isArray(params?.next) ? params?.next[0] : params?.next;
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
}
