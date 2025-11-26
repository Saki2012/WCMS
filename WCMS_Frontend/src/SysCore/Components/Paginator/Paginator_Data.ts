import type { IPaginator_Style } from "./Paginator_Clsx";

export type PaginatorProps = {
    currentPage: number; // 當前頁碼
    totalPages: number; // 總頁數
    onPageChange: (page: number) => void; // 切換頁碼時的動作
    style?: IPaginator_Style; // 之後慢慢移除有關style邏輯
};
