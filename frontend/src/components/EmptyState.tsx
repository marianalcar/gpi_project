import React from 'react';
import { Plus } from 'lucide-react';
import { useScrumContext } from '../context/ScrumContext';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction
}) => {
  const { currentProject } = useScrumContext();

  if (!currentProject) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Project</h2>
        <p className="text-gray-600 mb-6">
          Please select or create a project to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
        >
          <Plus size={18} className="mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;