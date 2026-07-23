import { Client_Material_Form, type MaterialFormModel, type MaterialFormViewData } from "@/Features/Pages/Client/BizFunc/MAT/Material/Client_Material_Form_Comp";
import { Client_Announcement_Form } from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_Form_Comp";
import { buildPageManagementPreviewViewData, Client_PageManagement_Form, type PageManagementSet } from "@/Features/Pages/Client/BizFunc/WEB/PageManagement/Client_PageManagement_Form_Comp";
import { Client_Timeline_Form, type TimelineSet } from "@/Features/Pages/Client/BizFunc/WEB/Timeline/Client_Timeline_Form_Comp";
import { SpecUSRPreviewForm } from "@/SpecFetures/1810/Pages/Client/BizFunc/WEB/SpecUSR/SpecUSR_Form_Comp";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import type { ClientPreviewEntry, ClientPreviewRenderProps } from "@/Features/Pages/Client/Scaffold/Preview/Registry/ClientPreviewRegistry";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import type { ColumnConfig } from "@/SysCore/Components/Grid/Grid_Data";
import { Preview1810SubPageFrame } from "@/SpecFetures/1810/Pages/Client/Scaffold/Preview/Frame/Preview1810SubPageFrame";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];

interface AnnouncementPreviewPayload
{
    formData: AnnouncementSet;
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

interface SpecUSRPreviewPayload
{
    lang?: string;
    formData: SpecUSRSet;
    showColumns: string[];
    showColTitle: ColumnConfig[];
}
// #endregion

// #region Initialization
/** 1810 公告前台預覽註冊。 */
const announcementPreviewEntry: ClientPreviewEntry = { ProgId: PGID.Announcement, render: props => <AnnouncementPreviewContent props={props} /> };
/** 1810 頁面管理前台預覽註冊。 */
const pageManagementPreviewEntry: ClientPreviewEntry = { ProgId: PGID.PageManagement, render: props => <PageManagementPreviewContent props={props} /> };
/** 1810 紀事表前台預覽註冊。 */
const timelinePreviewEntry: ClientPreviewEntry = { ProgId: PGID.Timeline, render: props => <TimelinePreviewContent props={props} /> };
/** 1810 MAT 物件前台預覽註冊。 */
const materialPreviewEntry: ClientPreviewEntry = { ProgId: PGID.Material, render: props => <MaterialPreviewContent props={props} /> };
/** 1810 USR 計畫成果前台預覽註冊。 */
const specUSRPreviewEntry: ClientPreviewEntry = { ProgId: PGID.SpecUSR, render: props => <SpecUSRPreviewContent props={props} /> };
// #endregion

// #region Public
/** 1810 Spec 預覽註冊，覆寫 Feature 預設 Preview 外框。 */
export const specClientPreviewEntries: ClientPreviewEntry[] = [
    announcementPreviewEntry,
    pageManagementPreviewEntry,
    timelinePreviewEntry,
    materialPreviewEntry,
    specUSRPreviewEntry,
];
// #endregion

// #region Section
/** 1810 公告預覽內容，資料流沿用 Feature，但外框改用 Spec1810。 */
const AnnouncementPreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    // 宣告變數
    const previewPayload = resolveAnnouncementPreviewPayload(props.props.payload);

    // return
    return (
        <Preview1810SubPageFrame lang={props.props.lang} site={props.props.site} node={announcementPreviewNode}>
            <Client_Announcement_Form
                site={props.props.site}
                node={announcementPreviewNode}
                theme={Classic_FETheme}
                lang={props.props.lang}
                formData={previewPayload.formData}
                categoryNameText={previewPayload.categoryNameText ?? ""}
                tagNameText={previewPayload.tagNameText ?? ""}
                internalId={previewPayload.formData.Announcement?.InternalId ?? ""}
                isLoading={false}
                errorList={[]}
            />
        </Preview1810SubPageFrame>
    );
};

/** 1810 頁面管理預覽內容，資料流沿用 Feature，但外框改用 Spec1810。 */
const PageManagementPreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    // 宣告變數
    const formData = resolvePreviewPayload<PageManagementSet>(props.props.payload, pageManagementEmptyPreviewData);
    const viewData = buildPageManagementPreviewViewData(formData, props.props.lang);

    // return
    return (
        <Preview1810SubPageFrame lang={props.props.lang} site={props.props.site} node={pageManagementPreviewNode}>
            <Client_PageManagement_Form
                site={props.props.site}
                node={pageManagementPreviewNode}
                theme={Classic_FETheme}
                lang={props.props.lang}
                {...viewData}
            />
        </Preview1810SubPageFrame>
    );
};

/** 1810 紀事表預覽內容，資料流沿用 Feature，但外框改用 Spec1810。 */
const TimelinePreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    // 宣告變數
    const formData = resolvePreviewPayload<TimelineSet>(props.props.payload, timelineEmptyPreviewData);

    // return
    return (
        <Preview1810SubPageFrame lang={props.props.lang} site={props.props.site} node={timelinePreviewNode}>
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
        </Preview1810SubPageFrame>
    );
};

/** 1810 MAT 預覽內容，資料流沿用 Feature，但外框改用 Spec1810。 */
const MaterialPreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    // 宣告變數
    const previewPayload = resolveMaterialPreviewPayload(props.props.payload);

    // return
    return (
        <Preview1810SubPageFrame lang={props.props.lang} site={props.props.site} node={materialPreviewNode}>
            <Client_Material_Form
                site={props.props.site}
                node={materialPreviewNode}
                theme={Classic_FETheme}
                lang={props.props.lang}
                rawData={buildMaterialPreviewRawData(previewPayload)}
                isLoading={false}
                errorList={[]}
            />
        </Preview1810SubPageFrame>
    );
};

/** 1810 USR 計畫成果預覽內容，資料由後台表單送入，外框使用 Spec1810。 */
const SpecUSRPreviewContent = (props: { props: ClientPreviewRenderProps; }) =>
{
    // 宣告變數
    const previewPayload = resolveSpecUSRPreviewPayload(props.props.payload);

    // return
    return (
        <Preview1810SubPageFrame lang={props.props.lang} site={props.props.site} node={specUSRPreviewNode}>
            <SpecUSRPreviewForm
                lang={previewPayload.lang ?? props.props.lang}
                rawData={previewPayload.formData}
                showColumns={previewPayload.showColumns}
                showColTitle={previewPayload.showColTitle}
            />
        </Preview1810SubPageFrame>
    );
};
// #endregion

// #region Private
/** 從 Preview payload 取得資料，格式異常時回傳空資料。 */
const resolvePreviewPayload = <TData,>(payload: unknown, fallbackData: TData): TData =>
{
    // 宣告變數
    const unwrappedPayload = unwrapPreviewPayload(payload);

    // return
    if (!unwrappedPayload || typeof unwrappedPayload !== "object") return fallbackData;
    return unwrappedPayload as TData;
};

/** 解析公告 Preview payload，並保留舊版直接傳 AnnouncementSet 的相容性。 */
const resolveAnnouncementPreviewPayload = (payload: unknown): AnnouncementPreviewPayload =>
{
    // 宣告變數
    const unwrappedPayload = unwrapPreviewPayload(payload);

    // 執行 function
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

    // return
    return { formData: resolvePreviewPayload<AnnouncementSet>(unwrappedPayload, announcementEmptyPreviewData) };
};

/** 建立 Material 預覽用 rawData。 */
const buildMaterialPreviewRawData = (payload: MaterialPreviewPayload): MaterialFormViewData =>
{
    // return
    return {
        formData: payload.formData,
        categoryNameText: payload.categoryNameText ?? "",
        tagNameText: payload.tagNameText ?? "",
        matCateInfoFieldsMap: payload.matCateInfoFieldsMap ?? {},
    };
};

/** 解析 Material Preview payload，並保留舊版直接傳 Material FormModel 的相容性。 */
const resolveMaterialPreviewPayload = (payload: unknown): MaterialPreviewPayload =>
{
    // 執行 function
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

    // return
    return { formData: resolvePreviewPayload<MaterialFormModel>(payload, materialEmptyPreviewData) };
};

/** 解析 SpecUSR Preview payload。 */
const resolveSpecUSRPreviewPayload = (payload: unknown): SpecUSRPreviewPayload =>
{
    // 宣告變數
    const fallbackData: SpecUSRPreviewPayload = { lang: undefined, formData: specUSREmptyPreviewData, showColumns: [], showColTitle: [] };
    const unwrappedPayload = unwrapPreviewPayload(payload);

    // 執行 function
    if (!unwrappedPayload || typeof unwrappedPayload !== "object") return fallbackData;

    const previewPayload = unwrappedPayload as Partial<SpecUSRPreviewPayload>;

    // return
    return {
        lang: typeof previewPayload.lang === "string" ? previewPayload.lang : undefined,
        formData: previewPayload.formData ?? specUSREmptyPreviewData,
        showColumns: previewPayload.showColumns ?? [],
        showColTitle: previewPayload.showColTitle ?? [],
    };
};

/** 解開可能被外層 Preview message 包住的 payload。 */
const unwrapPreviewPayload = (payload: unknown): unknown =>
{
    // 執行 function
    if (!payload || typeof payload !== "object") return payload;

    const message = payload as { type?: unknown; payload?: unknown; };
    if (message.type === "wcms:preview" && "payload" in message)
    {
        return unwrapPreviewPayload(message.payload);
    }

    // return
    return payload;
};

/** 建立預覽用假節點。 */
const buildPreviewNode = (title: string, progId: PGID): INormNode =>
{
    // return
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

const announcementEmptyPreviewData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [], AnnouncementDetailFile: [] };
const pageManagementEmptyPreviewData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };
const timelineEmptyPreviewData: TimelineSet = { Timeline: {}, TimelineItem: [], TimelineLangDetail: [] };
const materialEmptyPreviewData: MaterialFormModel = { _MaterialLangInfo: [], _MaterialPicture: [], _MaterialTags: [] };
const specUSREmptyPreviewData: SpecUSRSet = { SpecUSR: {}, SpecUSRDetail: [], SpecUSRFile: [], SpecUSRUrl: [], SpecUSRPhoto: [], SpecUSRPhotoInfo: [] };
const announcementPreviewNode = buildPreviewNode("公告預覽", PGID.Announcement);
const pageManagementPreviewNode = buildPreviewNode("頁面預覽", PGID.PageManagement);
const timelinePreviewNode = buildPreviewNode("紀事表預覽", PGID.Timeline);
const materialPreviewNode = buildPreviewNode("物件預覽", PGID.Material);
const specUSRPreviewNode = buildPreviewNode("USR 預覽", PGID.SpecUSR);
// #endregion
