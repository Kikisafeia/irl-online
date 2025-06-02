import OpenAI from 'openai';

const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY || process.env.VITE_AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || process.env.VITE_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME || process.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || process.env.VITE_AZURE_OPENAI_API_VERSION;

const openai = new OpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': AZURE_OPENAI_API_VERSION },
  defaultHeaders: { 'api-key': AZURE_OPENAI_API_KEY },
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

export const getAIRecommendations = async (prompt: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT_NAME, // In Azure, model is the deployment name
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    return response.choices[0].message?.content || '';
  } catch (error) {
    console.error('Error getting AI recommendations from Azure OpenAI:', error);
    throw error;
  }
};
