
import React from 'react';
import type { AssessmentSection, Status } from '../types';
import AssessmentItemRow from './AssessmentItemRow';

interface AssessmentSectionProps {
  section: AssessmentSection;
  sectionIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onStatusChange: (sectionIndex: number, itemIndex: number, instanceIndex: number, status: Status) => void;
  onDescriptionChange: (sectionIndex: number, itemIndex: number, instanceIndex: number, description: string) => void;
  onPhotoChange: (sectionIndex: number, itemIndex: number, instanceIndex: number, photo: File | null) => void;
  onAddItemInstance: (sectionIndex: number, itemIndex: number) => void;
  onRemoveItemInstance: (sectionIndex: number, itemIndex: number, instanceIndex: number) => void;
  validationErrors: string[];
}

const AssessmentSectionComponent: React.FC<AssessmentSectionProps> = ({
  section,
  sectionIndex,
  isOpen,
  onToggle,
  onStatusChange,
  onDescriptionChange,
  onPhotoChange,
  onAddItemInstance,
  onRemoveItemInstance,
  validationErrors,
}) => {
  return (
    <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex justify-between items-center p-4 sm:p-6 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <h2 className="text-2xl font-bold text-gray-800">{section.title}</h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 text-gray-500 transition-transform transform ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
          {section.items.map((item, itemIndex) => {
            return (
               <AssessmentItemRow
                key={item.id}
                item={item}
                sectionIndex={sectionIndex}
                itemIndex={itemIndex}
                onStatusChange={onStatusChange}
                onDescriptionChange={onDescriptionChange}
                onPhotoChange={onPhotoChange}
                onAddItemInstance={onAddItemInstance}
                onRemoveItemInstance={onRemoveItemInstance}
                validationErrors={validationErrors}
              />
            )
          })}
        </div>
      )}
    </div>
  );
};

export default AssessmentSectionComponent;
