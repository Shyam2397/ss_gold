import { FiPrinter } from "react-icons/fi";
import PrinterCard from "./PrinterCard";
import { PAPER_SIZES_TOKEN, PAPER_SIZES_A4 } from "../constants";

const PrinterSettingsPanel = ({
  tokenSettings,
  onTokenSettingsChange,
  skinTestSettings,
  onSkinTestSettingsChange,
  printers,
  loading,
  onRefreshPrinters,
  onSaveTokenSettings,
  onSaveSkinTestSettings,
  onTestTokenPrint,
  onTestSkinTestPrint,
  tokenSaveStatus,
  skinTestSaveStatus,
  isElectronEnv,
}) => (
  <div id="printer-settings-panel" role="tabpanel" className="animate-slideIn">
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-6xl">
      <PrinterCard
        title="Token / Receipt Printer"
        subtitle="Thermal 80mm / 58mm printer"
        icon={FiPrinter}
        iconColor="from-amber-600 to-yellow-500"
        settings={tokenSettings}
        onChange={onTokenSettingsChange}
        printers={printers}
        paperSizes={PAPER_SIZES_TOKEN}
        loading={loading}
        onRefreshPrinters={onRefreshPrinters}
        onSave={onSaveTokenSettings}
        onTestPrint={onTestTokenPrint}
        saveStatus={tokenSaveStatus}
        isElectronEnv={isElectronEnv}
      />

      <PrinterCard
        title="Skin Test Certificate Printer"
        subtitle="A4 colour printer for skin-test certificates"
        icon={FiPrinter}
        iconColor="from-yellow-600 to-amber-400"
        settings={skinTestSettings}
        onChange={onSkinTestSettingsChange}
        printers={printers}
        paperSizes={PAPER_SIZES_A4}
        loading={loading}
        onRefreshPrinters={onRefreshPrinters}
        onSave={onSaveSkinTestSettings}
        onTestPrint={onTestSkinTestPrint}
        saveStatus={skinTestSaveStatus}
        isElectronEnv={isElectronEnv}
      />
    </div>
  </div>
);

export default PrinterSettingsPanel;
