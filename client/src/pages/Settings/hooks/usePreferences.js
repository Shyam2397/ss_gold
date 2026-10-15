import { useCallback, useState } from "react";

export const usePreferences = (showMessage) => {
  const [printValuesOnly, setPrintValuesOnly] = useState(() => {
    const saved = window.localStorage.getItem("skinTest_printValuesOnly");
    return saved !== null ? saved === "true" : false;
  });
  const [printValuesOnlySaved, setPrintValuesOnlySaved] = useState(false);

  const updatePrintValuesOnly = useCallback(
    (value) => {
      setPrintValuesOnly(value);
      try {
        window.localStorage.setItem("skinTest_printValuesOnly", String(value));
        setPrintValuesOnlySaved(true);
        showMessage("success", "Skin Test print preference saved!");
        setTimeout(() => setPrintValuesOnlySaved(false), 2000);
      } catch (error) {
        showMessage("error", "Failed to save print preference: " + error.message);
      }
    },
    [showMessage]
  );

  return { printValuesOnly, printValuesOnlySaved, updatePrintValuesOnly };
};
