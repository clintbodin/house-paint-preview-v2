export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { image, mainColorPrompt, trimColorPrompt } = req.body;
  if (!image || !mainColorPrompt || !trimColorPrompt) {
    return res.status(400).json({ message: 'Missing image or prompt' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Paint the main body of the house ${mainColorPrompt} and the trim ${trimColorPrompt}`,
        image,
        n: 1,
        size: '1024x1024'
      })
    });

    const data = await openaiRes.json();
    if (data.error) throw new Error(data.error.message);

    res.status(200).json({ url: data.data[0].url });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ message: 'Failed to generate image', error: err.message });
  }
}
