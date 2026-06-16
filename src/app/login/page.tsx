import LoginForm from '@/components/LoginForm';

export default async function LoginPage(props: { searchParams: Promise<{ message?: string; admin?: string }> }) {
  const searchParams = await props.searchParams;
  const showAdmin = searchParams?.admin === 'true';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]" />

      <LoginForm message={searchParams?.message} showAdmin={showAdmin} />
    </div>
  );
}

