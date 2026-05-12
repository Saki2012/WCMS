import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useOptionalSpecAssetUrl } from "@/SysCore/Utils/UI_HookFunc/useOptionalSpecAssetUrl";
import type { components } from "@/types/api";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { type IMaterialListOptions, useMaterialListData } from "./Client_Material_List_Loader";

type MaterialSet = components["schemas"]["MaterialSet_DTO"];

// #region Property
export interface IMaterialListProps
{
    theme: IFETheme;
    lang: Lang;
    options: IMaterialListOptions;
    site: INormSite;
    node: INormNode;
}

interface MaterialCardView
{
    key: string;
    linkUrl: string;
    title: string;
    price: number;
    categoryName: string;
    picUrl: string;
    picAlt: string;
}
// #endregion

// #region Public Component
/** 物件清單：先顯示 PageManagement 內容，再依照 Prototype 商品卡片結構顯示 Material 資料 */
export const Client_Material_List_Comp = (props: IMaterialListProps) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");
    const viewState = useMemo(() => ({ pageNumber: 1, pageSize: 12, keyword: undefined }), []);
    const vm = useMaterialListData({ lang: props.lang, opts: props.options, viewState });
    const rawData = vm.rawData;
    const content = useMemo(() => rawData.pageData.PageManagementDetail?.find(p => p.Lang === props.lang)?.Content ?? "", [
        rawData.pageData.PageManagementDetail,
        props.lang,
    ]);
    const paginprops = { currentPage: rawData.pageNumber, totalPages: rawData.totalPages, onPageChange: vm.onPageChange };

    return (
        <ModuleContent
            nodeTitle={props.node.title}
            isLoading={vm.isLoading}
            errorList={vm.errorList}
            paginatorProps={paginprops}
            viewCountConfig={{ mode: "list" }}
        >
            <CmsHtml_Comp html={content} lang={props.lang} />
            {content && <hr className="hr-my-4" />}
            <MaterialCardList_Comp dirUrl={dirUrl} lang={props.lang} listData={rawData.listData} categoryMap={rawData.categoryMap} />
        </ModuleContent>
    );
};
// #endregion

// #region Private Components
/** Material 卡片列表 */
const MaterialCardList_Comp = (props: { dirUrl: string; lang: Lang; listData: MaterialSet[]; categoryMap: Record<string, string>; }) =>
{
    const defaultPic = useOptionalSpecAssetUrl({ relativePath: "Assets/Custom/DefaultMaterialPic.jpg", fallbackToDefault: true }) ?? "";
    const cards = useMemo(() => props.listData.map(item => buildMaterialCardView(item, props.lang, props.dirUrl, props.categoryMap, defaultPic)), [
        props.listData,
        props.lang,
        props.dirUrl,
        props.categoryMap,
        defaultPic,
    ]);

    return (
        <div className="SubInfoDivBox_Style Layout_Padding_4_bottom">
            <div id="Row_Colitem" className="SubPage_Standard_itemBoxs">{cards.map(item => <MaterialCardItem_Comp key={item.key} item={item} />)}</div>
        </div>
    );
};

/** Material 卡片項目 */
const MaterialCardItem_Comp = (props: { item: MaterialCardView; }) =>
{
    return (
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-6 col-12 Standard_ItemDiv">
            <article className="cardbox">
                <div className="card_content">
                    <figure className="figure_Box" style={{ width: "100%" }}>
                        <LangNavLink to={props.item.linkUrl} className="card_image_link" title={props.item.title} style={{ display: "block", width: "100%" }}>
                            <div className="card_figure" style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden" }}>
                                <div className="img-wrapper" style={{ width: "100%", height: "100%" }}>
                                    <img
                                        className="card_image"
                                        src={props.item.picUrl}
                                        alt={props.item.picAlt}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                </div>
                            </div>
                        </LangNavLink>
                    </figure>

                    <div className="card_catDiv">
                        <div className="card_cat">
                            <div className="card_cat_link">
                                <span className="s-line">▍</span>
                                <span className="s-tle">{props.item.categoryName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card_titleDiv d-flex justify-content-between align-items-end mb-md-2 mb-sm-1 mb-2">
                        <LangNavLink to={props.item.linkUrl} className="card_title">{props.item.title}</LangNavLink>
                        {props.item.price && (
                            <span className="Price-Dollar">
                                <span className="me-3">NT$</span>
                                {props.item.price}
                            </span>
                        )}
                    </div>

                    <div className="card_titleDiv my-0">
                        <div className="card_subtitle">{}</div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-md-3 mb-sm-2 mb-2">
                        <span className="Discount-text">{}</span>
                    </div>

                    <div className="card_StateDiv">
                        <div className="more-link-box my-0">
                            <LangNavLink
                                to={props.item.linkUrl}
                                className="more-link font-wt-md"
                                role="button"
                                aria-label={`查看更多：${props.item.title}`}
                                target="_self"
                                title="查看更多"
                            >
                                <span className="ms-1">〉</span>
                                <span className="vm">VIEW ALL</span>
                            </LangNavLink>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
};
// #endregion

// #region Private Func
/** 組成卡片顯示資料 */
const buildMaterialCardView = (item: MaterialSet, lang: Lang, dirUrl: string, categoryMap: Record<string, string>, defaultPic: string): MaterialCardView =>
{
    const main = item.Material;
    const langInfo = item.MaterialLangInfo?.find(p => p.Lang === lang) ?? item.MaterialLangInfo?.[0];
    const internalId = main?.InternalId ?? "";
    const price = item.Material?.Price ?? 0;
    const title = langInfo?.MaterialName ?? "";
    const categoryName = getMapText(categoryMap, main?.CategoryId);
    const picData = item.MaterialPicture?.[0];
    const picAlt = picData?.PictureName ?? title;
    const picUrl = picData?.PictureId ? FileManagementAPI.get_Public_Preview_Url(picData.PictureId, picAlt) : defaultPic;
    return { key: internalId, linkUrl: `${dirUrl}/${internalId}`, title, price, categoryName, picUrl, picAlt };
};

/** 從 map 取得顯示名稱 */
const getMapText = (map: Record<string, string>, key?: string | null): string =>
{
    if (!key) return "";
    return map[key] ?? "";
};
// #endregion
