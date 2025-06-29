// Servicio de recomendaciones de IA - Versión segura para backend
// NOTA: Esta implementación llama a un endpoint de backend que, a su vez,
// se comunica con la API de Azure OpenAI.

export const getAIRecommendations = async (prompt: string): Promise<any> => {
  console.log('Llamando a /api/ai-recommendations con prompt:', prompt);

  try {
    const apiUrl = import.meta.env.PROD 
      ? 'https://irl-online.vercel.app/api/ai-recommendations' // Vercel handles /api prefix
      : 'http://localhost:3001/ai-recommendations'; // Backend expects this path due to Vite proxy rewrite
      
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error del backend: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    // El backend ahora devuelve { content: ..., isJson: true/false }
    if (data && typeof data === 'object' && 'content' in data) {
      if (data.isJson) {
        // Si el contenido es un JSON válido, lo devolvemos como el objeto/array parseado directamente
        return data.content;
      } else {
        // Si el contenido es texto plano, lo devolvemos directamente como string
        return String(data.content);
      }
    } else {
      // Fallback si la estructura del backend no es la esperada, devolvemos el dato crudo
      console.warn('Estructura de respuesta del backend inesperada:', data);
      return data;
    }
  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    throw error;
  }
};
