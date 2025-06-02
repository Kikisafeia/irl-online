# IRL Online - Sistema de Evaluación de Riesgos Laborales

Aplicación web para crear y evaluar descripciones de puestos de trabajo con inteligencia artificial.

## Tecnologías Principales

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- Azure OpenAI Service

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/Kikisafeia/irl-online.git
cd irl-online
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear un archivo `.env` con:
```
VITE_AZURE_OPENAI_ENDPOINT=tu_endpoint
VITE_AZURE_OPENAI_API_KEY=tu_api_key
VITE_AZURE_OPENAI_DEPLOYMENT=nombre_deployment
```

## Scripts Disponibles

- `npm run dev`: Inicia servidor de desarrollo
- `npm run build`: Crea versión de producción
- `npm run preview`: Previsualiza build de producción
- `npm run lint`: Ejecuta linter

## Estructura de Archivos

```
src/
├── components/       # Componentes React
│   ├── JobPositionForm.tsx  # Formulario de puesto de trabajo
│   ├── RiskDocument.tsx     # Documento de evaluación de riesgos
│   └── ...otros componentes
├── services/         # Servicios externos
│   └── azureOpenAIService.ts  # Conexión con Azure OpenAI
├── types.ts          # Tipos TypeScript
└── ...otros archivos
```

## Funcionalidades Clave

- Formulario interactivo para descripción de puestos
- Generación de recomendaciones con IA
- Validación de datos en tiempo real
- Interfaz responsive con Tailwind CSS
- Tipado seguro con TypeScript

## Despliegue

El proyecto está configurado para despliegue en Vercel con:
- Build command: `npm run build`
- Output directory: `dist`
- Node.js version: 18.x

## Contribución

1. Haz fork del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
