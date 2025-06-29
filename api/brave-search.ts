import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import { BraveSearch } from '@modelcontextprotocol/server-brave-search';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { q: searchQuery } = req.query;

  if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
    return res.status(400).json({ error: 'Search query (q) is required.' });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    console.error('BRAVE_SEARCH_API_KEY is not configured.');
    return res.status(500).json({ error: 'Search service is not configured.' });
  }

  try {
    const brave = new BraveSearch({ apiKey });
    // La librería espera un array de mensajes, similar a la API de OpenAI.
    // Para una búsqueda simple, podemos simular un mensaje de usuario.
    const results = await brave.run([{ role: 'user', content: searchQuery }]);
    
    // La respuesta de brave.run() es un Message, el contenido es lo que nos interesa.
    // Asumimos que el contenido es una cadena JSON de resultados o un objeto.
    // Deberás inspeccionar la estructura exacta de 'results.content' para parsearlo adecuadamente.
    // Por ahora, lo devolvemos tal cual o intentamos un parseo si es string.
    const searchData = typeof results.content === 'string' ? JSON.parse(results.content) : results.content;
    return res.status(200).json(searchData);
  } catch (error: any) {
    console.error('Error fetching from Brave Search:', error);
    return res.status(500).json({ error: `Failed to fetch search results: ${error.message}` });
  }
}
