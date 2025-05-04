import { useState, useEffect, useRef } from 'react';

// Helpers to bucket by HSL
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
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
  const [color, setColor]           = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const canvasRef = useRef(null);

  // 1️⃣ Load and group all colors
  useEffect(() => {
    fetch('/sherwin_williams_colors.json')
      .then((r) => r.json())
      .then((data) => {
        const g = {};
        data.forEach((c) => {
          const grp = categorize(c.hex);
          if (!g[grp]) g[grp] = [];
          g[grp].push(c);
        });
        setGroups(g);
      })
      .catch(() => setError('Failed to load paint colors.'));
  }, []);

  // 2️⃣ Image upload
  function handleFileChange(e) {
    setError('');
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(picked);
  }

  // 3️⃣ Color swatch picker
  function pickColor(c) {
    setColor(c);
  }

  // 4️⃣ Submit to your API and get back a new image URL
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
      form.append('color', color.hex);
      form.append('name', color.name);

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

  // 5️⃣ Draw the returned image + overlay text onto a canvas
  useEffect(() => {
    if (!previewUrl || !color) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height + 40;
      ctx.drawImage(img, 0, 0);
      // background for text
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, img.height, img.width, 40);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '18px sans-serif';
      ctx.fillText(
        `${color.name} (${color.hex})`,
        img.width / 2,
        img.height + 28
      );
    };
    img.src = previewUrl;
  }, [previewUrl, color]);

  // 6️⃣ Download button
  function handleDownload() {
    const link = document.createElement('a');
    link.download = `${color.name}-${color.hex}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full"
        />

        {/* grouped swatches */}
        {Object.entries(groups).map(([grp, cols]) => (
          <details key={grp} className="border rounded p-2">
            <summary className="font-semibold">
              {grp} ({cols.length})
            </summary>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {cols.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => pickColor(c)}
                  className={`flex items-center space-x-1 p-1 border rounded ${
                    color?.hex === c.hex ? 'ring-2 ring-blue-500' : ''
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
        <div className="mt-6">
          <canvas ref={canvasRef} className="w-full rounded shadow" />
          <button
            onClick={handleDownload}
            className="mt-2 bg-green-600 text-white py-1 px-4 rounded"
          >
            Download with Label
          </button>
        </div>
      )}
    </div>
);
}
