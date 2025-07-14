export type PaginatorProps = {
  currentPage: number;      // 當前頁碼
  totalPages: number;       // 總頁數
  onPageChange: (page: number) => void;  // 切換頁碼時的動作
};