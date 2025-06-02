import React, { useState } from 'react';
import { Briefcase, ListChecks, MapPin, PenTool as Tool, FlaskRound as Flask, AlertTriangle, Info } from 'lucide-react';
import { JobInfo } from '../types';
import { getAIRecommendations } from '../services/azureOpenAIService';

interface JobPositionFormProps {
  initialData: JobInfo;
  onSubmit: (data: JobInfo) => void;
  onBack: () => void;
}

const JobPositionForm: React.FC<JobPositionFormProps> = ({ initialData, onSubmit, onBack }) => {
  const [formData, setFormData] = useState<JobInfo>(initialData);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = e.target.value;
    setFormData(prev => ({ ...prev, position }));
  };

  const handleSuggest = async () => {
    setIsLoadingSuggestions(true);
    setAiError(null); // Reset error before new suggestion
    try {
      const prompt = 
        'Create a detailed job description for the position "' + formData.position + '" including the following sections:\n' +
        '- Main Tasks\n' +
        '- Work Environment\n' +
        '- Equipment, Machinery, and Tools\n' +
        '- Materials and Substances\n' +
        '- Special Conditions\n' +
        '- Additional Information\n\n' +
        'Ensure the response is formatted as a VALID JSON object, including all necessary commas between properties. The keys should be: tasks, environment, equipment, materials, specialConditions, additionalInfo. Each value should be a string with line breaks for lists.\n\n' +
        '# Output Format\n\n' +
        'The response should be a JSON object with the following structure:\n' +
        '```json\n' +
        '{\n' +
        '  "tasks": "[Main tasks listed as a multiline string]",\n' +
        '  "environment": "[Work environment details as a multiline string]",\n' +
        '  "equipment": "[Equipment, machinery, and tools listed as a multiline string]",\n' +
        '  "materials": "[Materials and substances listed as a multiline string]",\n' +
        '  "specialConditions": "[Special conditions as a multiline string]",\n' +
        '  "additionalInfo": "[Additional information as a multiline string]"\n' +
        '}\n' +
        '```\n\n' +
        '# Examples\n\n' +
        '**Example 1**\n\n' +
        '**Input:**\n' +
        '"' + formData.position + '": "Software Developer"\n\n' +
        '**Output:**\n' +
        '```json\n' +
        '{\n' +
        '  "tasks": "Design and develop software applications.\\\\nMaintain and update existing software.\\\\nCollaborate with team members to determine project requirements.",\n' +
        '  "environment": "Office setting.\\\\nFlexible working hours.\\\\nRemote work options available.",\n' +
        '  "equipment": "Laptop.\\\\nDevelopment software (e.g., IDE).\\\\nCollaboration tools (e.g., Slack, Zoom).",\n' +
        '  "materials": "Technical documentation.\\\\nSoftware development kits (SDKs).",\n' +
        '  "specialConditions": "Occasional overtime may be required.\\\\nAvailability for on-call support.",\n' +
        '  "additionalInfo": "Opportunities for professional development.\\\\nHealth and wellness benefits offered."\n' +
        '}\n' +
        '```\n' +
        '*(For longer lists or descriptions than shown above, adjust and expand as appropriate.)*\n\n' +
        '# Notes\n\n' +
        '  - Ensure all keys ("tasks", "environment", "equipment", "materials", "specialConditions", "additionalInfo") are always present in the JSON response.\n' +
        '  - Each value must be a string. If information for a section is unavailable, not applicable, or should be empty, use an empty string \\"\\" as the value. For example, if "Additional Information" is not applicable, the output should include \\"additionalInfo\\": \\"\\".\n' +
        '  - Line breaks within string values should be represented as \\\\\\\\n.\n\n' +
        'Consider edge cases, such as when information for a certain section is unavailable or not applicable, and how to properly reflect that in the JSON output.';

      const aiResponse = await getAIRecommendations(prompt);
      let parsedResponse;
      let jsonString = aiResponse; // Default to full response
      let parseErrorOccurred = false;

      // Attempt 1: Extract JSON string from markdown code block
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
        try {
          parsedResponse = JSON.parse(jsonString);
          console.log('Successfully parsed JSON from markdown block.');
        } catch (markdownParseError) {
          console.error('Failed to parse JSON from markdown block. Attempted JSON string:', jsonString, 'Error:', markdownParseError);
          parseErrorOccurred = true;
        }
      } else {
        console.warn('Markdown JSON block not found. Will attempt to parse from curly braces.');
        parseErrorOccurred = true; // Proceed to next attempt
      }

      // Attempt 2: Find first '{' and last '}'
      if (parseErrorOccurred || !parsedResponse) {
        parseErrorOccurred = false; // Reset for this attempt
        const firstBrace = aiResponse.indexOf('{');
        const lastBrace = aiResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = aiResponse.substring(firstBrace, lastBrace + 1);
          try {
            parsedResponse = JSON.parse(jsonString);
            console.log('Successfully parsed JSON from first/last curly braces.');
          } catch (braceParseError) {
            console.error('Failed to parse JSON from first/last curly braces. Attempted JSON string:', jsonString, 'Error:', braceParseError);
            parseErrorOccurred = true;
          }
        } else {
          console.warn('Could not find valid first and last curly braces for JSON extraction.');
          parseErrorOccurred = true;
        }
      }

      if (parseErrorOccurred || !parsedResponse) {
        console.error('All JSON parsing attempts failed. Raw AI response:', aiResponse);
        // Keep the original error throwing logic or decide on a new one
        throw new Error('Failed to parse JSON from AI response after multiple attempts.');
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
      setAiError("No se pudieron generar sugerencias. Intente ajustar el cargo o inténtelo de nuevo más tarde.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            {aiError && (
              <p className="mt-2 text-sm text-red-600">{aiError}</p>
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
