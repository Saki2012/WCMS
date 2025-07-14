import type {IGridView_Style} from '../../../SysCore/Components/Grid/Grid_Clsx'
import type { ReactNode } from 'react';

export interface ColumnConfig<T = any> {
  key: string;                                          // 對應的欄位 key
  title: string;                                        // 欄位標題
  width?: string;                                       // 欄位寬度，如 "15%"
  visible?: boolean;                                    // 是否顯示欄位（可控）
  render?: (row: T, index: number) => React.ReactNode;  // 自定義渲染
};

export interface RowCell {
  col: ColumnConfig;
  content: ReactNode;
}

export interface GridRow {
  cells: RowCell[];
  extra?: ReactNode;
}

export interface GridProps {
  style:IGridView_Style;
  columns: ColumnConfig[];
  rows: GridRow[];
}