import { FiInfo, FiAlertCircle } from "react-icons/fi";

const NOTES = [
  "Settings are saved permanently and will persist across application restarts.",
  "Silent Mode bypasses the system print dialog and sends the job directly to the selected printer.",
  "If no printer is selected, the system's default printer will be used automatically.",
  'Use "Test Preview" to see how the receipt will appear before printing.',
  "The Skin Test Certificate printer is used for A4 colour prints from the Skin Testing page. It is saved independently from the Token printer.",
];

const AboutPanel = () => (
  <div id="about-settings-panel" role="tabpanel" className="max-w-5xl animate-slideIn">
    <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-4">
        <FiInfo className="h-6 w-6 flex-shrink-0 text-amber-600" />
        <div>
          <h2 className="text-lg font-bold text-amber-900">About SS GOLD</h2>
          <p className="text-sm leading-6 text-amber-700">
            Company information is stored on this device. Printer profiles are managed by
            the Electron application and remain available after restarting it.
          </p>
        </div>
      </div>

      <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center">
        <FiAlertCircle className="w-5 h-5 mr-2 text-amber-600" />
        Notes & Information
      </h3>
      <ul className="space-y-2 text-sm text-amber-800">
        {NOTES.map((note) => (
          <li key={note} className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></span>
            {note}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default AboutPanel;
