/** 路徑導覽 */
import type { ReactNode } from 'react';

export interface BreadCrumbData {
  SrcData: string;
  Url: string;
  DOMContent?:ReactNode;
};
