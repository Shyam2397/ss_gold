import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const GlobalMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed left-4 right-4 top-4 z-50 animate-slideIn sm:left-auto sm:right-4 sm:max-w-sm">
      <div
        className={`flex items-center rounded-xl p-3 shadow-lg ${
          message.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        {message.type === "success" ? (
          <FiCheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
        ) : (
          <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
        )}
        <p className="min-w-0 text-sm">{message.text}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 flex-shrink-0 p-1 opacity-50 transition-opacity hover:opacity-100"
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default GlobalMessage;
