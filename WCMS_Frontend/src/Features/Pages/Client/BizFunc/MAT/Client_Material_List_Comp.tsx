import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/ModuleContent";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { CmsHtml_Comp } from "@/SysCore/Components/CmsHtml/CmsHtml_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useOptionalSpecAssetUrl } from "@/SysCore/Utils/UI_HookFunc/useOptionalSpecAssetUrl";
import type { components } from "@/types/api";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCsvValues, getInitialMaterialTagId, type IMaterialListOptions, useMaterialListData } from "./Client_Material_List_Loader";

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

interface MaterialTabView
{
    id: string;
    name: string;
}
// #endregion

// #region Public Component
/** 物件清單：先顯示 PageManagement 內容，再依照 Prototype 商品卡片結構顯示 Material 資料 */
export const Client_Material_List_Comp = (props: IMaterialListProps) =>
{
    const dirUrl = useLocation().pathname.replace(/\/List$/, "");
    const [activeTabId, setActiveTabId] = useState<string>(() => getInitialMaterialTagId(props.options.TagIds));
    const viewState = useMemo(() => ({ pageNumber: 1, pageSize: 12, keyword: undefined }), []);
    const listOptions = useMemo<IMaterialListOptions>(
        () => ({ PageId: props.options.PageId, CategoryId: props.options.CategoryId, TagIds: activeTabId || props.options.TagIds }),
        [props.options.PageId, props.options.CategoryId, props.options.TagIds, activeTabId],
    );
    const vm = useMaterialListData({ lang: props.lang, opts: listOptions, viewState });
    const rawData = vm.rawData;
    const content = rawData.pageDetail?.Content ?? "";
    const tagList = useMemo(() => buildMaterialTabList(rawData.tagMap, props.options.TagIds), [rawData.tagMap, props.options.TagIds]);
    /** 當後台設定的 Tag 條件改變時，自動切到第一個可用 Tab */
    useEffect(() =>
    {
        if (tagList.length <= 0) return;
        if (tagList.some(p => p.id === activeTabId)) return;

        setActiveTabId(tagList[0].id);
    }, [tagList, activeTabId]);

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

            <MaterialCardList_Comp
                dirUrl={dirUrl}
                lang={props.lang}
                listData={rawData.listData}
                categoryMap={rawData.categoryMap}
                tagList={tagList}
                activeTabId={activeTabId}
                onTabChange={setActiveTabId}
            />
        </ModuleContent>
    );
};
// #endregion

// #region Private Components
/** Material 卡片列表 */
const MaterialCardList_Comp = (
    props: {
        dirUrl: string;
        lang: Lang;
        listData: MaterialSet[];
        categoryMap: Record<string, string>;
        tagList: MaterialTabView[];
        activeTabId: string;
        onTabChange: (id: string) => void;
    },
) =>
{
    const defaultPic = useOptionalSpecAssetUrl({ relativePath: "Assets/Custom/DefaultMaterialPic.jpg", fallbackToDefault: true }) ?? "";
    const tabPanelId = props.activeTabId ? `H-navTabs-${props.activeTabId}` : "H-navTabs-MaterialList";

    const cards = useMemo(() => props.listData.map(item => buildMaterialCardView(item, props.lang, props.dirUrl, props.categoryMap, defaultPic)), [
        props.listData,
        props.lang,
        props.dirUrl,
        props.categoryMap,
        defaultPic,
    ]);

    return (
        <div className="SubInfoDivBox_Style Layout_Padding_4_bottom flex-column">
            {props.tagList.length > 0 && (
                <div id="Horizontal" className="H-nav-tabs-content-box mb-3">
                    <ProductionTabs tagList={props.tagList} activeTabId={props.activeTabId} tabPanelId={tabPanelId} onChange={props.onTabChange} />
                </div>
            )}

            <div
                id={tabPanelId}
                className="SubPage_Standard_itemBoxs"
                role={props.tagList.length > 0 ? "tabpanel" : undefined}
                aria-labelledby={props.activeTabId ? `H-Tabs__${props.activeTabId}` : undefined}
            >
                {cards.map(item => <MaterialCardItem_Comp key={item.key} item={item} />)}
            </div>
        </div>
    );
};

/** 渲染物件類別 Tab */
const ProductionTabs = (props: { tagList: MaterialTabView[]; activeTabId: string; tabPanelId: string; onChange: (id: string) => void; }) =>
{
    return (
        <div className="Horizontal nav-tabs-list mb-3">
            <ul className="nav nav-tabs" role="tablist">
                {props.tagList.map((tag) =>
                {
                    return (
                        <li key={tag.id} className="nav-item + me-3" role="presentation">
                            <a
                                href="#"
                                type="button"
                                className={`more-link font-wt-lg ${tag.id === props.activeTabId ? "active" : ""}`}
                                role="tab"
                                aria-selected={tag.id === props.activeTabId}
                                aria-controls={props.tabPanelId}
                                id={`H-Tabs__${tag.id}`}
                                onClick={() => props.onChange(tag.id)}
                            >
                                <span className="vm">{tag.name}</span>
                                <span className="ms-1">〉</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
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

/** 依後台設定的 TagIds 組成前台 Tab */
const buildMaterialTabList = (tagMap: Record<string, string>, tagIds?: string | null): MaterialTabView[] =>
{
    return getCsvValues(tagIds ?? "").map(id => ({ id, name: tagMap[id] ?? "" })).filter(p => p.id && p.name);
};
/** 從 map 取得顯示名稱 */
const getMapText = (map: Record<string, string>, key?: string | null): string =>
{
    if (!key) return "";
    return map[key] ?? "";
};
// #endregion
