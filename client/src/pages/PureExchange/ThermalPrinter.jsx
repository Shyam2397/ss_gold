import { FiPrinter } from 'react-icons/fi';
import { printPureExchange } from './utils/printUtils';

const ThermalPrinter = ({ tableData, onEmpty }) => {
  const printContent = async () => {
    if (!tableData || tableData.length === 0) {
      if (onEmpty) onEmpty();
      return;
    }
    await printPureExchange(tableData);
  };

  return (
    <button
      onClick={printContent}
      className="px-2 py-1 border border-amber-300 text-amber-700 text-sm rounded hover:bg-amber-50 transition-colors flex items-center space-x-1 h-[30px] rounded-xl"
    >
      <FiPrinter className="w-3.5 h-3.5" />
      <span>Print</span>
    </button>
  );
};

export default ThermalPrinter;
