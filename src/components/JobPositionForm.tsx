import React, { useState } from 'react';
import { Briefcase, ListChecks, MapPin, PenTool as Tool, FlaskRound as Flask, AlertTriangle, Info } from 'lucide-react';
import { JobInfo } from '../types';
import { getAIRecommendations } from '../services/azureOpenAIService';

// Basic sanitization utility to prevent simple XSS by replacing HTML special characters.
// IMPORTANT: This is a basic client-side sanitization measure.
// Robust server-side validation and sanitization are crucial for security.
const sanitizeInput = (str: string): string => {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const JOB_DESCRIPTION_PROMPT_TEMPLATE = (position: string) => `User-provided position: "${position}"

Based on the user-provided position above, create a detailed job description including the following sections:
- Main Tasks
- Work Environment
- Equipment, Machinery, and Tools
- Materials and Substances
- Special Conditions
- Additional Information

Ensure the response is formatted as a VALID JSON object, including all necessary commas between properties. The keys should be: tasks, environment, equipment, materials, specialConditions, additionalInfo. Each value should be a string with line breaks for lists.

# Output Format

The response should be a JSON object with the following structure:
\`\`\`json
{
  "tasks": "[Main tasks listed as a multiline string]",
  "environment": "[Work environment details as a multiline string]",
  "equipment": "[Equipment, machinery, and tools listed as a multiline string]",
  "materials": "[Materials and substances listed as a multiline string]",
  "specialConditions": "[Special conditions as a multiline string]",
  "additionalInfo": "[Additional information as a multiline string]"
}
\`\`\`

# Examples

**Example 1**

**Input:**
User-provided position: "Software Developer"

**Output:**
\`\`\`json
{
  "tasks": "Design and develop software applications.\\nMaintain and update existing software.\\nCollaborate with team members to determine project requirements.",
  "environment": "Office setting.\\nFlexible working hours.\\nRemote work options available.",
  "equipment": "Laptop.\\nDevelopment software (e.g., IDE).\\nCollaboration tools (e.g., Slack, Zoom).",
  "materials": "Technical documentation.\\nSoftware development kits (SDKs).",
  "specialConditions": "Occasional overtime may be required.\\nAvailability for on-call support.",
  "additionalInfo": "Opportunities for professional development.\\nHealth and wellness benefits offered."
}
\`\`\`
*(For longer lists or descriptions than shown above, adjust and expand as appropriate.)*

# Notes

Consider edge cases, such as when information for a certain section is unavailable or not applicable, and how to properly reflect that in the JSON output."`;

interface JobPositionFormProps {
  initialData: JobInfo;
  onSubmit: (data: JobInfo) => void;
  onBack: () => void;
}

const JobPositionForm: React.FC<JobPositionFormProps> = ({ initialData, onSubmit, onBack }) => {
  const [formData, setFormData] = useState<JobInfo>(initialData);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, position }));
  };

  const handleSuggest = async () => {
    setIsLoadingSuggestions(true);
    try {
      const prompt = JOB_DESCRIPTION_PROMPT_TEMPLATE(formData.position);
      const aiResponse = await getAIRecommendations(prompt);
      
      let parsedResponse;
      let jsonString = aiResponse;
      let parseErrorOccurred = false;

      // Attempt 1: Extract JSON from markdown code block
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
        try {
          parsedResponse = JSON.parse(jsonString);
        } catch (error) {
          console.error('Error parsing JSON from markdown:', error);
          parseErrorOccurred = true;
        }
      } else {
        parseErrorOccurred = true;
      }

      // Attempt 2: Find first '{' and last '}'
      if (parseErrorOccurred) {
        const firstBrace = aiResponse.indexOf('{');
        const lastBrace = aiResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonString = aiResponse.substring(firstBrace, lastBrace + 1);
          try {
            parsedResponse = JSON.parse(jsonString);
            parseErrorOccurred = false;
          } catch (error) {
            console.error('Error parsing JSON from braces:', error);
          }
        }
      }

      if (parseErrorOccurred || !parsedResponse) {
        throw new Error('No se pudo analizar la respuesta de IA');
      }

      setFormData(prev => ({
        ...prev,
        tasks: parsedResponse.tasks || '',
        environment: parsedResponse.environment || '',
        equipment: parsedResponse.equipment || '',
        materials: parsedResponse.materials || '',
        specialConditions: parsedResponse.specialConditions || '',
        additionalInfo: parsedResponse.additionalInfo || ''
      }));
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      alert('Error al generar sugerencias. Por favor intente nuevamente.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const sanitizedValue = (type === 'text' || type === 'textarea') ? sanitizeInput(value) : value;
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
        <Briefcase className="mr-2 text-blue-600" />
        Información del Puesto de Trabajo
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Cargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo o Función
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handlePositionChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del cargo o función"
              />
            </div>
            {formData.position.length > 0 && (
              <button
                type="button"
                onClick={handleSuggest}
                disabled={isLoadingSuggestions}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isLoadingSuggestions ? 'Generando sugerencias...' : 'Sugerir contenido para este cargo'}
              </button>
            )}
          </div>

          {/* Resto del formulario... */}
          {/* (Mantener el resto del JSX igual) */}
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Volver
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPositionForm;
