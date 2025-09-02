import type { PaginatorProps } from "../../../SysCore/Components/Paginator/Paginator_Data.ts"
import { Link } from "react-router-dom";

export const Paginator = ({ currentPage, totalPages, onPageChange, style }: PaginatorProps) => {
    // const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(currentPage - half, 1);
    let end = start + maxVisible - 1;
    if (end > totalPages) { end = totalPages; start = Math.max(end - maxVisible + 1, 1); }
    const visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return (
        <div className="row mx-0 px-0">
            <nav className="d-flex align-content-center w-100 px-0" aria-label="Page navigation">
                <ul className={style.ul}>
                    <li className={style.li}>
                        {/* 在確認Link如何優化 */}
                        {/* <Link to="" state={""} className={style.aLink} aria-label="Previous" title="第一頁">
                            <span aria-hidden="true"><i className={style.FirstPage}></i></span>
                        </Link> */}
                        <a onClick={() => currentPage !== 1 && onPageChange(1)} className={style.aLink} aria-label="Previous" title="第一頁">
                            <span aria-hidden="true"><i className={style.FirstPage}></i></span>
                        </a>
                    </li>

                    <li className={style.li}>
                        <a onClick={() => currentPage !== 1 && onPageChange(currentPage - 1)} className={`${style.aLink} disabled`} aria-disabled={currentPage === 1} aria-label="Previous" title="上一頁">
                            <span aria-hidden="true"><i className={style.PrePage}></i></span>
                        </a>
                    </li>

                    {visiblePages.map((page) => (
                        <li key={page} className={`${style.li} ${page === currentPage ? "active" : ""}`}>
                            <a onClick={() => onPageChange(page)} className={style.aLink}>{page}</a>
                        </li>
                    ))}

                    <li className={style.li}>
                        <a onClick={() => currentPage !== totalPages && onPageChange(currentPage + 1)} className={`${style.aLink} disabled`} aria-disabled={currentPage === totalPages} aria-label="Next" title="下一頁">
                            <span aria-hidden="true"><i className={style.NextPage}></i></span>
                        </a>
                    </li>

                    <li className={style.li}>
                        <a onClick={() => currentPage !== totalPages && onPageChange(totalPages)} className={style.aLink} aria-label="Last" title="最後一頁">
                            <span aria-hidden="true"><i className={style.LastPage}></i></span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    );
};