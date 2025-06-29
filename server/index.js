require('dotenv').config({ path: '../.env' }); // Cargar variables de entorno desde la raíz del proyecto
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const OpenAI = require('openai');

const app = express();
app.use(helmet());
const port = 3001; // Puerto para el servidor de backend

app.use(cors({
  origin: '*',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configuración de Azure OpenAI desde variables de entorno
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

// Debugging: Verificar si las variables de entorno se cargan correctamente
console.log('AZURE_OPENAI_API_KEY:', AZURE_OPENAI_API_KEY ? 'Cargada' : 'No cargada');
console.log('AZURE_OPENAI_ENDPOINT:', AZURE_OPENAI_ENDPOINT ? 'Cargado' : 'No cargado');
console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', AZURE_OPENAI_DEPLOYMENT_NAME ? 'Cargado' : 'No cargado');
console.log('AZURE_OPENAI_API_VERSION:', AZURE_OPENAI_API_VERSION ? 'Cargado' : 'No cargado');

// Ruta para obtener recomendaciones de IA
// La ruta es '/ai-recommendations' porque el proxy de Vite en el frontend reescribe '/api/ai-recommendations' a esto.
app.post('/ai-recommendations', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  let openai;
  try {
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      throw new Error('AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_DEPLOYMENT_NAME son requeridos.');
    }

    const baseURL = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}`;
    const apiVersion = AZURE_OPENAI_API_VERSION;

    console.log('[Backend] Attempting to connect to Azure OpenAI with:');
    console.log(`[Backend] Base URL: ${baseURL}`);
    console.log(`[Backend] API Version: ${apiVersion}`);

    openai = new OpenAI({
      apiKey: AZURE_OPENAI_API_KEY,
      baseURL: baseURL,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': AZURE_OPENAI_API_KEY },
    });

    console.log('[Backend] OpenAI client configured. Creating chat completion...');
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null,
    });

    const rawRecommendation = chatCompletion.choices[0]?.message?.content || '';
    console.log('[Backend] Raw response from AI:', rawRecommendation);

    // Función más robusta para extraer JSON de una cadena que podría estar envuelta en markdown.
    const extractJson = (str) => {
      // Encuentra la primera ocurrencia de '{' o '['
      const firstBracket = str.indexOf('{');
      const firstSquare = str.indexOf('[');
      
      let start = -1;
      
      if (firstBracket === -1 && firstSquare === -1) return null;
      
      if (firstBracket === -1) start = firstSquare;
      else if (firstSquare === -1) start = firstBracket;
      else start = Math.min(firstBracket, firstSquare);

      // Encuentra la última ocurrencia de '}' o ']'
      const lastBracket = str.lastIndexOf('}');
      const lastSquare = str.lastIndexOf(']');
      
      let end = -1;

      if (lastBracket === -1 && lastSquare === -1) return null;

      end = Math.max(lastBracket, lastSquare);

      if (start === -1 || end === -1 || end < start) return null;

      return str.substring(start, end + 1);
    };

    let parsedRecommendation;
    let isJson = false;
    const jsonString = extractJson(rawRecommendation);
    console.log('[Backend] Extracted JSON string:', jsonString);

    if (jsonString) {
      try {
        parsedRecommendation = JSON.parse(jsonString);
        isJson = true;
      } catch (e) {
        // La cadena extraída no es un JSON válido, por lo que enviamos el texto sin formato.
        console.warn('La cadena extraída no se pudo analizar como JSON.', e.message);
        parsedRecommendation = rawRecommendation;
        isJson = false;
      }
    } else {
      // No se encontró ningún objeto/array JSON, envía el texto sin formato.
      parsedRecommendation = rawRecommendation;
      isJson = false;
    }
    
    res.json({ content: parsedRecommendation, isJson: isJson });
  } catch (error) {
    console.error('Error en el backend al obtener recomendaciones:', error);
    if (error instanceof OpenAI.APIError) {
      res.status(error.status || 500).json({ 
        error: `Azure OpenAI API error: ${error.status} - ${error.message}` 
      });
    } else {
      res.status(500).json({ error: `An unexpected error occurred: ${error.message || String(error)}` });
    }
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
