import { Client_Material_Form, type MaterialFormViewData, type MaterialFormModel } from "@/Features/Pages/Client/BizFunc/MAT/Material/Client_Material_Form_Comp";
import { Client_Announcement_Form } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_Form_Comp";
import { buildPageManagementPreviewViewData, Client_PageManagement_Form, type PageManagementFormModel } from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/Client_PageManagement_Form_Comp";
import { Client_Timeline_Form, type TimelineFormModel } from "@/Features/Pages/Client/BizFunc/WEB/Timeline/Client_Timeline_Form_Comp";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import { PreviewSubPageFrame } from "@/Features/Pages/Client/Scaffold/Preview/Frame/PreviewSubPageFrame";
import type { ClientPreviewEntry, ClientPreviewRenderProps } from "@/Features/Pages/Client/Scaffold/Preview/Registry/ClientPreviewRegistry";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";

// #region Property
type AnnouncementFormModel = components["schemas"]["Announcement"];
interface AnnouncementPreviewPayload
{
    formData: AnnouncementFormModel;
    categoryNameText?: string;
    tagNameText?: string;
}
interface MaterialPreviewPayload
{
    formData: MaterialFormModel;
    categoryNameText?: string;
    tagNameText?: string;
    matCateInfoFieldsMap?: Record<string, string>;
}
// #endregion

// #region Initialization
/** 公告前台預覽註冊。 */
const announcementPreviewEntry: ClientPreviewEntry = { ProgId: PGID.Announcement, render: props => <AnnouncementPreviewContent props={props} /> };
/** 頁面管理前台預覽註冊。 */
const pageManagementPreviewEntry: ClientPreviewEntry = { ProgId: PGID.PageManagement, render: props => <PageManagementPreviewContent props={props} /> };
/** 紀事表前台預覽註冊。 */
const timelinePreviewEntry: ClientPreviewEntry = { ProgId: PGID.Timeline, render: props => <TimelinePreviewContent props={props} /> };
/** MAT 物件前台預覽註冊。 */
const materialPreviewEntry: ClientPreviewEntry = { ProgId: PGID.Material, render: props => <MaterialPreviewContent props={props} /> };
// #endregion

// #region Public
/** Feature 層可預覽功能註冊。 */
export const featureClientPreviewEntries: ClientPreviewEntry[] = [
    announcementPreviewEntry,
    pageManagementPreviewEntry,
    timelinePreviewEntry,
    materialPreviewEntry,
];
// #endregion

// #region Section
/** 公告預覽內容，負責把 Preview payload 轉成 AnnouncementFormView props。 */
const AnnouncementPreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    const previewPayload = resolveAnnouncementPreviewPayload(props.props.payload);

    return (
        <PreviewSubPageFrame lang={props.props.lang} site={props.props.site} node={announcementPreviewNode}>
            <Client_Announcement_Form
                site={props.props.site}
                node={announcementPreviewNode}
                theme={Classic_FETheme}
                lang={props.props.lang}
                formData={previewPayload.formData}
                categoryNameText={previewPayload.categoryNameText ?? ""}
                tagNameText={previewPayload.tagNameText ?? ""}
                internalId={previewPayload.formData?.InternalId ?? ""}
                isLoading={false}
                errorList={[]}
            />
        </PreviewSubPageFrame>
    );
};

/** 頁面管理預覽內容，負責把 Preview payload 轉成 FormView Entry props。 */
const PageManagementPreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    const formData = resolvePreviewPayload<PageManagementFormModel>(props.props.payload, pageManagementEmptyPreviewData);
    const viewData = buildPageManagementPreviewViewData(formData, props.props.lang);

    return (
        <PreviewSubPageFrame lang={props.props.lang} site={props.props.site} node={pageManagementPreviewNode}>
            <Client_PageManagement_Form
                site={props.props.site}
                node={pageManagementPreviewNode}
                theme={Classic_FETheme}
                lang={props.props.lang}
                {...viewData}
            />
        </PreviewSubPageFrame>
    );
};

/** 紀事表預覽內容，負責把 Preview payload 轉成 TimelineFormView props。 */
const TimelinePreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    const formData = resolvePreviewPayload<TimelineFormModel>(props.props.payload, timelineEmptyPreviewData);
    return (
        <PreviewSubPageFrame lang={props.props.lang} site={props.props.site} node={timelinePreviewNode}>
            <Client_Timeline_Form
                site={props.props.site}
                node={timelinePreviewNode}
                theme={Classic_FETheme}
                lang={props.props.lang}
                title={timelinePreviewNode.title}
                listData={[formData]}
                isDesc={false}
                isLoading={false}
                errorList={[]}
            />
        </PreviewSubPageFrame>
    );
};

/** MAT 物件預覽內容，負責把 Preview payload 轉成 MaterialFormView props。 */
const MaterialPreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    const previewPayload = resolveMaterialPreviewPayload(props.props.payload);

    return (
        <PreviewSubPageFrame lang={props.props.lang} site={props.props.site} node={materialPreviewNode}>
            <Client_Material_Form
                site={props.props.site}
                node={materialPreviewNode}
                theme={Classic_FETheme}
                lang={props.props.lang}
                rawData={buildMaterialPreviewRawData(previewPayload)}
                isLoading={false}
                errorList={[]}
            />
        </PreviewSubPageFrame>
    );
};
// #endregion

// #region Private
/** 從 Preview payload 取得資料，格式異常時回傳空資料。 */
const resolvePreviewPayload = <TData,>(payload: unknown, fallbackData: TData): TData =>
{
    const unwrappedPayload = unwrapPreviewPayload(payload);
    if (!unwrappedPayload || typeof unwrappedPayload !== "object") return fallbackData;
    return unwrappedPayload as TData;
};
/** 建立 Material 預覽用 rawData，預覽模式不補分類、標籤與動態欄位。 */
const buildMaterialPreviewRawData = (payload: MaterialPreviewPayload): MaterialFormViewData =>
{
    return {
        formData: payload.formData,
        categoryNameText: payload.categoryNameText ?? "",
        tagNameText: payload.tagNameText ?? "",
        matCateInfoFieldsMap: payload.matCateInfoFieldsMap ?? {},
    };
};
/** 建立預覽用假節點。 */
const buildPreviewNode = (title: string, progId: PGID): INormNode =>
{
    return {
        id: 0,
        title,
        path: "preview",
        type: "module",
        module: { progId },
        children: [],
        windowTarget: 0,
        isShowOnMenu: true,
        pageType: 0,
        level: 1,
    };
};
/** 解析公告 Preview payload，並保留舊版直接傳 AnnouncementFormModel 的相容性。 */
const resolveAnnouncementPreviewPayload = (payload: unknown): AnnouncementPreviewPayload =>
{
    const unwrappedPayload = unwrapPreviewPayload(payload);
    if (!unwrappedPayload || typeof unwrappedPayload !== "object") return { formData: announcementEmptyPreviewData };

    const previewPayload = unwrappedPayload as Partial<AnnouncementPreviewPayload>;
    if (previewPayload.formData)
    {
        return {
            formData: previewPayload.formData,
            categoryNameText: previewPayload.categoryNameText ?? "",
            tagNameText: previewPayload.tagNameText ?? "",
        };
    }

    return { formData: resolvePreviewPayload<AnnouncementFormModel>(unwrappedPayload, announcementEmptyPreviewData) };
};

/** 解開可能被外層 Preview message 包住的 payload。 */
const unwrapPreviewPayload = (payload: unknown): unknown =>
{
    if (!payload || typeof payload !== "object") return payload;

    const message = payload as { type?: unknown; payload?: unknown; };
    if (message.type === "wcms:preview" && "payload" in message)
    {
        return unwrapPreviewPayload(message.payload);
    }

    return payload;
};
const announcementEmptyPreviewData: AnnouncementFormModel = { _AnnouncementDetail: [] };
const pageManagementEmptyPreviewData: PageManagementFormModel = { _PageManagementDetail: [] };
const timelineEmptyPreviewData: TimelineFormModel = { _TimelineItem: [] };
const resolveMaterialPreviewPayload = (payload: unknown): MaterialPreviewPayload =>
{
    if (!payload || typeof payload !== "object") return { formData: materialEmptyPreviewData };
    const previewPayload = payload as Partial<MaterialPreviewPayload>;
    if (previewPayload.formData)
    {
        return {
            formData: previewPayload.formData,
            categoryNameText: previewPayload.categoryNameText ?? "",
            tagNameText: previewPayload.tagNameText ?? "",
            matCateInfoFieldsMap: previewPayload.matCateInfoFieldsMap ?? {},
        };
    }
    return { formData: resolvePreviewPayload<MaterialFormModel>(payload, materialEmptyPreviewData) };
};
const materialEmptyPreviewData: MaterialFormModel = { _MaterialLangInfo: [], _MaterialPicture: [], _MaterialTags: [] };
const announcementPreviewNode = buildPreviewNode("公告預覽", PGID.Announcement);
const pageManagementPreviewNode = buildPreviewNode("頁面預覽", PGID.PageManagement);
const timelinePreviewNode = buildPreviewNode("紀事表預覽", PGID.Timeline);
const materialPreviewNode = buildPreviewNode("物件預覽", PGID.Material);
// #endregion
