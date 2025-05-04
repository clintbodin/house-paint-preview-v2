 // pages/api/repaint.js
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parse error' });
    const colorHex  = fields.color;
    const colorName = fields.name;
    const imgFile   = files.image;
    const buffer    = fs.readFileSync(imgFile.filepath);
    const b64       = buffer.toString('base64');

    try {
      const openaiRes = await fetch(
        'https://api.openai.com/v1/images/edits',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: `data:image/png;base64,${b64}`,
            mask:  `data:image/png;base64,${b64}`,
            prompt: `Recolor this house ${colorName} (${colorHex})`,
            n: 1,
            size: '1024x1024',
          }),
        }
      );
      const data = await openaiRes.json();
      if (data.error) throw new Error(data.error.message);
      return res.status(200).json({ });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message || 'OpenAI error' });
    }
  });
}
