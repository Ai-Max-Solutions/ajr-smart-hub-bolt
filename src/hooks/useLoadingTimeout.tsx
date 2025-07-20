
import { useState, useEffect } from 'react';

export const useLoadingTimeout = (timeoutMs: number = 10000) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, timeoutMs);

    return () => {
      clearTimeout(timer);
      setHasTimedOut(false);
    };
  }, [timeoutMs]);

  const resetTimeout = () => {
    setHasTimedOut(false);
  };

  return { hasTimedOut, resetTimeout };
};
