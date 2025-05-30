import { useState } from 'react';
import { Building2, Briefcase, FileText } from 'lucide-react';
import CompanyForm from './components/CompanyForm';
import JobPositionForm from './components/JobPositionForm';
import RiskDocument from './components/RiskDocument';
import { CompanyInfo, JobInfo } from './types';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  console.log('App component rendered'); // Keep this log for debugging
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-700 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Sistema de Información de Riesgos Laborales (IRL)</h1>
            <p className="text-blue-100">Conforme al Decreto Supremo N° 44 de 2023 y Ley N° 16.744</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>
                  <Building2 size={20} />
                </div>
                <span className="ml-2 font-medium">Empresa</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>
                  <Briefcase size={20} />
                </div>
                <span className="ml-2 font-medium">Puesto de Trabajo</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-100' : 'border-gray-400'}`}>
                  <FileText size={20} />
                </div>
                <span className="ml-2 font-medium">Documento IRL</span>
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
