// frontend/src/components/profile/StatsCard.tsx
import React from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  unit: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    text: 'text-blue-700',
    value: 'text-blue-900',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    text: 'text-purple-700',
    value: 'text-purple-900',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    text: 'text-green-700',
    value: 'text-green-900',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    text: 'text-orange-700',
    value: 'text-orange-900',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({ label, value, unit, color }) => {
  const classes = colorClasses[color];
  return (
    <div className={`${classes.bg} p-4 rounded-lg`}>
      <p className={`text-sm ${classes.text} font-medium`}>{label}</p>
      <p className={`text-2xl font-bold ${classes.value} mt-2`}>
        {value} <span className="text-lg">{unit}</span>
      </p>
    </div>
  );
};

export default StatsCard;
