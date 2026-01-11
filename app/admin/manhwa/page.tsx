// Redirect legacy admin/manhwa route to canonical /admin
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminManhwaRedirect() {
  redirect('/admin');
}