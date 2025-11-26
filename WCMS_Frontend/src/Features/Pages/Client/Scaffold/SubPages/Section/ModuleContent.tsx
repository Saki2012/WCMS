import LoadingErrorHandler from "@/SysCore/Components/LoadingErrorHandler";
import { NewPaginator } from "@/SysCore/Components/Paginator/Paginator_Comp"
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { ReactNode } from "react";

export interface ModuleContentProps { title?: string; subTitle?: SubTitleProps; paginatorProps?: PaginatorProps; loadingList: boolean[]; errorList: (string | null | undefined)[]; children?: ReactNode; }

const ModuleContent = (props: ModuleContentProps) => {
    return (
        <LoadingErrorHandler loadingList={props.loadingList} errorList={props.errorList}>
            <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 + All_Standard_Content_CSS + my-5">
                {props.title && <Title title={props.title} subTitle={props.subTitle} />}
                {/* <SearchBar /> */}
                <div className="ALL__Information__Display__Area">
                    {props.children}
                </div>
                <hr className="hr-my-4" />
                {props.paginatorProps && <NewPaginator {...props.paginatorProps} />}
            </div>
        </LoadingErrorHandler>
    )
}
export default ModuleContent

/** 標題 */
const Title = (props: { title: string; subTitle?: SubTitleProps; }) => {
    return (
        <>
            <div className="page-header mb-3">
                <div className="Div_H3_Title">{props.title}</div>
            </div>
            {props.subTitle && <SubTitle {...props.subTitle} />}
            <hr className="hr-my-4" />
        </>
    )
}
export interface SubTitleProps { cat?: string; tag?: string; date?: string }
const SubTitle = (props: SubTitleProps) => {
    return (<div className="NEWS_catDiv">
        <div className="news_cat">
            <i className="fas fa-tags mr-2"></i><span className="sr-only">公告類別</span>{props.cat}
        </div>

        <div className="news_calendar">
            <i className="fas fa-calendar-alt mr-2"></i><span className="sr-only">日期</span>{props.date}
        </div>
    </div>
    )
}
/** 搜尋Bar ，內文會用不到*/
const SearchBar = (props: {}) => {
    return (
        <>
            <div className="row">
                <div className="col row-group">
                    <div className="CategoryBar w-100">
                        <div className="search-wrap my-2">
                            <div className="tit-text"><span>關鍵字搜尋區</span></div>
                            <form className="searchDIV" role="search" onSubmit={(e) => { e.preventDefault(); }}>
                                <input id="keywordSearch" type="text" placeholder="請輸入關鍵字進行搜尋 ..." title="關鍵字搜尋" />
                                <button type="submit" title="搜尋" aria-label="搜尋">
                                    <i className="far fa-search">
                                        <span className="d-none">搜尋</span>
                                    </i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col row-group">
                <hr className="hr-my-4" />
            </div>
        </>
    )
}
/** 狀態 */
export const ContentStatus = (props: {}) => {
    return (<>
        <div className="CustomState">{/**保留這個，不跑版 */}
            {/* <span className="label icon-small label-success">置頂</span>
            <span className="label icon-small label-danger">熱門</span>
            <span className="label icon-small label-warning">最新</span> */}
        </div>
    </>)
}
