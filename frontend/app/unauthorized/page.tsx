export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-red-500 mb-4">403</h1>
        <p className="text-gray-600 text-lg">You are not authorised to view this page.</p>
        <a href="/dashboard" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          ← Back to dashboard
        </a>
      </div>
    </div>
  );
}
