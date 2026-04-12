import { useEffect, useRef, useState } from 'react';

export function useAutoSave(data, saveFunction, delay = 1000) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(data);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Determine if data has actually changed
    // JSON.stringify works fine for simple data structures
    if (JSON.stringify(data) === JSON.stringify(lastSavedData)) {
      return;
    }

    setIsSaving(true);
    
    // Clear any existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timer
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFunction(data);
        setLastSavedData(data);
      } catch (error) {
        console.error("Auto-save failed", error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay, lastSavedData]);

  return { isSaving };
}
