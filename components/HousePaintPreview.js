 // components/HousePaintPreview.js
import { useState, useEffect } from 'react';

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function categorize(hex) {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)));
  if (l >= 0.8) return 'Lights';
  if (l <= 0.2) return 'Darks';
  if (s <= 0.1) return 'Neutrals';
  if (h < 30 || h >= 330) return 'Reds';
  if (h < 60) return 'Oranges';
  if (h < 90) return 'Yellows';
  if (h < 150) return 'Greens';
  if (h < 210) return 'Cyans';
  if (h < 270) return 'Blues';
  return 'Purples';
}

export default function HousePaintPreview() {
  const [file, setFile]             = useState(null);
  const [groups, setGroups]         = useState({});
  const [color, setColor]           = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // 1) Load & bucket the palette once
  useEffect(() => {
    fetch('/sherwin_williams_colors.json')
      .then(res => res.json())
      .then((data) => {
        const b = {};
        data.forEach((c) => {
          const grp = categorize(c.hex);
          if (!b[grp]) b[grp] = [];
          b[grp].push(c);
        });
        setGroups(b);
      })
      .catch((e) => setError('Could not load paint colors.'));
  }, []);

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

  function pickColor(hex) {
    setColor(hex);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !color) {
      setError('Please select an image & pick a paint color.');
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
    <div className="max-w-3xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full"
        />

        <div className="space-y-2">
          {Object.entries(groups).map(([grp, cols]) => (
            <details key={grp} className="border rounded p-2">
              <summary className="font-semibold">{grp} ({cols.length})</summary>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {cols.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => pickColor(c.hex)}
                    className={`flex items-center space-x-1 p-1 border rounded ${
                      color === c.hex ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <span
                      className="w-5 h-5 border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs">{c.name}</span>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? 'Generating…' : 'Generate Preview'}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {previewUrl && (
        <div>
          <h2 className="font-bold mb-2">Preview:</h2>
          <img
            src={previewUrl}
            alt="House preview"
            className="w-full rounded shadow"
          />
        </div>
      )}
    </div>
  );
}
