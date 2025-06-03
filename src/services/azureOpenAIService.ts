// Servicio de recomendaciones de IA - Versión segura para backend
// NOTA: Esta es una implementación simulada que deberá ser reemplazada
// por llamadas reales a un endpoint backend

export const getAIRecommendations = async (prompt: string): Promise<string> => {
  // TODO: Implementar llamada real al backend
  console.log('Llamando a /api/ai-recommendations con prompt:', prompt);

  // Implementación temporal simulada
  try {
    // Código real iría aquí:
    // const response = await fetch('/api/ai-recommendations', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ prompt }),
    // });
    // const data = await response.json();
    // return data.recommendation;

    // Simulación de respuesta JSON válida para desarrollo
    return JSON.stringify({
      tasks: "Tareas simuladas: Analizar requisitos, desarrollar software, realizar pruebas.",
      environment: "Entorno simulado: Oficina, trabajo remoto, reuniones virtuales.",
      equipment: "Equipo simulado: Laptop, IDE, herramientas de comunicación.",
      materials: "Materiales simulados: Documentación técnica, café.",
      specialConditions: "Condiciones simuladas: Plazos ajustados, colaboración en equipo.",
      additionalInfo: "Información adicional simulada: Oportunidades de aprendizaje."
    });
  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    throw error;
  }
};
