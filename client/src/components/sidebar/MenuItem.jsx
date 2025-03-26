import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "../../lib/utils";

const MenuItem = React.memo(({ icon: Icon, label, to, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center h-8 px-2 rounded-xl transition-all duration-200",
      "relative group",
      isActive
        ? "bg-amber-100 text-amber-900"
        : "text-gray-600 hover:bg-amber-50 hover:text-amber-900"
    )}
  >
    <div className="flex items-center justify-center w-5 pl-1">
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-amber-600")} />
    </div>
    {label && (
      <span className="font-medium text-md ml-3 whitespace-nowrap">{label}</span>
    )}
  </Link>
));

export default MenuItem;
