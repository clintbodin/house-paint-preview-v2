import { useState } from 'react';

export default function HousePaintPreview() {
  const [file, setFile] = useState(null);
  const [color, setColor] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle file selection
  function handleFileChange(e) {
    setError('');
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selected);
    }
  }

  // Handle color input change
  function handleColorChange(e) {
    setColor(e.target.value);
  }

  // Submit file + color to your API route
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !color) {
      setError('Please select an image and enter a color.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('color', color);

      const res = await fetch('/api/repaint', {
        method: 'POST',
        body: formData,
      });
      const blob = await res.blob();
      // Create a URL for downloaded blob
      const newUrl = URL.createObjectURL(blob);
      setPreviewUrl(newUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to generate preview.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <input
          type="text"
          placeholder="Enter paint color (e.g. #ff0000 or Blue)"
          value={color}
          onChange={handleColorChange}
          className="border p-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-1 px-3 rounded"
        >
          {loading ? 'Generating...' : 'Generate Preview'}
        </button>
      </form>
      {error && <p className="text-red-600">{error}</p>}
      {previewUrl && (
        <div>
          <h2 className="font-bold">Preview:</h2>
          <img src={previewUrl} alt="House preview" className="max-w-full" />
        </div>
      )}
    </div>
  );
}
