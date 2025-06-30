require('dotenv').config({ path: '../.env' }); // Cargar variables de entorno desde la raíz del proyecto
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const OpenAI = require('openai');

const app = express();
app.use(helmet());
const port = 3001; // Puerto para el servidor de backend

// TODO: For production, the origin should be set via an environment variable
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']; // Add your frontend's production URL if known

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configuración de Azure OpenAI desde variables de entorno
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

// Debugging: Verificar si las variables de entorno se cargan correctamente (comment out for production)
/*
console.log('AZURE_OPENAI_API_KEY:', AZURE_OPENAI_API_KEY ? 'Cargada' : 'No cargada');
console.log('AZURE_OPENAI_ENDPOINT:', AZURE_OPENAI_ENDPOINT ? 'Cargado' : 'No cargado');
console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', AZURE_OPENAI_DEPLOYMENT_NAME ? 'Cargado' : 'No cargado');
console.log('AZURE_OPENAI_API_VERSION:', AZURE_OPENAI_API_VERSION ? 'Cargado' : 'No cargado');
*/

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
      console.error('Azure OpenAI environment variables are not fully configured.');
      throw new Error('Azure OpenAI environment variables are not fully configured.');
    }

    const baseURL = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}`;
    const apiVersion = AZURE_OPENAI_API_VERSION;

    // console.log('[Backend] Attempting to connect to Azure OpenAI...');
    // console.log(`[Backend] Base URL: ${baseURL}`);
    // console.log(`[Backend] API Version: ${apiVersion}`);

    openai = new OpenAI({
      apiKey: AZURE_OPENAI_API_KEY,
      baseURL: baseURL,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': AZURE_OPENAI_API_KEY },
    });

    // console.log('[Backend] OpenAI client configured. Creating chat completion...');
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: null,
    });

    const rawRecommendation = chatCompletion.choices[0]?.message?.content?.trim() || '';
    // console.log('[Backend] Raw response from AI:', rawRecommendation);

    const extractJson = (str) => {
      if (!str) return null;

      // Attempt to find JSON within triple backticks (```json ... ```)
      const markdownJsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const markdownMatch = str.match(markdownJsonRegex);
      if (markdownMatch && markdownMatch[1]) {
        try {
          JSON.parse(markdownMatch[1]); // Validate if it's actual JSON
          return markdownMatch[1];
        } catch (e) {
          // It was in backticks but not valid JSON, proceed to other methods
        }
      }

      // Fallback to finding the first '{' or '[' and last '}' or ']'
      // This is a simplified approach and might not be perfectly robust for all cases.
      let firstBracket = str.indexOf('{');
      let firstSquare = str.indexOf('[');
      let start = -1;

      if (firstBracket === -1 && firstSquare === -1) return null;
      if (firstBracket === -1) start = firstSquare;
      else if (firstSquare === -1) start = firstBracket;
      else start = Math.min(firstBracket, firstSquare);

      let lastBracket = str.lastIndexOf('}');
      let lastSquare = str.lastIndexOf(']');
      let end = -1;

      if (lastBracket === -1 && lastSquare === -1) return null;
      end = Math.max(lastBracket, lastSquare);

      if (start === -1 || end === -1 || end < start) return null;

      const potentialJson = str.substring(start, end + 1);
      try {
        JSON.parse(potentialJson); // Validate
        return potentialJson;
      } catch(e) {
        // console.warn('Substring extraction did not result in valid JSON.', e.message);
        return null; // Could not extract valid JSON
      }
    };

    let parsedRecommendation;
    let isJson = false;
    const jsonString = extractJson(rawRecommendation);
    // console.log('[Backend] Extracted JSON string:', jsonString);

    if (jsonString) {
      try {
        parsedRecommendation = JSON.parse(jsonString);
        isJson = true;
      } catch (e) {
        console.warn('[Backend] Extracted string could not be parsed as JSON, sending raw.', e.message);
        parsedRecommendation = rawRecommendation; // Fallback to raw if parsing the extracted string fails
        isJson = false;
      }
    } else {
      // console.log('[Backend] No JSON structure found, sending raw recommendation.');
      parsedRecommendation = rawRecommendation;
      isJson = false;
    }
    
    res.json({ content: parsedRecommendation, isJson: isJson });

  } catch (error) {
    console.error('Error in backend AI recommendation processing:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }

    if (error instanceof OpenAI.APIError) {
      console.error(`Azure OpenAI API Error Details: Status ${error.status}, Type: ${error.type}, Code: ${error.code}, Param: ${error.param}`);
      // Send a more generic error to the client
      res.status(error.status || 500).json({ 
        error: 'An error occurred while communicating with the AI service. Please try again later.'
      });
    } else if (error.message === 'Azure OpenAI environment variables are not fully configured.') {
        res.status(500).json({ error: 'The AI service is not configured correctly on the server.' });
    }
    else {
      res.status(500).json({ error: `An unexpected error occurred on the server.` });
    }
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
