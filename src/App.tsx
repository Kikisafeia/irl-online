import { useState, useEffect } from 'react';
import { Building2, Briefcase, FileText } from 'lucide-react';
import CompanyForm from './components/CompanyForm';
import JobPositionForm from './components/JobPositionForm';
import RiskDocument from './components/RiskDocument';
import LoginPopup from './components/LoginPopup'; // Importar LoginPopup
import { CompanyInfo, JobInfo } from './types';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [showLoginPopup, setShowLoginPopup] = useState(true); // Estado para controlar la visibilidad del popup
  const [step, setStep] = useState(1);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    rut: '',
    address: '',
    activity: '',
    contact: ''
  });
  
  const [jobInfo, setJobInfo] = useState<JobInfo>({
    position: '',
    tasks: '',
    environment: '',
    equipment: '',
    materials: '',
    specialConditions: '',
    additionalInfo: ''
  });

  const handleCompanySubmit = (data: CompanyInfo) => {
    setCompanyInfo(data);
    setStep(2);
  };

  const handleJobSubmit = (data: JobInfo) => {
    setJobInfo(data);
    setStep(3);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setCompanyInfo({
      name: '',
      rut: '',
      address: '',
      activity: '',
      contact: ''
    });
    setJobInfo({
      position: '',
      tasks: '',
      environment: '',
      equipment: '',
      materials: '',
      specialConditions: '',
      additionalInfo: ''
    });
  };

  const handleLoginSubmit = async (data: { name: string; email: string }) => {
    console.log('Datos de inicio de sesión:', data);
    const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Error: VITE_MAKE_WEBHOOK_URL no está configurada.');
      // Optionally: show a message to the user
      return;
    }
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        console.log('Login successful');
        setShowLoginPopup(false); // Cerrar popup al iniciar sesión exitosamente
      } else {
        console.error('Login failed:', response.statusText);
        // Manejar error de inicio de sesión
      }
    } catch (error) {
      console.error('Error al enviar datos:', error);
    }
  };

  const handleCloseLoginPopup = () => {
    setShowLoginPopup(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {showLoginPopup && (
          <LoginPopup onClose={handleCloseLoginPopup} onSubmit={handleLoginSubmit} />
        )}
        <header className="bg-blue-700 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Sistema de Información de Riesgos Laborales (IRL)</h1>
            <p className="text-blue-100">Conforme al Decreto Supremo N° 44 de 2023 y Ley N° 16.744</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="mb-8 px-4 sm:px-0"> {/* Added horizontal padding for small screens */}
            <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left">
              {/* Step 1: Empresa */}
              <div className={`flex flex-col items-center sm:flex-row sm:flex-1 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'} mb-4 sm:mb-0`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'} flex-shrink-0`}>
                  <Building2 size={20} />
                </div>
                <span className="mt-2 sm:mt-0 sm:ml-2 text-sm sm:text-base font-medium whitespace-nowrap">Empresa</span>
              </div>

              {/* Separator 1 */}
              <div className={`flex-1 h-1 w-full sm:w-auto mx-0 sm:mx-4 my-2 sm:my-0 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} hidden sm:block`}></div> {/* Hide on mobile */}
              <div className={`w-px h-8 mx-auto ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} block sm:hidden`}></div> {/* Vertical separator for mobile */}

              {/* Step 2: Puesto de Trabajo */}
              <div className={`flex flex-col items-center sm:flex-row sm:flex-1 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'} mb-4 sm:mb-0`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'} flex-shrink-0`}>
                  <Briefcase size={20} />
                </div>
                <span className="mt-2 sm:mt-0 sm:ml-2 text-sm sm:text-base font-medium whitespace-nowrap">Puesto de Trabajo</span>
              </div>

              {/* Separator 2 */}
              <div className={`flex-1 h-1 w-full sm:w-auto mx-0 sm:mx-4 my-2 sm:my-0 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'} hidden sm:block`}></div> {/* Hide on mobile */}
              <div className={`w-px h-8 mx-auto ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'} block sm:hidden`}></div> {/* Vertical separator for mobile */}

              {/* Step 3: Documento IRL */}
              <div className={`flex flex-col items-center sm:flex-row sm:flex-1 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'} flex-shrink-0`}>
                  <FileText size={20} />
                </div>
                <span className="mt-2 sm:mt-0 sm:ml-2 text-sm sm:text-base font-medium whitespace-nowrap">Documento IRL</span>
              </div>
            </div>
          </div>

          {/* Form Steps */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {step === 1 && (
              <CompanyForm initialData={companyInfo} onSubmit={handleCompanySubmit} />
            )}
            
            {step === 2 && (
              <JobPositionForm 
                initialData={jobInfo} 
                onSubmit={handleJobSubmit} 
                onBack={handleBack} 
              />
            )}
            
            {step === 3 && (
              <RiskDocument 
                companyInfo={companyInfo} 
                jobInfo={jobInfo} 
                onBack={handleBack}
                onReset={handleReset}
              />
            )}
          </div>

        </main>

        <footer className="bg-gray-800 text-white py-4 mt-8">
          <div className="container mx-auto px-4 text-center">
            <p>© 2025 - Sistema de Información de Riesgos Laborales</p>
            <p className="text-sm text-gray-400 mt-1">
              Desarrollado para cumplir con las exigencias del Artículo 15 del D.S. N° 44 de 2023
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
