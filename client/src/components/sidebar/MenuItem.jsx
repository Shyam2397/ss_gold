import React from 'react';
import { Link } from 'react-router-dom';

const MenuItem = ({ icon: Icon, label, to, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-amber-100 text-amber-900'
        : 'text-gray-600 hover:bg-amber-50 hover:text-amber-900'
    }`}
  >
    <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : ''}`} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default MenuItem;
