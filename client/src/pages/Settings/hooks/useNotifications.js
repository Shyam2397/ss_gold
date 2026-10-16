import { useCallback, useEffect, useRef, useState } from "react";
import { setPreference, usePreference } from "../../../lib/preferences";

export const useNotifications = () => {
  const [globalMessage, setGlobalMessage] = useState(null);
  const showSaveConfirmation = usePreference("showSaveConfirmation");
  const timerRef = useRef(null);

  // Track the pending auto-clear timer so a newer message cannot be wiped early
  // by an older message's timeout, and so it is cleared on unmount.
  const showMessage = useCallback(
    (type, text) => {
      if (type === "success" && !showSaveConfirmation) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setGlobalMessage({ type, text });
      timerRef.current = setTimeout(() => {
        setGlobalMessage(null);
        timerRef.current = null;
      }, 4000);
    },
    [showSaveConfirmation]
  );

  const clearMessage = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setGlobalMessage(null);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const updateSaveConfirmation = useCallback((value) => {
    setPreference("showSaveConfirmation", value);
  }, []);

  return {
    globalMessage,
    showMessage,
    clearMessage,
    showSaveConfirmation,
    updateSaveConfirmation,
  };
};
