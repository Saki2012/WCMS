import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibDropList, LibFile, LibPicture, LibTextArea, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import type { components } from "@/types/api";
import { WebResourceFields, WebResourceInfoFields, WebResourceSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    useWebResourceDetailTabs,
    useWebResourceFormTemplate,
    type WebResourceDetailTabItem,
    webResourceEmptyData,
    type WebResourceFormRefs,
} from "./Server_WebResource_Form_Hook";

// #region Property
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

type DetailRowKeyValue = string | number | null | undefined;

type DetailRowKeys = Record<string, DetailRowKeyValue>;

type BindingRowKeys = Record<string, string | number | undefined>;

interface WebResourceFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<WebResourceSet>;

    /** WebResource Hook 整理後的參照資料 */
    refs: WebResourceFormRefs;
}

interface DetailSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<WebResourceSet>;

    /** WebResource Hook 整理後的參照資料 */
    refs: WebResourceFormRefs;
}

interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<WebResourceSet>>;

    /** 圖片上傳 helper，維持 Hook 在 Component 階段呼叫 */
    uploadPic: ReturnType<typeof useUploadPicture>;
}

interface DetailTabContentOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Hook 整理後的 Detail tabs */
    tabItems: WebResourceDetailTabItem[];

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<WebResourceSet>>;

    /** WindowTarget 下拉選項 */
    windowTargetOptions: Map<string, string>;
}

interface DetailFieldsOptions extends Omit<DetailTabContentOptions, "tabItems">
{
    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: BindingRowKeys;
}
// #endregion

// #region Public
/** 後台網路資源 Form，透過新版 Form Template 統一外框與資料流程。 */
export const WebResourceFormComp = (
    props: WebResourceFormCompProps,
) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const onBackToList = useCallback(() =>
    {
        navigate(LibRoutePath.buildServerBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = useWebResourceFormTemplate({
        lang: props.lang,
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: webResourceEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <>
                    <HeaderComp
                        theme={props.theme}
                        binding={vm.binding}
                        refs={vm.refs}
                    />
                    <DetailComp
                        theme={props.theme}
                        lang={props.lang}
                        binding={vm.binding}
                        refs={vm.refs}
                    />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
/** 網路資源 Header 區塊，保留舊版 Header input 並改用 Template Binding。 */
const HeaderComp = (props: HeaderSectionProps) =>
{
    const setField = useSetTableField<WebResourceSet>(props.binding);
    const uploadPic = useUploadPicture();
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤", Img: "圖片", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField, uploadPic });

    return (
        <TabContentComp
            tabInfos={tabInfo}
            components={tabContent}
        >
        </TabContentComp>
    );
};

/** 網路資源多語 Detail 區塊，語系資料由 Hook 統一整理。 */
const DetailComp = (props: DetailSectionProps) =>
{
    const setField = useSetTableField<WebResourceSet>(props.binding);
    const detailTabs = useWebResourceDetailTabs({ binding: props.binding, lang: props.lang });
    const windowTargetOptions = useMemo(() => buildWindowTargetOptions(props.refs.windowTargetOpts), [props.refs.windowTargetOpts]);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: detailTabs.tabItems };
    const tabContent = buildDetailTabContent({ theme: props.theme, tabItems: detailTabs.items, setField, windowTargetOptions });

    return (
        <TabContentComp
            tabInfos={tabInfo}
            components={tabContent}
        >
        </TabContentComp>
    );
};
// #endregion

// #region Protected
/** 建立網路資源 Header 的各分頁欄位。 */
const buildHeaderTabContent = (opt: HeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    return {
        Basic: buildBasicFields(opt),
        Status: buildStatusFields(opt),
        Tags: buildTagFields(opt),
        Img: buildImageFields(opt),
        System: [
            <SystemInfoTabComp
                theme={opt.theme}
                formData={opt.binding}
                setKey={WebResourceSetFields.WebResource}
            />,
        ],
    };
};

/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.categoryMap}
            {...opt.setField(WebResourceSetFields.WebResource, WebResourceFields.Categories, "string", undefined, "csv")}
        />,
    ];
};

/** 建立狀態欄位。 */
const buildStatusFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.statusOpts}
            {...opt.setField(WebResourceSetFields.WebResource, WebResourceFields.ContentStatus, "number", undefined, {
                strategy: "sum",
                sumKeys: Object.keys(opt.refs.statusOpts ?? {}).map(Number),
            })}
        />,
    ];
};

/** 建立標籤欄位。 */
const buildTagFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.tagMap}
            {...opt.setField(WebResourceSetFields.WebResource, WebResourceFields.Tags, "string", undefined, "csv")}
        />,
    ];
};

/** 建立圖片上傳與圖片說明欄位。 */
const buildImageFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    const previewSrc = buildPicturePreviewSrc(opt.uploadPic.result.previewUrl, opt.binding.data?.WebResource?.PicId);

    return [
        <LibFile
            Style={opt.theme.File}
            ColumnDisplayName="選擇圖片"
            Multiple={false}
            InputValue=""
            accept="image/*"
            parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
            onChange={(files) => opt.uploadPic.handleFileChange(files, internalId => updateHeaderPictureId(opt.binding, internalId))}
        >
            <LibPicture
                key="preview"
                ColumnDisplayName={opt.uploadPic.result.previewUrl ?? ""}
                PicSrc={previewSrc}
                PicDescription="選中的圖片"
            />
        </LibFile>,
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(WebResourceSetFields.WebResource, WebResourceFields.PicDescription, "string")}
        />,
    ];
};

/** 建立 Detail 語系分頁內容，畫面只依 Hook 整理後的 Tab 項目渲染。 */
const buildDetailTabContent = (opt: DetailTabContentOptions): Record<string, ReactNode[]> =>
{
    return opt.tabItems.reduce<Record<string, ReactNode[]>>((compMap, tabItem) =>
    {
        const rowKeys = normalizeDetailRowKeys(tabItem.rowKeys);
        compMap[tabItem.key] = buildDetailFields({ theme: opt.theme, setField: opt.setField, windowTargetOptions: opt.windowTargetOptions, rowKeys });
        return compMap;
    }, {});
};

/** 建立單一語系 Detail 欄位。 */
const buildDetailFields = (opt: DetailFieldsOptions): ReactNode[] =>
{
    return [
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Title, "string", opt.rowKeys)}
        />,
        <LibTextArea
            Style={opt.theme.TextArea}
            DefaultInputDisplay="請輸入"
            {...opt.setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Content, "string", opt.rowKeys)}
        />,
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.ResUrl, "string", opt.rowKeys)}
        />,
        <LibDropList
            Style={opt.theme.DropList}
            Options={opt.windowTargetOptions}
            ShowPlaceholder={false}
            {...opt.setField(WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Url_OpenType, "number", opt.rowKeys)}
        />,
    ];
};

/** 建立圖片預覽路徑，沒有圖片時顯示預設圖。 */
const buildPicturePreviewSrc = (previewUrl: string, picId?: string | null): string =>
{
    return previewUrl || FileManagementAPI.get_Server_Preview_Url(picId) || "https://dummyimage.com/1920x550/555/fff.png";
};

/** 將 WindowTarget object 轉成 LibDropList 使用的 Map。 */
const buildWindowTargetOptions = (options: Record<string, string>): Map<string, string> =>
{
    return new Map<string, string>(Object.entries(options ?? {}));
};
// #endregion

// #region Private
/** 將 Detail rowKeys 轉成欄位綁定可接受的 key。 */
const normalizeDetailRowKeys = (rowKeys: DetailRowKeys): BindingRowKeys =>
{
    return Object.entries(rowKeys).reduce<BindingRowKeys>((result, [key, value]) =>
    {
        result[key] = normalizeDetailRowKey(value);
        return result;
    }, {});
};

/** 將 null row key 統一轉為 undefined，避免 useSetTableField 型別不一致。 */
const normalizeDetailRowKey = (value: DetailRowKeyValue): string | number | undefined =>
{
    return value ?? undefined;
};

/** 回寫 Header 圖片 internalId。 */
const updateHeaderPictureId = (binding: ServerFormBinding<WebResourceSet>, internalId: string): void =>
{
    binding.setFormData(prev => ({ ...prev, WebResource: { ...prev?.WebResource, PicId: internalId } }));
};
// #endregion
