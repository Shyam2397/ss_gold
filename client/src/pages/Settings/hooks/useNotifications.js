import { useCallback, useState } from "react";

export const useNotifications = () => {
  const [globalMessage, setGlobalMessage] = useState(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(() => {
    const saved = window.localStorage.getItem("showSaveConfirmation");
    return saved !== null ? saved === "true" : true;
  });

  const showMessage = useCallback(
    (type, text) => {
      if (type === "success" && !showSaveConfirmation) return;
      setGlobalMessage({ type, text });
      setTimeout(() => setGlobalMessage(null), 4000);
    },
    [showSaveConfirmation]
  );

  const clearMessage = useCallback(() => setGlobalMessage(null), []);

  const updateSaveConfirmation = useCallback((value) => {
    setShowSaveConfirmation(value);
    window.localStorage.setItem("showSaveConfirmation", String(value));
  }, []);

  return {
    globalMessage,
    showMessage,
    clearMessage,
    showSaveConfirmation,
    updateSaveConfirmation,
  };
};
