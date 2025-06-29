import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { JobInfo } from '../types';
import { getAIRecommendations } from '../services/azureOpenAIService';
import { sanitizeInput } from '../utils/sanitization';
import { useToast } from '../contexts/ToastContext';

const JOB_DESCRIPTION_PROMPT_TEMPLATE = (position: string) => `User-provided position: "${position}"

Based on the user-provided position above, create a detailed job description including the following sections:
- Main Tasks
- Work Environment
- Equipment, Machinery, and Tools
- Materials and Substances
- Special Conditions
- Additional Information

Ensure the response is formatted as a VALID JSON object, including all necessary commas between properties. The keys should be: tasks, environment, equipment, materials, specialConditions, additionalInfo. Each value should be a string with line breaks for lists. The response MUST be in Spanish.

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

Consider edge cases, such as when information for a certain section is unavailable or not applicable, and how to properly reflect that in the JSON output.`;

interface JobPositionFormProps {
  initialData: JobInfo;
  onSubmit: (data: JobInfo) => void;
  onBack: () => void;
}

const JobPositionForm: React.FC<JobPositionFormProps> = ({ initialData, onSubmit, onBack }) => {
  const [formData, setFormData] = useState<JobInfo>(initialData);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { addToast } = useToast();

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, position }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: sanitizeInput(value) }));
  };

  const handleSuggest = async () => {
    setIsLoadingSuggestions(true);
    try {
      const prompt = JOB_DESCRIPTION_PROMPT_TEMPLATE(formData.position);
      const aiResponse = await getAIRecommendations(prompt);
      
      console.log('Respuesta de IA:', aiResponse); // Log para diagnóstico
      
      const parsedResponse = aiResponse; // getAIRecommendations now returns parsed object directly

      // Validar estructura del JSON
      if (!parsedResponse || 
          typeof parsedResponse !== 'object' || 
          !('tasks' in parsedResponse)) {
        throw new Error('La respuesta de la IA no tiene el formato esperado o está incompleta.');
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
    } catch (err) {
      const error = err as Error;
      console.error('Error generando sugerencias:', error);
      addToast(`Error al generar sugerencias: ${error.message}. Por favor verifica: 1. Que el cargo esté bien escrito. 2. Que la conexión a internet funcione. 3. Intenta nuevamente más tarde.`, 'error');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
        <Briefcase className="mr-2 text-blue-600" />
        Información del Puesto de Trabajo
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
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
                className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del cargo o función"
              />
            </div>
            {formData.position.length > 0 && (
              <button
                type="button"
                onClick={handleSuggest}
                disabled={isLoadingSuggestions}
                className="mt-3 w-full sm:w-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingSuggestions ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </span>
                ) : 'Sugerir contenido para este cargo'}
              </button>
            )}
          </div>

          {/* Tareas Principales */}
          <div>
            <label htmlFor="tasks" className="block text-sm font-medium text-gray-700 mb-1">
              Tareas Principales
            </label>
            <textarea
              id="tasks"
              name="tasks"
              value={formData.tasks}
              onChange={handleChange}
              rows={4}
              className="block w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe las tareas principales del cargo..."
            ></textarea>
          </div>

          {/* Ambiente de Trabajo */}
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
              Ambiente de Trabajo
            </label>
            <textarea
              id="environment"
              name="environment"
              value={formData.environment}
              onChange={handleChange}
              rows={4}
              className="block w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe el ambiente de trabajo..."
            ></textarea>
          </div>

          {/* Equipos, Maquinarias y Herramientas */}
          <div>
            <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-1">
              Equipos, Maquinarias y Herramientas
            </label>
            <textarea
              id="equipment"
              name="equipment"
              value={formData.equipment}
              onChange={handleChange}
              rows={4}
              className="block w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Lista los equipos, maquinarias y herramientas..."
            ></textarea>
          </div>

          {/* Materiales y Sustancias */}
          <div>
            <label htmlFor="materials" className="block text-sm font-medium text-gray-700 mb-1">
              Materiales y Sustancias
            </label>
            <textarea
              id="materials"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              rows={4}
              className="block w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Lista los materiales y sustancias..."
            ></textarea>
          </div>

          {/* Condiciones Especiales */}
          <div>
            <label htmlFor="specialConditions" className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones Especiales
            </label>
            <textarea
              id="specialConditions"
              name="specialConditions"
              value={formData.specialConditions}
              onChange={handleChange}
              rows={4}
              className="block w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe cualquier condición especial..."
            ></textarea>
          </div>

          {/* Información Adicional */}
          <div>
            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
              Información Adicional
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={4}
              className="block w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Añade cualquier información adicional relevante..."
            ></textarea>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Volver
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPositionForm;
