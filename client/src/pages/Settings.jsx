import React from "react";
import { Construction } from "lucide-react";

const Settings = () => {
  return<div className="flex items-center justify-center min-h-[400px]">
  <div className="text-center">
    <Construction className="mx-auto h-16 w-16 text-gray-400 mb-6" />
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
    <p className="text-gray-600">
      This page is currently under development and will be available soon.
    </p>
  </div>
</div>;
};

export default Settings;
