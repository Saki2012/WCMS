import { useState, useCallback } from 'react';

export function useSidebarToggle(initial = false) {
  const [isHidden, setIsHidden] = useState(initial);
  const toggle = useCallback(() => setIsHidden(prev => !prev), []);
  return { isHidden, toggle };
}