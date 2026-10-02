import { useRef, useState } from 'react';
import { FiPrinter } from 'react-icons/fi';
import { printPureExchange } from './utils/printUtils';

const ThermalPrinter = ({ tableData, onEmpty, onPrinted, onError }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  // Printed jobs spawn a hidden window and reach the spooler, so a rapid
  // double-click would queue the same receipt twice. The ref closes the gap
  // before React can apply `disabled`.
  const isPrintingRef = useRef(false);

  const printContent = async () => {
    if (!tableData || tableData.length === 0) {
      if (onEmpty) onEmpty();
      return;
    }

    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    setIsPrinting(true);

    try {
      // The outcome says whether printing was actually confirmed, so the page
      // can avoid claiming a receipt printed when the dialog may be cancelled.
      const outcome = await printPureExchange(tableData);
      if (onPrinted) onPrinted(outcome);
    } catch (error) {
      console.error('Print failed:', error);
      if (onError) onError(error);
    } finally {
      isPrintingRef.current = false;
      setIsPrinting(false);
    }
  };

  return (
    <button
      onClick={printContent}
      disabled={isPrinting}
      className="px-2 py-1 border border-amber-300 text-amber-700 text-sm rounded hover:bg-amber-50 transition-colors flex items-center space-x-1 h-[30px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPrinting ? (
        <>
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-700 border-solid border-t-transparent" />
          <span>Printing...</span>
        </>
      ) : (
        <>
          <FiPrinter className="w-3.5 h-3.5" />
          <span>Print</span>
        </>
      )}
    </button>
  );
};

export default ThermalPrinter;
