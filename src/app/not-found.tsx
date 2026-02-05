export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-4 p-4'>
      <h1 className='text-2xl font-bold text-white'>Page not found</h1>
      <p className='text-white/70'>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <a
        href='/'
        className='rounded-full bg-white/10 px-6 py-3 text-white hover:bg-white/20'
      >
        Go to home
      </a>
    </div>
  );
}
