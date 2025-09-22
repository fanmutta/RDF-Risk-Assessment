
import React from 'react';
import type { FollowUpData } from '../types';

interface FollowUpSectionProps {
  data: FollowUpData;
  onChange: (field: keyof FollowUpData, value: string) => void;
}

const FollowUpSection: React.FC<FollowUpSectionProps> = ({ data, onChange }) => {
  return (
    <div className="mt-8 bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Notes & Follow-Up</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Summary
          </label>
          <textarea
            id="summary"
            rows={3}
            value={data.summary}
            onChange={(e) => onChange('summary', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="General summary of the assessment results..."
          />
        </div>
        <div>
          <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-1">
            Recommended Corrective Actions
          </label>
          <textarea
            id="recommendations"
            rows={3}
            value={data.recommendations}
            onChange={(e) => onChange('recommendations', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Suggested corrective steps..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="personInCharge" className="block text-sm font-medium text-gray-700 mb-1">
              Person In Charge
            </label>
            <input
              type="text"
              id="personInCharge"
              value={data.personInCharge}
              onChange={(e) => onChange('personInCharge', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Name of person in charge"
            />
          </div>
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              id="targetDate"
              value={data.targetDate}
              onChange={(e) => onChange('targetDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUpSection;
