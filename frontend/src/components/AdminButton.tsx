import React, { useState } from 'react';
import { ShieldIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
export const AdminButton: React.FC = () => {
  return <Link to="/admin" className="flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">
      <ShieldIcon size={16} className="mr-1.5" />
      <span className="text-sm font-medium">Admin</span>
    </Link>;
};