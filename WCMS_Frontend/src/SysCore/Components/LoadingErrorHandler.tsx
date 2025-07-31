import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Props = {
  loadingList: boolean[];
  errorList: (string | null | undefined)[];
  children?: ReactNode;
};

const LoadingErrorHandler = (prop: Props) => {
  const isLoading = prop.loadingList.some(Boolean);
  const error = prop.errorList.find(Boolean);
  const [showLightLoading, setShowLightLoading] = useState(false);
  const [showFullLoading, setShowFullLoading] = useState(false);
  useEffect(() => {
    let lightTimer: ReturnType<typeof setTimeout> | null = null;
    let fullTimer: ReturnType<typeof setTimeout> | null = null;
    if (isLoading) {
      // 200ms 後顯示淡入 loading
      lightTimer = setTimeout(() => setShowLightLoading(true), 200);
      // 500ms 後顯示完整 loading
      fullTimer = setTimeout(() => setShowFullLoading(true), 500);
    } else {
      // 若 loading 結束，重設所有狀態
      setShowLightLoading(false);
      setShowFullLoading(false);
    }
    return () => { if (lightTimer) clearTimeout(lightTimer); if (fullTimer) clearTimeout(fullTimer);};
  }, [isLoading]);

  if (isLoading) {
    if (showFullLoading) {return <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>📦 資料載入中...</div>;}
    if (showLightLoading) {return <div style={{ opacity: 0.6, fontSize: '0.9em' }}>🔄 輕量載入中...</div>;}
    return null; // < 200ms 時不顯示任何東西
  }
  if (error) {
    return <div style={{ color: 'red' }}>❌ 錯誤：{error}</div>;
  }
  return <>{prop.children}</>;
};
export default LoadingErrorHandler;