import { json } from '@sveltejs/kit';
import { GROQ_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { messages } = await request.json();

  const cleanMessages = messages.map(({ role, content }: { role: string; content: string }) => ({
    role,
    content
  }));

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: cleanMessages
    })
  });

  const data = await response.json();

  if (!response.ok || !data.choices?.[0]) {
    console.error('Groq API-fejl:', data);
    return json(
      { reply: 'Beklager, jeg kunne ikke generere et svar lige nu.' },
      { status: response.ok ? 502 : response.status }
    );
  }

  return json({ reply: data.choices[0].message.content });
};