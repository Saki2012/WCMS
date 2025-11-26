import clsx from "clsx";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data.ts"

export const Paginator = (props: PaginatorProps) => {
    // const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(props.currentPage - half, 1);
    let end = start + maxVisible - 1;
    if (end > props.totalPages) { end = props.totalPages; start = Math.max(end - maxVisible + 1, 1); }
    const visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    if (props.currentPage <= 1 && props.totalPages <= 1) return;
    return (
        <div className="row mx-0 px-0">
            <nav className="d-flex align-content-center w-100 px-0" aria-label="Page navigation">
                <ul className={props.style?.ul}>
                    <li className={clsx(props.style?.li, props.currentPage === 1 ? "disabled" : "")}>
                        <a onClick={() => props.currentPage !== 1 && props.onPageChange(1)} className={clsx(props.style?.aLink, props.currentPage === 1 ? "disabled" : "")} aria-disabled={props.currentPage === 1} aria-label="Previous" title="第一頁">
                            <span aria-hidden="true"><i className={props.style?.FirstPage}></i></span>
                        </a>
                    </li>
                    <li className={clsx(props.style?.li, props.currentPage === 1 ? "disabled" : "")}>
                        <a onClick={() => props.currentPage !== 1 && props.onPageChange(props.currentPage - 1)} className={`${props.style?.aLink} ${props.currentPage === 1 ? "disabled" : ""}`} aria-disabled={props.currentPage === 1} aria-label="Previous" title="上一頁">
                            <span aria-hidden="true"><i className={props.style?.PrePage}></i></span>
                        </a>
                    </li>
                    {visiblePages.map((page) => (
                        <li key={page} className={clsx(props.style?.li, page === props.currentPage ? "active" : "")}>
                            <a onClick={() => props.onPageChange(page)} className={clsx(props.style?.aLink, page === props.currentPage ? "active" : "")}>{page}</a>
                        </li>
                    ))}
                    <li className={clsx(props.style?.li, props.currentPage === props.totalPages ? "disabled" : "")}>
                        <a onClick={() => props.currentPage !== props.totalPages && props.onPageChange(props.currentPage + 1)} className={clsx(props.style?.aLink, props.currentPage === props.totalPages ? "disabled" : "")} aria-disabled={props.currentPage === props.totalPages} aria-label="Next" title="下一頁">
                            <span aria-hidden="true"><i className={props.style?.NextPage}></i></span>
                        </a>
                    </li>
                    <li className={clsx(props.style?.li, props.currentPage === props.totalPages ? "disabled" : "")}>
                        <a onClick={() => props.currentPage !== props.totalPages && props.onPageChange(props.totalPages)} className={clsx(props.style?.aLink, props.currentPage === props.totalPages ? "disabled" : "")} aria-disabled={props.currentPage === props.totalPages} aria-label="Last" title="最後一頁">
                            <span aria-hidden="true"><i className={props.style?.LastPage}></i></span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

/** 最新前台BaseLine用的格式，待確認這邊使用方式及邏輯*/
export const NewPaginator = (props: PaginatorProps) => {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(props.currentPage - half, 1);
    let end = start + maxVisible - 1;
    if (end > props.totalPages) { end = props.totalPages; start = Math.max(end - maxVisible + 1, 1); }
    const visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    if (props.currentPage <= 1 && props.totalPages <= 1) return <></>;
    const handleGoFirst = () => { if (props.currentPage !== 1) props.onPageChange(1); };
    const handleGoPrev = () => { if (props.currentPage > 1) props.onPageChange(props.currentPage - 1); };
    const handleGoNext = () => { if (props.currentPage < props.totalPages) props.onPageChange(props.currentPage + 1); };
    const handleGoLast = () => { if (props.currentPage !== props.totalPages) props.onPageChange(props.totalPages); };
    return (
        <div className="row">
            <div className="col-12">
                <nav className="d-flex justify-content-sm-start justify-content-center" aria-label="分頁">
                    <ul className="pagination">
                        {/* 第一頁 */}
                        <li className="paginate_button">
                            <a role="button" aria-label="第一頁" title="第一頁" tabIndex={0} onClick={() => { handleGoFirst(); }}>
                                <span aria-hidden="true">
                                    <i className="far fa-arrow-to-left"></i>
                                </span>
                            </a>
                        </li>
                        {/* 上一頁（在第一頁時 disabled） */}
                        <li className={clsx("paginate_button", props.currentPage === 1 && "disabled")} aria-disabled={props.currentPage === 1}>
                            <a role="button" title="上一頁" tabIndex={0} onClick={() => { handleGoPrev(); }}>
                                <span aria-hidden="true">
                                    <i className="far fa-angle-left"></i>
                                </span>
                            </a>
                        </li>
                        {/* 中間頁碼 */}
                        {visiblePages.map((page) => (
                            <li key={page} className={clsx("paginate_button", page === props.currentPage && "active")}>
                                <a role="button" tabIndex={0} aria-current={page === props.currentPage ? "page" : undefined}
                                    aria-label={page === props.currentPage ? `第 ${page} 頁，目前頁面` : `第 ${page} 頁`}
                                    onClick={() => { if (page !== props.currentPage) props.onPageChange(page); }}>
                                    {page}
                                </a>
                            </li>
                        ))}
                        {/* 下一頁（在最後一頁時 disabled） */}
                        <li className={clsx("paginate_button", props.currentPage === props.totalPages && "disabled")} aria-disabled={props.currentPage === props.totalPages}>
                            <a role="button" title="下一頁" tabIndex={0} onClick={() => { handleGoNext(); }}>
                                <span aria-hidden="true">
                                    <i className="far fa-angle-right"></i>
                                </span>
                            </a>
                        </li>
                        {/* 最後頁 */}
                        <li className="paginate_button">
                            <a role="button" aria-label="最後頁" title="最後頁" tabIndex={0} onClick={() => { handleGoLast(); }}>
                                <span aria-hidden="true">
                                    <i className="far fa-arrow-to-right"></i>
                                </span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};
