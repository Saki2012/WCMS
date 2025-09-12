/** 圖文式 */
import { Link, useLocation } from "react-router-dom";
import LoadingErrorHandler from "../../../../../../../SysCore/Components/LoadingErrorHandler";
import { Paginator } from "../../../../../../../SysCore/Components/Paginator/Paginator_Comp";
import type { ListCompProp } from "../GridView_Data";


import type { components } from "../../../../../../../types/api";
import { FormatDate } from "../../../../../../../SysCore/Utils/Library/LibData";
import { useCategoryListData, useFormatCategoriesName } from "../../../../../../Server/Layout/BizFunc/WebManagement/Category/Category_Hook";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

export interface GridViewContentSlots extends ListCompProp {
    searchSlot?: React.ReactNode;
}

export const PictureList_Comp = (prop: GridViewContentSlots) => {
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);
    const useCateData = useCategoryListData("Announcement", 'zh-tw');

    return (
        <>
            {prop.searchSlot}
            <LoadingErrorHandler loadingList={prop.LoadingList} errorList={prop.ErrorList} >
                <div className="articles_itemBoxs">
                    {prop.GridData && prop.GridData.rawData.map((row: AnnouncementSet) => {

                        const internalId = `${dirUrl}/${row.Announcement?.InternalId ?? ""}`
                        const picId = `/Service/Filemanagement/Preview/${row.Announcement?.PictureId ?? ""}`
                        const picDesc = row.Announcement?.PicDescription ?? ""
                        const title = row.AnnouncementDetail?.find(p => p.Lang === 'zh-tw')?.Title ?? ""
                        const date = FormatDate(row.Announcement?.Validate_Start) ?? ""
                        const catName = useFormatCategoriesName(row.Announcement?.Categories ?? "", useCateData.rawData)
                        return (
                            <div key={internalId} className="articles_item col-xl-4 col-lg-4 col-md-6 col-sm-12 col-12">
                                <article className="cardbox">
                                    <div className="card_content">
                                        <figure className="card_figure">
                                            <Link to={internalId} className="card_image_link" title={title}>
                                                <picture>
                                                    <img className="card_image" src={picId} alt={picDesc} />
                                                </picture>
                                            </Link>
                                        </figure>
                                        <div className="card_catDiv">
                                            <div className="card_cat">
                                                <div className="card_cat_link">
                                                    <span className="s-line">▍</span>
                                                    <span className="s-tle">{catName}</span>
                                                </div>
                                            </div>
                                            <div className="card_time">{date}</div>
                                        </div>
                                        <div className="card_titleDiv">
                                            <Link to={internalId} className="card_title" title={title}>{title}</Link>
                                        </div>
                                        <div className="customize_btn mr-auto mt-2">
                                            <Link to={internalId} className="Btn_s1">VIEW ALL<span className="ml-2">+</span></Link>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        );
                    })}

                </div>
                {(prop.GridData.TotalPage > 1) && (<Paginator currentPage={prop.GridData.CurrentPage} totalPages={prop.GridData.TotalPage} onPageChange={prop.GridData.onPageChange} style={prop.Theme.Paginator} ></Paginator>)}
            </LoadingErrorHandler>
        </>
    );
}