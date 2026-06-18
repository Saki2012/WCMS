import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { ModuleContent, type ModuleViewCountConfig } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/ModuleContent";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { useLocation } from "react-router-dom";
import { useSpecMusicalListData } from "./SpecMusicalList_Loader";

// #region Property
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

export interface ISpecMusicalOptions
{
    Category?: string;
}
// #endregion

// #region Section
const GridList_Comp = (props: { title: string; data: SpecMusicalSet[]; }) =>
{
    // 宣告變數：取得目前目錄網址
    const dirUrl = useLocation().pathname.replace(/\/List$/, ``);

    // return：列表 DOM
    return (
        <div id="Row_Colitem" className="SubPage_Musical_Instrument_itemBoxs">
            {props.data.map((item) =>
            {
                // 宣告變數：組合連結與顯示資料
                const internalId = item.SpecMusical?.InternalId ?? "";
                const picSrc = FileManagementAPI.get_Public_Preview_Url(item.SpecMusical?.CoverPicId);
                const title = item.SpecMusical?.MusicalName ?? "觀看詳細內容";
                const href = `${dirUrl}/${internalId}`;
                // return：單筆卡片
                return (
                    <div key={internalId} className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-6 + Standard_ItemDiv">
                        <article className="cardbox">
                            <div className="card_content">
                                <LangLink to={href} className="card_image_link" title={title}>
                                    <figure className="figure_Box">
                                        <div className="card_figure">
                                            <div className="img-wrapper">
                                                <img className="card_image" src={picSrc} alt="" />
                                            </div>
                                        </div>
                                    </figure>

                                    <div className="card_titleDiv + my-4">
                                        <span className="card_title">{title}</span>
                                    </div>

                                    <div className="card_StateDiv + justify-content-center">
                                        <div className="More customize_btn mb-3">
                                            <span className="Btn_s1" aria-hidden="true">
                                                VIEW ALL
                                                <span className="ml-2">+</span>
                                            </span>
                                        </div>
                                    </div>
                                </LangLink>
                            </div>
                        </article>
                    </div>
                );
            })}
        </div>
    );
};
// #endregion

// #region Private
export const SpecMusicalList = (props: { options?: ISpecMusicalOptions; site: INormSite; node: INormNode; }) =>
{
    // 宣告變數
    const pageSize = 9;

    // 執行 function：list/count 交給 Client_DataQueryTemplate
    const useList = useSpecMusicalListData({ categoryIds: props.options?.Category ?? "", pageSize });

    const errorList = useList.errorList;
    const viewCountConfig: ModuleViewCountConfig = { mode: "list" };
    // return（DOM 不改）
    return (
        <ModuleContent
            nodeTitle={props.node.title}
            isLoading={useList.isLoading}
            errorList={errorList}
            paginatorProps={useList.paginatorProps}
            viewCountConfig={viewCountConfig}
        >
            <GridList_Comp title={""} data={useList.rawData} />
        </ModuleContent>
    );
};
// #endregion
