import type { PaginatorProps } from "../../../SysCore/Components/Paginator/Paginator_Data.ts"


export const Paginator = ({ currentPage, totalPages, onPageChange }: PaginatorProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="row mx-0 px-0">
        <nav className="d-flex justify-content-center align-content-center w-100 px-0" aria-label="Page navigation">
            <ul className="pagination my-3">
                <li className="page-item">
                    <a onClick={() => onPageChange(1)} className="page-link" aria-label="Previous" title="第一頁">
                        <span aria-hidden="true"><i className="far fa-arrow-to-left"></i></span>
                    </a>
                </li>

                <li className="page-item">
                    <a onClick={() => currentPage !== 1 && onPageChange(currentPage - 1)} className="page-link disabled" aria-disabled={currentPage === 1} aria-label="Previous" title="上一頁">
                        <span aria-hidden="true"><i className="far fa-angle-left"></i></span>
                    </a>
                </li>

                {pages.map((page) => (
                    <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                        <a onClick={() => onPageChange(page)} className="page-link">{page}</a>
                    </li>
                ))}

                <li className="page-item">
                    <a onClick={() => currentPage === totalPages && onPageChange(currentPage + 1)} className="page-link" aria-label="Next" title="下一頁">
                        <span aria-hidden="true"><i className="far fa-angle-right"></i></span>
                    </a>
                </li>
                
                <li className="page-item">
                    <a onClick={() => currentPage !== totalPages && onPageChange(totalPages)} className="page-link" aria-label="Last" title="最後一頁">
                        <span aria-hidden="true"><i className="far fa-arrow-to-right"></i></span>
                    </a>
                </li>
            </ul>
        </nav>
    </div>
  );
};