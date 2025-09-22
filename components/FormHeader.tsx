

import React from 'react';
import type { HeaderData } from '../types';

interface FormHeaderProps {
  data: HeaderData;
  onChange: (field: keyof HeaderData, value: string) => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({ data, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
      <div>
        <label htmlFor="assessmentDate" className="block text-sm font-medium text-gray-700 mb-1">
          Assessment Date
        </label>
        <input
          type="date"
          id="assessmentDate"
          value={data.assessmentDate}
          onChange={(e) => onChange('assessmentDate', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="areaLocation" className="block text-sm font-medium text-gray-700 mb-1">
          Area/Location
        </label>
        <input
          type="text"
          id="areaLocation"
          value={data.areaLocation}
          onChange={(e) => onChange('areaLocation', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Warehouse A"
          required
        />
      </div>
       <div>
        <label htmlFor="assessorName" className="block text-sm font-medium text-gray-700 mb-1">
          Assessor Name
        </label>
        <input
          type="text"
          id="assessorName"
          value={data.assessorName}
          onChange={(e) => onChange('assessorName', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Assessor's full name"
          required
        />
      </div>
    </div>
  );
};

export default FormHeader;