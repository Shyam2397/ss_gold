import { useCallback, useState } from "react";
import { usePreferences as usePreferencesStore } from "../../../lib/preferences";

export const usePreferences = (showMessage) => {
  const { preferences, setPreference } = usePreferencesStore();
  const [savedKey, setSavedKey] = useState(null);

  const updatePreference = useCallback(
    (key, value) => {
      try {
        setPreference(key, value);
        setSavedKey(key);
        showMessage?.("success", "Preference saved!");
        setTimeout(() => setSavedKey(null), 2000);
      } catch (error) {
        showMessage?.("error", "Failed to save preference: " + error.message);
      }
    },
    [setPreference, showMessage]
  );

  return { preferences, updatePreference, savedKey };
};
