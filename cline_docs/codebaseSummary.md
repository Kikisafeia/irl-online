# Codebase Summary

## Key Components and their Interactions

- **Frontend (`src/`)**:
    - `App.tsx`: Componente principal de la aplicación.
    - `main.tsx`: Punto de entrada de la aplicación React.
    - `components/`: Contiene los componentes de UI:
        - `CompanyForm.tsx`: Formulario para la información de la empresa.
        - `JobPositionForm.tsx`: Formulario para la información de la posición laboral.
        - `RiskDocument.tsx`: Componente para mostrar documentos de riesgo.
        - `AIRecommendation.tsx`: Componente para mostrar recomendaciones de IA.
    - `services/azureOpenAIService.ts`: Servicio para interactuar con Azure OpenAI.
    - `index.css`, `tailwind.config.js`, `postcss.config.js`: Archivos de configuración de estilos.

- **Backend (`server/`)**:
    - `index.js`: Servidor Express que maneja las solicitudes API.

## Data Flow Overview

1. El usuario interactúa con los formularios en el frontend.
2. Los datos se envían al backend a través de solicitudes API.
3. El backend procesa los datos y, si es necesario, interactúa con el servicio Azure OpenAI.
4. Las respuestas del backend se envían de vuelta al frontend para su visualización.

## External Dependencies

- **Frontend**: `react`, `react-dom`, `tailwindcss`, `vite`.
- **Backend**: `express`, `cors`, `axios` (posiblemente para llamadas a Azure OpenAI).

## Recent Significant Changes

- Creación de la estructura de directorios para el frontend y el backend.
- Implementación de los componentes de UI principales.
- Configuración inicial de Vite y Tailwind CSS.
- Configuración del servidor Express.

## User Feedback Integration

- No hay feedback de usuario específico integrado en esta fase.

## Supplementary References

- No hay documentos suplementarios en `cline_docs` todavía.
