 // pages/index.js
import HousePaintPreview from '../components/HousePaintPreview';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <h1 className="text-center text-3xl font-bold mb-8">
        Sherwin-Williams House Paint Preview
      </h1>
      <HousePaintPreview />
    </main>
  );
}
