import HousePaintPreview from '../components/HousePaintPreview';


export default function Home() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* This is the real preview component from your Repaint-api package */}
      <HousePaintPreview />
    </div>
  );
}

