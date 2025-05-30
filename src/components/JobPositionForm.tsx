import React, { useState } from 'react';
import { Briefcase, ListChecks, MapPin, PenTool as Tool, FlaskRound as Flask, AlertTriangle, Info } from 'lucide-react';
import { JobInfo } from '../types';
import { getAIRecommendations } from '../services/azureOpenAIService';

// Basic sanitization utility to prevent simple XSS by replacing HTML special characters.
// IMPORTANT: This is a basic client-side sanitization measure.
// Robust server-side validation and sanitization are crucial for security.
const sanitizeInput = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;') // Optional: also sanitize single quotes
    .replace(/\//g, '&#x2F;'); // Optional: also sanitize forward slashes
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
    // Also sanitize position input, as it's used in prompts.
    // While prompt delineation helps, sanitizing user input adds another layer of safety.
    const position = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, position }));
  };

  const handleSuggest = async () => {
    setIsLoadingSuggestions(true);
    try {
      // WARNING: When incorporating user-supplied data into prompts,
      // always be mindful of prompt injection vulnerabilities.
      // Treat user input as data, not as instructions.
      // Clearly delineate user input from the instructional parts of the prompt.
      const prompt = JOB_DESCRIPTION_PROMPT_TEMPLATE(formData.position);

      const aiResponse = await getAIRecommendations(prompt);
      let parsedResponse;
      let jsonString = aiResponse; // Default to full response

      // Attempt to extract JSON string from markdown code block
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      }

      try {
        parsedResponse = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse JSON. Raw AI response:', aiResponse);
        console.error('Attempted JSON string:', jsonString);
        throw parseError; // Re-throw to be caught by outer catch block
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
      console.error('Error generating AI suggestions:', error);
      // TODO: Consider replacing alert() with a more integrated UI feedback mechanism (e.g., toast notification)
      alert('Error al generar sugerencias de IA. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Apply sanitization for text and textarea inputs.
    // IMPORTANT: This client-side sanitization is a first line of defense,
    // but comprehensive server-side validation and sanitization are essential.
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

          {/* Tareas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tareas Principales
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <ListChecks size={18} className="text-gray-400" />
              </div>
              <textarea
                name="tasks"
                value={formData.tasks}
                onChange={handleChange}
                required
                rows={4}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describa las tareas principales del cargo"
              />
            </div>
          </div>

          {/* Entorno de Trabajo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entorno de Trabajo
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MapPin size={18} className="text-gray-400" />
              </div>
              <textarea
                name="environment"
                value={formData.environment}
                onChange={handleChange}
                required
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describa el lugar físico donde se desarrollan las tareas"
              />
            </div>
          </div>

          {/* Equipos y Herramientas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipos, Maquinarias y Herramientas
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <Tool size={18} className="text-gray-400" />
              </div>
              <textarea
                name="equipment"
                value={formData.equipment}
                onChange={handleChange}
                required
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Liste los equipos y herramientas utilizados"
              />
            </div>
          </div>

          {/* Materiales y Sustancias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Materiales y Sustancias
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <Flask size={18} className="text-gray-400" />
              </div>
              <textarea
                name="materials"
                value={formData.materials}
                onChange={handleChange}
                required
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Liste los materiales y sustancias manejadas"
              />
            </div>
          </div>

          {/* Condiciones Especiales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones Especiales
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <AlertTriangle size={18} className="text-gray-400" />
              </div>
              <textarea
                name="specialConditions"
                value={formData.specialConditions}
                onChange={handleChange}
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Indique condiciones particulares (ej: trabajo en altura, espacios confinados)"
              />
            </div>
          </div>

          {/* Información Adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Información Adicional
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <Info size={18} className="text-gray-400" />
              </div>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={3}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional relevante"
              />
            </div>
          </div>
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
