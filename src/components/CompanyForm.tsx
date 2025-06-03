import React from 'react';
import { Building2, Hash, MapPin, Briefcase, Phone } from 'lucide-react';
import { CompanyInfo } from '../types';

// General UI/UX Note: For user notifications (errors, successes, warnings), consider implementing a consistent
// feedback system, such as toast notifications or inline messages, throughout the application.

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

interface CompanyFormProps {
  initialData: CompanyInfo;
  onSubmit: (data: CompanyInfo) => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = React.useState<CompanyInfo>(initialData);

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
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center justify-center">
        <Building2 className="mr-3 text-blue-600" size={28} />
        Información de la Empresa
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Nombre de la Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Empresa
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese el nombre de la empresa"
              />
            </div>
          </div>

          {/* RUT de la Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT de la Empresa
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 76.123.456-7"
              />
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Información de Contacto
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Teléfono y/o correo electrónico"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dirección completa"
              />
            </div>
          </div>

          {/* Actividad Económica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actividad Económica
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="activity"
                value={formData.activity}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Actividad principal de la empresa"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;
