import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function Home() {
  const cookieStore = cookies();
  const access = cookieStore.get('access_token');

  if (access) return redirect('/dashboard');

  return redirect('/auth/login');
}
