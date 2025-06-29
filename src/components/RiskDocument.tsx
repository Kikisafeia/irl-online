import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, PenTool as Tool, FlaskRound as Flask, MapPin, FileText, Clipboard, BookOpen, HardHat, Loader, Search, ExternalLink } from 'lucide-react';
import { CompanyInfo, JobInfo, Protocol, RiskCategory } from '../types';
import { getAIRecommendations } from '../services/azureOpenAIService';
import { sanitizeInput } from '../utils/sanitization';
import { useToast } from '../contexts/ToastContext';

interface RiskDocumentProps {
  companyInfo: CompanyInfo;
  jobInfo: JobInfo;
  onBack: () => void;
  onReset: () => void;
}

const RiskDocument: React.FC<RiskDocumentProps> = ({
  companyInfo,
  jobInfo,
  onBack,
  onReset
}) => {
  const currentDate = new Date().toLocaleDateString('es-CL');
  const { addToast } = useToast();

  interface AIFetchState<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
  }

  interface RiskDocumentAIState {
    protocols: AIFetchState<Protocol[]>;
    risks: AIFetchState<RiskCategory[]>;
    epp: AIFetchState<string[]>;
    specialConditions: AIFetchState<string>;
    additionalInfo: AIFetchState<string>;
  }

  const [aiData, setAiData] = useState<RiskDocumentAIState>({
    protocols: { data: [], isLoading: false, error: null },
    risks: { data: [], isLoading: false, error: null },
    epp: { data: [], isLoading: false, error: null },
    specialConditions: { data: '', isLoading: false, error: null },
    additionalInfo: { data: '', isLoading: false, error: null },
  });

  // State for Brave Search
  const [braveSearchQuery, setBraveSearchQuery] = useState<string>('');
  // Ajusta 'any' al tipo de resultado específico que Brave Search devuelve
  const [braveSearchResults, setBraveSearchResults] = useState<any[] | null>(null);
  const [isBraveSearchLoading, setIsBraveSearchLoading] = useState<boolean>(false);
  const [braveSearchError, setBraveSearchError] = useState<string | null>(null);


  useEffect(() => {
    const fetchAiProtocols = async () => {
      setAiData(prev => ({ ...prev, protocols: { ...prev.protocols, isLoading: true, error: null } }));
      try {
        const prompt = `Genera una lista de protocolos de vigilancia del MINSAL de Chile relevantes para un puesto de trabajo con las siguientes características:
Cargo: ${jobInfo.position}
Tareas: ${jobInfo.tasks}
Entorno: ${jobInfo.environment}
Equipos: ${jobInfo.equipment}
Materiales: ${jobInfo.materials}
Condiciones Especiales: ${jobInfo.specialConditions}
Información Adicional: ${jobInfo.additionalInfo}

Formatea la respuesta como un array JSON VÁLIDO de objetos, donde cada objeto tenga las propiedades "name" (nombre del protocolo), "description" (una breve descripción), "applicable" (siempre true), y "url" (la URL al documento oficial del MINSAL si está disponible, de lo contrario omitir o usar string vacío). Incluye solo protocolos reales y relevantes del MINSAL de Chile.

Ejemplo de formato:
\`\`\`json
[
  {
    "name": "Protocolo PREXOR",
    "description": "Protocolo de Exposición Ocupacional a Ruido.",
    "applicable": true,
    "url": "https://www.minsal.cl/portal/url/item/75f75393a1871a75e04001016501542c.pdf"
  },
  {
    "name": "Protocolo TMERT",
    "description": "Protocolo de Vigilancia de Trastornos Musculoesqueléticos relacionados con el Trabajo.",
    "applicable": true,
    "url": "https://www.minsal.cl/portal/url/item/75f75393a1871a75e04001016501542d.pdf"
  },
  {
    "name": "Protocolo Desconocido Sin URL",
    "description": "Ejemplo de protocolo sin URL disponible.",
    "applicable": true
  }
]
\`\`\`
`;
        const aiResponse = await getAIRecommendations(prompt);
        // getAIRecommendations now returns parsed object directly or string
        const parsedResponse = aiResponse;

        if (Array.isArray(parsedResponse)) {
          setAiData(prev => ({ ...prev, protocols: { data: parsedResponse.map(p => ({
            ...p,
            name: sanitizeInput(p.name),
            description: sanitizeInput(p.description),
            url: p.url ? sanitizeInput(p.url) : undefined // Sanear URL si existe
          })), isLoading: false, error: null } }));
        } else {
          console.error('Parsed data for AI protocols is not an array. Raw AI response:', aiResponse, 'Parsed data:', parsedResponse);
          addToast("La respuesta de la IA para protocolos no es un array JSON válido.", 'error');
          setAiData(prev => ({ ...prev, protocols: { ...prev.protocols, isLoading: false, error: "La respuesta de la IA no es un array JSON válido para protocolos." } }));
          return; // Exit early to prevent further processing with bad data
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al generar protocolos de IA. Por favor, inténtelo de nuevo.';
        console.error('Error generating or parsing AI protocols:', err);
        addToast(errorMessage, 'error');
        setAiData(prev => ({ ...prev, protocols: { ...prev.protocols, isLoading: false, error: errorMessage } }));
      }
    };

    const fetchAiRisks = async () => {
      setAiData(prev => ({ ...prev, risks: { ...prev.risks, isLoading: true, error: null } }));
      try {
        const prompt = `Genera una lista de peligros y factores de riesgo relevantes para un puesto de trabajo con las siguientes características:
Cargo: ${jobInfo.position}
Tareas: ${jobInfo.tasks}
Entorno: ${jobInfo.environment}
Equipos: ${jobInfo.equipment}
Materiales: ${jobInfo.materials}
Condiciones Especiales: ${jobInfo.specialConditions}
Información Adicional: ${jobInfo.additionalInfo}

Formatea la respuesta como un array JSON VÁLIDO de objetos, donde cada objeto representa una categoría de riesgo y contiene un array de riesgos. Cada riesgo debe tener "name", "consequences" y "measures" (un array de strings). Incluye solo riesgos realistas y relevantes.

Ejemplo de formato:
\`\`\`json
[
  {
    "category": "Riesgos Físicos",
    "risks": [
      {
        "name": "Exposición a ruido",
        "consequences": "Hipoacusia, estrés",
        "measures": ["Uso de protección auditiva", "Controles de ingeniería"]
      }
    ]
  }
]
\`\`\`
`;
        const aiResponse = await getAIRecommendations(prompt);
        // getAIRecommendations now returns parsed object directly or string
        const parsedResponse = aiResponse;

        if (Array.isArray(parsedResponse)) {
          setAiData(prev => ({ ...prev, risks: { data: parsedResponse.map(cat => ({
            ...cat,
            category: sanitizeInput(cat.category),
            risks: cat.risks.map((r: any) => ({
              ...r,
              name: sanitizeInput(r.name),
              consequences: sanitizeInput(r.consequences),
              measures: r.measures.map(sanitizeInput)
            }))
          })), isLoading: false, error: null } }));
        } else {
          console.error('Parsed data for AI risks is not an array. Raw AI response:', aiResponse, 'Parsed data:', parsedResponse);
          addToast("La respuesta de la IA para riesgos no es un array JSON válido.", 'error');
          setAiData(prev => ({ ...prev, risks: { ...prev.risks, isLoading: false, error: "La respuesta de la IA no es un array JSON válido para riesgos." } }));
          return; // Exit early to prevent further processing with bad data
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al generar riesgos de IA. Por favor, inténtelo de nuevo.';
        console.error('Error generating or parsing AI risks:', err);
        addToast(errorMessage, 'error');
        setAiData(prev => ({ ...prev, risks: { ...prev.risks, isLoading: false, error: errorMessage } }));
      }
    };

    const fetchAiEpp = async () => {
      setAiData(prev => ({ ...prev, epp: { ...prev.epp, isLoading: true, error: null } }));
      try {
        const prompt = `Genera una lista de Elementos de Protección Personal (EPP) específicos y generales relevantes para un puesto de trabajo con las siguientes características:
Cargo: ${jobInfo.position}
Tareas: ${jobInfo.tasks}
Entorno: ${jobInfo.environment}
Equipos: ${jobInfo.equipment}
Materiales: ${jobInfo.materials}
Condiciones Especiales: ${jobInfo.specialConditions}
Información Adicional: ${jobInfo.additionalInfo}

Formatea la respuesta como un array JSON VÁLIDO de strings. Incluye solo EPP realistas y relevantes.

Ejemplo de formato:
\`\`\`json
[
  "Casco de seguridad",
  "Zapatos de seguridad con puntera reforzada",
  "Guantes de nitrilo",
  "Protección auditiva"
]
\`\`\`
`;
        const aiResponse = await getAIRecommendations(prompt);
        // getAIRecommendations now returns parsed object directly or string
        const parsedResponse = aiResponse;

        if (Array.isArray(parsedResponse) && parsedResponse.every(item => typeof item === 'string')) {
          setAiData(prev => ({ ...prev, epp: { data: parsedResponse.map(sanitizeInput), isLoading: false, error: null } }));
        } else {
          console.error('Parsed data for AI EPP is not a valid array of strings. Raw AI response:', aiResponse, 'Parsed data:', parsedResponse);
          addToast("La respuesta de la IA para EPP no es un array JSON válido de strings.", 'error');
          setAiData(prev => ({ ...prev, epp: { ...prev.epp, isLoading: false, error: "La respuesta de la IA no es un array JSON válido de strings para EPP." } }));
          return; // Exit early
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al generar EPP de IA. Por favor, inténtelo de nuevo.';
        console.error('Error generating or parsing AI EPP:', err);
        addToast(errorMessage, 'error');
        setAiData(prev => ({ ...prev, epp: { ...prev.epp, isLoading: false, error: errorMessage } }));
      }
    };

    const fetchAiSpecialConditions = async () => {
      setAiData(prev => ({ ...prev, specialConditions: { ...prev.specialConditions, isLoading: true, error: null } }));
      try {
        const prompt = `Genera una descripción de las condiciones especiales relevantes para un puesto de trabajo con las siguientes características:
Cargo: ${jobInfo.position}
Tareas: ${jobInfo.tasks}
Entorno: ${jobInfo.environment}
Equipos: ${jobInfo.equipment}
Materiales: ${jobInfo.materials}
Condiciones Especiales: ${jobInfo.specialConditions}
Información Adicional: ${jobInfo.additionalInfo}

Formatea la respuesta como un string de texto plano. Si no hay condiciones especiales, devuelve un string vacío.`;
        const aiResponse = await getAIRecommendations(prompt);
        // getAIRecommendations now returns parsed object directly or string
        setAiData(prev => ({ ...prev, specialConditions: { data: sanitizeInput(String(aiResponse)), isLoading: false, error: null } }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al generar condiciones especiales de IA. Por favor, inténtelo de nuevo.';
        console.error('Error generating AI special conditions:', err);
        addToast(errorMessage, 'error');
        setAiData(prev => ({ ...prev, specialConditions: { ...prev.specialConditions, isLoading: false, error: errorMessage } }));
      }
    };

    const fetchAiAdditionalInfo = async () => {
      setAiData(prev => ({ ...prev, additionalInfo: { ...prev.additionalInfo, isLoading: true, error: null } }));
      try {
        const prompt = `Genera información adicional relevante para un puesto de trabajo con las siguientes características:
Cargo: ${jobInfo.position}
Tareas: ${jobInfo.tasks}
Entorno: ${jobInfo.environment}
Equipos: ${jobInfo.equipment}
Materiales: ${jobInfo.materials}
Condiciones Especiales: ${jobInfo.specialConditions}
Información Adicional: ${jobInfo.additionalInfo}

Formatea la respuesta como un string de texto plano. Si no hay información adicional, devuelve un string vacío.`;
        const aiResponse = await getAIRecommendations(prompt);
        // getAIRecommendations now returns parsed object directly or string
        setAiData(prev => ({ ...prev, additionalInfo: { data: sanitizeInput(String(aiResponse)), isLoading: false, error: null } }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al generar información adicional de IA. Por favor, inténtelo de nuevo.';
        console.error('Error generating AI additional info:', err);
        addToast(errorMessage, 'error');
        setAiData(prev => ({ ...prev, additionalInfo: { ...prev.additionalInfo, isLoading: false, error: errorMessage } }));
      }
    };


    fetchAiProtocols();
    fetchAiRisks();
    fetchAiEpp();
    fetchAiSpecialConditions();
    fetchAiAdditionalInfo();
  }, [jobInfo]); // Re-ejecutar cuando cambie la información del puesto de trabajo

  // Generar protocolos aplicables según el puesto
  const generateProtocols = () => {
    const protocols = [];
    
    // Protocolo de Manejo Manual de Cargas
    if (jobInfo.tasks.toLowerCase().includes('carga') || 
        jobInfo.tasks.toLowerCase().includes('levant') ||
        jobInfo.specialConditions.toLowerCase().includes('carga')) {
      protocols.push({
        name: 'Manejo Manual de Cargas (MMC)',
        description: 'Aplicable a tareas que requieren levantar, transportar, empujar o arrastrar cargas',
        applicable: true
      });
    }
    
    // Protocolo PREXOR
    if (jobInfo.environment.toLowerCase().includes('ruido') || 
        jobInfo.specialConditions.toLowerCase().includes('ruido')) {
      protocols.push({
        name: 'Protocolo de Exposición Ocupacional a Ruido (PREXOR)',
        description: 'Aplicable a puestos con exposición a ruido igual o superior a 80 dB(A)',
        applicable: true
      });
    }
    
    // Protocolo TMERT
    if (jobInfo.tasks.toLowerCase().includes('repetitiv') || 
        jobInfo.specialConditions.toLowerCase().includes('repetitiv')) {
      protocols.push({
        name: 'Trastornos Musculoesqueléticos de Extremidades Superiores (TMERT)',
        description: 'Aplicable a tareas con movimientos repetitivos de extremidades superiores',
        applicable: true
      });
    }
    
    // Protocolo Psicosocial
    protocols.push({
      name: 'Protocolo de Vigilancia de Riesgos Psicosociales',
      description: 'Aplicable a todos los puestos de trabajo',
      applicable: true
    });
    
    return protocols;
  };

  const staticProtocols = generateProtocols(); // Protocolos estáticos existentes

  const [editableRisks, setEditableRisks] = useState<RiskCategory[]>([]);

  useEffect(() => {
    if (!aiData.risks.isLoading && JSON.stringify(editableRisks) !== JSON.stringify(aiData.risks.data || [])) {
      setEditableRisks(aiData.risks.data || []);
    }
  }, [aiData.risks.data, aiData.risks.isLoading, editableRisks]);

  // Combinar protocolos estáticos y generados por IA para la edición
  const [editableProtocols, setEditableProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    if (!aiData.protocols.isLoading) {
      const aiProtocolsData = aiData.protocols.data || [];
      const combinedProtocols = [...staticProtocols, ...aiProtocolsData];
      if (JSON.stringify(editableProtocols) !== JSON.stringify(combinedProtocols)) {
        setEditableProtocols(combinedProtocols);
      }
    }
  }, [staticProtocols, aiData.protocols.data, aiData.protocols.isLoading, editableProtocols]);

  const [editableEpp, setEditableEpp] = useState<string[]>([]);

  useEffect(() => {
    if (!aiData.epp.isLoading && JSON.stringify(editableEpp) !== JSON.stringify(aiData.epp.data || [])) {
      setEditableEpp(aiData.epp.data || []);
    }
  }, [aiData.epp.data, aiData.epp.isLoading, editableEpp]);

  const [editableSpecialConditions, setEditableSpecialConditions] = useState<string>('');

  useEffect(() => {
    if (!aiData.specialConditions.isLoading && editableSpecialConditions !== (aiData.specialConditions.data || '')) {
      setEditableSpecialConditions(aiData.specialConditions.data || '');
    }
  }, [aiData.specialConditions.data, aiData.specialConditions.isLoading, editableSpecialConditions]);

  const [editableAdditionalInfo, setEditableAdditionalInfo] = useState<string>('');

  useEffect(() => {
    if (!aiData.additionalInfo.isLoading && editableAdditionalInfo !== (aiData.additionalInfo.data || '')) {
      setEditableAdditionalInfo(aiData.additionalInfo.data || '');
    }
  }, [aiData.additionalInfo.data, aiData.additionalInfo.isLoading, editableAdditionalInfo]);

  const handleBraveSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!braveSearchQuery.trim()) {
      addToast("Por favor, ingrese un término de búsqueda para Brave Search.", 'warning');
      setBraveSearchError("Por favor, ingrese un término de búsqueda."); // Keep for local state
      setBraveSearchResults(null);
      return;
    }
    setIsBraveSearchLoading(true);
    setBraveSearchError(null);
    setBraveSearchResults(null);
    try {
      const response = await fetch(`/api/brave-search?q=${encodeURIComponent(braveSearchQuery)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      // Asumiendo que 'data' es el array de resultados o un objeto que los contiene.
      // Por ejemplo, si los resultados están en data.web.results o similar:
      setBraveSearchResults(data.web?.results || data.results || data || []);
    } catch (error: any) {
      const errorMessage = error.message || "Ocurrió un error al realizar la búsqueda.";
      addToast(`Error en Brave Search: ${errorMessage}`, 'error');
      setBraveSearchError(errorMessage); // Keep for local state
    } finally {
      setIsBraveSearchLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Información de Riesgos Laborales (IRL)</h2>
        <p className="text-gray-600">Fecha: {currentDate}</p>
      </div>

      {/* Company Information Section */}
      <section className="bg-blue-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <Info size={24} />
          Información de la Empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Nombre de la Empresa</p>
            <p className="font-medium">{companyInfo.name}</p>
          </div>
          <div>
            <p className="text-gray-600">RUT</p>
            <p className="font-medium">{companyInfo.rut}</p>
          </div>
          <div>
            <p className="text-gray-600">Dirección</p>
            <p className="font-medium">{companyInfo.address}</p>
          </div>
          <div>
            <p className="text-gray-600">Actividad Principal</p>
            <p className="font-medium">{companyInfo.activity}</p>
          </div>
          <div>
            <p className="text-gray-600">Contacto</p>
            <p className="font-medium">{companyInfo.contact}</p>
          </div>
        </div>
      </section>

      {/* Job Position Information */}
      <section className="bg-green-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
          <Tool size={24} />
          Información del Puesto de Trabajo
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Cargo o Función</p>
            <p className="font-medium">{jobInfo.position}</p>
          </div>
          <div>
            <p className="text-gray-600">Tareas Principales</p>
            <p className="font-medium whitespace-pre-line">{jobInfo.tasks}</p>
          </div>
          <div>
            <p className="text-gray-600">Lugar de Trabajo</p>
            <div className="flex items-start gap-2 mt-1">
              <MapPin className="text-gray-500 mt-1" size={20} />
              <p className="font-medium">{jobInfo.environment}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment and Materials */}
      <section className="bg-purple-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center gap-2">
          <Flask size={24} />
          Equipos y Materiales
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Equipos y Herramientas</p>
            <p className="font-medium whitespace-pre-line">{jobInfo.equipment}</p>
          </div>
          <div>
            <p className="text-gray-600">Materiales y Sustancias</p>
            <p className="font-medium whitespace-pre-line">{jobInfo.materials}</p>
          </div>
        </div>
      </section>

      {/* Risks and Hazards */}
      <section className="bg-red-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={24} />
          Identificación de Peligros y Factores de Riesgo
        </h3>
        <div className="space-y-6">
          {aiData.risks.isLoading && (
            <div className="flex items-center justify-center p-4 text-red-600">
              <Loader className="animate-spin mr-2" size={20} />
              Generando riesgos con IA...
            </div>
          )}

          {aiData.risks.error && (
            <div className="p-4 text-red-600 bg-red-100 rounded-md">
              <p>{aiData.risks.error}</p>
            </div>
          )}

          {!aiData.risks.isLoading && !aiData.risks.error && editableRisks.map((riskCategory, categoryIndex) => (
            <div key={categoryIndex} className="space-y-4 bg-red-100 p-4 rounded-md relative">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  value={riskCategory.category}
                  onChange={(e) => {
                    const newRisks = [...editableRisks];
                    newRisks[categoryIndex].category = e.target.value;
                    setEditableRisks(newRisks);
                  }}
                  className="font-semibold text-lg text-red-700 w-full border-b border-red-300 focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={() => {
                    setEditableRisks(editableRisks.filter((_, i) => i !== categoryIndex));
                  }}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Eliminar categoría"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-4">
                {riskCategory.risks.map((risk, riskIndex) => (
                  <div key={riskIndex} className="bg-white p-4 rounded-md shadow-sm relative">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <input
                        type="text"
                        value={risk.name}
                        onChange={(e) => {
                          const newRisks = [...editableRisks];
                          newRisks[categoryIndex].risks[riskIndex].name = e.target.value;
                          setEditableRisks(newRisks);
                        }}
                        className="font-semibold text-gray-800 w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newRisks = [...editableRisks];
                          newRisks[categoryIndex].risks = newRisks[categoryIndex].risks.filter((_, i) => i !== riskIndex);
                          setEditableRisks(newRisks);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Eliminar riesgo"
                      >
                        &times;
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-600 text-sm">Posibles consecuencias:</p>
                      <textarea
                        value={risk.consequences}
                        onChange={(e) => {
                          const newRisks = [...editableRisks];
                          newRisks[categoryIndex].risks[riskIndex].consequences = e.target.value;
                          setEditableRisks(newRisks);
                        }}
                        rows={1}
                        className="font-medium w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 resize-y"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="text-gray-600 text-sm">Medidas preventivas:</p>
                      <textarea
                        value={risk.measures.join('\n')}
                        onChange={(e) => {
                          const newRisks = [...editableRisks];
                          newRisks[categoryIndex].risks[riskIndex].measures = e.target.value.split('\n');
                          setEditableRisks(newRisks);
                        }}
                        rows={3}
                        className="font-medium w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 resize-y"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newRisks = [...editableRisks];
                    newRisks[categoryIndex].risks.push({
                      name: '',
                      consequences: '',
                      measures: ['']
                    });
                    setEditableRisks(newRisks);
                  }}
                  className="mt-2 px-3 py-1 bg-red-400 text-white rounded-md hover:bg-red-500 flex items-center gap-1 text-sm"
                >
                  <AlertTriangle size={14} />
                  Agregar Riesgo
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setEditableRisks([
                ...editableRisks,
                { category: '', risks: [{ name: '', consequences: '', measures: [''] }] }
              ]);
            }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            Agregar Categoría de Riesgo
          </button>
        </div>
      </section>

      {/* Protocolos Aplicables */}
      <section className="bg-blue-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <Clipboard size={24} />
          Protocolos de Vigilancia Aplicables
        </h3>
        <div className="space-y-4">
          {aiData.protocols.isLoading && (
            <div className="flex items-center justify-center p-4 text-blue-600">
              <Loader className="animate-spin mr-2" size={20} />
              Generando protocolos MINSAL con IA...
            </div>
          )}

          {aiData.protocols.error && (
            <div className="p-4 text-red-600 bg-red-100 rounded-md">
              <p>{aiData.protocols.error}</p>
            </div>
          )}

          {!aiData.protocols.isLoading && !aiData.protocols.error && editableProtocols.map((protocol, index) => (
            <div key={index} className="bg-white p-4 rounded-md shadow-sm relative space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                <input
                  type="text"
                  value={protocol.name}
                  placeholder="Nombre del Protocolo"
                  onChange={(e) => {
                    const newProtocols = [...editableProtocols];
                    newProtocols[index] = { ...newProtocols[index], name: e.target.value };
                    setEditableProtocols(newProtocols);
                  }}
                  className="font-semibold text-gray-800 w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
              </div>
              <textarea
                value={protocol.description}
                placeholder="Descripción del Protocolo"
                onChange={(e) => {
                  const newProtocols = [...editableProtocols];
                  newProtocols[index] = { ...newProtocols[index], description: e.target.value };
                  setEditableProtocols(newProtocols);
                }}
                rows={2}
                className="text-gray-700 w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 resize-y"
              />
              <input
                type="url"
                value={protocol.url || ''}
                placeholder="URL del Documento (opcional)"
                onChange={(e) => {
                  const newProtocols = [...editableProtocols];
                  newProtocols[index] = { ...newProtocols[index], url: e.target.value };
                  setEditableProtocols(newProtocols);
                }}
                className="text-sm text-blue-500 w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
              />
              {protocol.url && (
                <a
                  href={protocol.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {protocol.url}
                </a>
              )}
              <button
                onClick={() => {
                  setEditableProtocols(editableProtocols.filter((_, i) => i !== index));
                }}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                title="Eliminar protocolo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              setEditableProtocols([
                ...editableProtocols,
                { name: '', description: '', applicable: true, url: '' }
              ]);
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 text-sm"
          >
            <BookOpen size={16} />
            Agregar Protocolo
          </button>
        </div>
      </section>

      {/* Elementos de Protección Personal */}
      <section className="bg-yellow-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center gap-2">
          <HardHat size={24} />
          Elementos de Protección Personal (EPP)
        </h3>
        <div className="space-y-4">
          {aiData.epp.isLoading && (
            <div className="flex items-center justify-center p-4 text-yellow-600">
              <Loader className="animate-spin mr-2" size={20} />
              Generando EPP con IA...
            </div>
          )}

          {aiData.epp.error && (
            <div className="p-4 text-red-600 bg-red-100 rounded-md">
              <p>{aiData.epp.error}</p>
            </div>
          )}

          {!aiData.epp.isLoading && !aiData.epp.error && editableEpp.map((eppItem, index) => (
            <div key={index} className="bg-white p-4 rounded-md shadow-sm relative">
              <div className="flex items-center gap-2 mb-2">
                <HardHat size={16} className="text-yellow-600" />
                <input
                  type="text"
                  value={eppItem}
                  onChange={(e) => {
                    const newEpp = [...editableEpp];
                    newEpp[index] = e.target.value;
                    setEditableEpp(newEpp);
                  }}
                  className="font-semibold text-gray-800 w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    setEditableEpp(editableEpp.filter((_, i) => i !== index));
                  }}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Eliminar EPP"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setEditableEpp([...editableEpp, '']);
            }}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
          >
            <HardHat size={16} />
            Agregar EPP
          </button>
        </div>
      </section>

      {/* Special Conditions and Additional Info */}
      <section className="bg-yellow-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={24} />
          Condiciones Especiales y Observaciones
        </h3>
        <div className="space-y-4">
          {aiData.specialConditions.isLoading && (
            <div className="flex items-center justify-center p-4 text-yellow-600">
              <Loader className="animate-spin mr-2" size={20} />
              Generando condiciones especiales con IA...
            </div>
          )}
          {aiData.specialConditions.error && (
            <div className="p-4 text-red-600 bg-red-100 rounded-md">
              <p>{aiData.specialConditions.error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones Especiales
            </label>
            <textarea
              value={editableSpecialConditions}
              onChange={(e) => setEditableSpecialConditions(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Indique condiciones particulares (ej: trabajo en altura, espacios confinados)"
            />
          </div>
          {aiData.additionalInfo.isLoading && (
            <div className="flex items-center justify-center p-4 text-yellow-600">
              <Loader className="animate-spin mr-2" size={20} />
              Generando información adicional con IA...
            </div>
          )}
          {aiData.additionalInfo.error && (
            <div className="p-4 text-red-600 bg-red-100 rounded-md">
              <p>{aiData.additionalInfo.error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Información Adicional
            </label>
            <textarea
              value={editableAdditionalInfo}
              onChange={(e) => setEditableAdditionalInfo(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="Información adicional relevante"
            />
          </div>
        </div>
      </section>

      {/* Brave Search Section */}
      <section className="bg-indigo-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center gap-2">
          <Search size={24} />
          Búsqueda de Información Adicional (Brave Search)
        </h3>
        <form onSubmit={handleBraveSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={braveSearchQuery}
            onChange={(e) => setBraveSearchQuery(e.target.value)}
            placeholder="Buscar protocolos, normativas, etc."
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isBraveSearchLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2"
          >
            {isBraveSearchLoading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
            Buscar
          </button>
        </form>

        {isBraveSearchLoading && (
          <div className="flex items-center justify-center p-4 text-indigo-600">
            <Loader className="animate-spin mr-2" size={20} />
            Buscando...
          </div>
        )}
        {braveSearchError && (
          <div className="p-4 text-red-700 bg-red-100 rounded-md">
            <p>Error: {braveSearchError}</p>
          </div>
        )}
        {braveSearchResults && braveSearchResults.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="text-md font-semibold text-indigo-700">Resultados de la búsqueda:</h4>
            {braveSearchResults.map((result, index) => (
              <div key={index} className="p-3 border rounded-md bg-white shadow-sm">
                <a href={result.url || '#'} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium flex items-center gap-1">
                  {result.title || 'Resultado sin título'} <ExternalLink size={14} />
                </a>
                <p className="text-sm text-gray-600 mt-1">{result.description || result.snippet || 'Sin descripción.'}</p>
                {result.page_age && <p className="text-xs text-gray-400 mt-1">Actualizado: {new Date(result.page_age).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        )}
        {braveSearchResults && braveSearchResults.length === 0 && !isBraveSearchLoading && !braveSearchError && (
          <p className="text-gray-500 italic">No se encontraron resultados para "{braveSearchQuery}".</p>
        )}
      </section>

      {/* Obligaciones del Trabajador */}
      <section className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={24} />
          Obligaciones del Trabajador
        </h3>
        <div className="space-y-2">
          <p>El trabajador se compromete a:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Cumplir con las normas e instrucciones de seguridad establecidas por la empresa.</li>
            <li>Utilizar correctamente los elementos de protección personal proporcionados.</li>
            <li>Informar inmediatamente cualquier condición de riesgo no controlada.</li>
            <li>Participar en las actividades de capacitación en materia de seguridad.</li>
            <li>No operar equipos o realizar tareas para las cuales no ha sido capacitado.</li>
            <li>Mantener su área de trabajo limpia y ordenada.</li>
          </ul>
        </div>
      </section>

      {/* Constancia de Recepción */}
      <section className="bg-white p-6 rounded-lg border border-gray-300 shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Constancia de Recepción</h3>
        <p className="mb-4">
          Declaro haber recibido, leído y comprendido la Información de Riesgos Laborales (IRL) correspondiente a mi puesto de trabajo, 
          comprometiéndome a cumplir con las medidas preventivas indicadas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="border-t pt-4 text-center">
            <p className="text-gray-500">Firma del Trabajador</p>
          </div>
          <div className="border-t pt-4 text-center">
            <p className="text-gray-500">Firma y Timbre Empresa</p>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
        <div className="space-x-4">
          <button
            onClick={onReset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nuevo Documento
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskDocument;
