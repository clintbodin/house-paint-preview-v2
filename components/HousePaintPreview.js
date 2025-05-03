 // components/HousePaintPreview.js
import { useState, useEffect } from 'react';

export default function HousePaintPreview() {
  const [file, setFile]             = useState(null);
  const [color, setColor]           = useState('');
  const [palette, setPalette]       = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // 1) Load the Sherwin-Williams palette once on mount
  useEffect(() => {
    fetch('/sherwin_williams_colors.json')
      .then((res) => res.json())
      .then(setPalette)
      .catch((err) => {
        console.error('Failed to load color list:', err);
        setError('Could not load paint colors.');
      });
  }, []);

  // 2) Handle image file selection
  function handleFileChange(e) {
    setError('');
    const picked = e.target.files?.[0];
    if (picked) {
      setFile(picked);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(picked);
    }
  }

  // 3) Handle dropdown color change
  function handleColorChange(e) {
    setColor(e.target.value);
  }

  // 4) Send both to your API, get back a blob and show it
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !color) {
      setError('Please select an image and pick a paint color.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('image', file);
      form.append('color', color);

      const res = await fetch('/api/repaint', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setError('Failed to generate preview.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full"
        />

        <label className="block">
          Pick a Sherwin-Williams color:
          <select
            value={color}
            onChange={handleColorChange}
            className="mt-1 block w-full border p-2"
          >
            <option value="" disabled>— select a color —</option>
            {palette.map((c) => (
              <option key={c.hex} value={c.hex}>
                {c.name} ({c.hex})
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? 'Generating Preview…' : 'Generate Preview'}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {previewUrl && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">Preview:</h2>
          <img src={previewUrl} alt="House with new paint" className="w-full rounded shadow" />
        </div>
      )}
    </div>
  );
}
