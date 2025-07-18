import type { ReactNode } from 'react';

type Props = {
  loadingList: boolean[];
  errorList: (string | null | undefined)[];
  children?: ReactNode;
};

const LoadingErrorHandler = ({ loadingList, errorList, children }: Props) => {
  const isLoading = loadingList.some(Boolean);
  const error = errorList.find(Boolean);

  // if (isLoading) return <div>資料載入中...</div>;
  if (error) return <div style={{ color: 'red' }}>錯誤：{error}</div>;

  return <>{children}</>;
};


export default LoadingErrorHandler;