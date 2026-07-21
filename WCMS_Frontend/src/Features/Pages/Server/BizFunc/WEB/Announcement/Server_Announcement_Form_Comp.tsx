// bug#17已處理完
import {
    type AnnouncementDetailRowKeys,
    type AnnouncementDetailTabItem,
    announcementEmptyData,
    type AnnouncementFormRefs,
    type AnnouncementPreviewPayload,
    AnnouncementPictureUploadLimit,
    useAnnouncementDetailTabs,
    useAnnouncementFileEditGrid,
    useAnnouncementFormTemplate,
} from "@/Features/Pages/Server/BizFunc/WEB/Announcement/Server_Announcement_Form_Hook";
import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { PreviewFrame } from "@/Features/Pages/Server/Scaffold/Preview/PreviewFrame";
import { buildServerPreviewToolbarButton, useServerPreviewFrame } from "@/Features/Pages/Server/Scaffold/Preview/PreviewFrame_Hook";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCalendar } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibCalendar_Comp";
import { LibCheckBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibCheckBox_Comp";
import { useUploadPicture } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibPicture_Comp";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibFile, LibPicture, LibTextBox, LibTinyMCE } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibAttachment, LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields, AnnouncementSetFields, PGID } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

interface AnnouncementFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}
export interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<AnnouncementSet>;

    /** Announcement Hook 整理後的參照資料 */
    refs: AnnouncementFormRefs;
}

interface DetailSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<AnnouncementSet>;
}

interface SubDetailSectionProps
{
    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<AnnouncementSet>;

    /** 目前 Detail RowId，給附件 Grid 綁 ParentRowId */
    parentRowId: number;
}
export interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<AnnouncementSet>>;

    /** 圖片上傳 hook */
    uploadPic: ReturnType<typeof useUploadPicture>;

    /** 圖片預覽來源 */
    previewSrc: string;

    /** 圖片 input 重掛 key，只在手動清除預覽圖時更新。 */
    pictureInputResetKey: number;

    /** 重掛圖片 input，清除瀏覽器內部已選檔案。 */
    onResetPictureInput: () => void;
}
/** Announcement Header 可擴充的 Form 區塊名稱。 */
export const AnnouncementFormSlotNames = {
    Basic: "Basic",
    Status: "Status",
    Tags: "Tags",
    Pic: "Pic",
    System: "System",
} as const;
/** Announcement 基本分頁 Feature 欄位鍵值。 */
export const AnnouncementBasicFieldKeys = {
    Categories: "Categories",
    ValidateStart: "ValidateStart",
    ValidateEnd: "ValidateEnd",
} as const;
/** Announcement 狀態分頁 Feature 欄位鍵值。 */
export const AnnouncementStatusFieldKeys = {
    ContentStatus: "ContentStatus",
} as const;
/** Announcement 標籤分頁 Feature 欄位鍵值。 */
export const AnnouncementTagsFieldKeys = {
    Tags: "Tags",
} as const;
/** Announcement 圖片分頁 Feature 欄位鍵值。 */
export const AnnouncementPictureFieldKeys = {
    Picture: "Picture",
    PicDescription: "PicDescription",
} as const;
/** Announcement 系統資訊分頁 Feature 欄位鍵值。 */
export const AnnouncementSystemFieldKeys = {
    SystemInfo: "SystemInfo",
} as const;
type ValueOf<T> = T[keyof T];
export type AnnouncementFormSlotName = ValueOf<typeof AnnouncementFormSlotNames>;
export type AnnouncementFormFieldKey =
    | ValueOf<typeof AnnouncementBasicFieldKeys>
    | ValueOf<typeof AnnouncementStatusFieldKeys>
    | ValueOf<typeof AnnouncementTagsFieldKeys>
    | ValueOf<typeof AnnouncementPictureFieldKeys>
    | ValueOf<typeof AnnouncementSystemFieldKeys>;
export type AnnouncementFormFieldNode = Exclude<ReactNode, undefined>;
export type AnnouncementFormFieldMap = Partial<Record<AnnouncementFormFieldKey, AnnouncementFormFieldNode>>;
export interface AnnouncementFormSlotFieldData
{
    /** Feature 原始欄位對照表。 */
    baseFieldMap: AnnouncementFormFieldMap;

    /** Feature 原始欄位排序。 */
    baseFieldOrder: AnnouncementFormFieldKey[];
}
export interface AnnouncementFormSlotContext extends HeaderTabContentOptions, AnnouncementFormSlotFieldData
{
    /** 目前擴充的 Form 區塊。 */
    slotName: AnnouncementFormSlotName;

    /** 取得 Feature 原始欄位。 */
    getBaseFields: () => ReactNode[];

    /** 排除指定欄位後取得 Feature 原始欄位。 */
    getBaseFieldsWithout: (keys: AnnouncementFormFieldKey[]) => ReactNode[];

    /** 只取得指定 Feature 欄位。 */
    getOnlyBaseFields: (keys: AnnouncementFormFieldKey[]) => ReactNode[];
}
export type AnnouncementFormSlot = (ctx: AnnouncementFormSlotContext) => ReactNode[];
interface DetailTabContentOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<AnnouncementSet>;

    /** Hook 整理後的 Detail tabs */
    tabItems: AnnouncementDetailTabItem[];

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<AnnouncementSet>>;
}

interface DetailFieldsOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<AnnouncementSet>;

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<AnnouncementSet>>;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: AnnouncementDetailRowKeys;

    /** Detail RowId，給附件 SubDetail 綁 ParentRowId */
    detailRowId: number;
}

const editGridStyle: IEditGridView_Style = {
    TableStyle: "table table-striped table-bordered table-hover",
    ToolbarStyle: "d-flex align-items-center justify-content-between mb-2",
    ButtonStyle: "btn btn-custom btn-rounded btn-sm",
    DangerButtonStyle: "btn btn-danger btn-rounded btn-sm",
    ErrorStyle: "text-danger small mt-1",
};

type UploadPictureHandler = ReturnType<typeof useUploadPicture>["handleFileChange"];
// #endregion

// #region Initialization
const extendAnnouncementFormSlotBase: AnnouncementFormSlot = (ctx) => ctx.getBaseFields();
/** 解析公告 Form Spec 欄位插槽。 */
const extendResolvedAnnouncementFormSlot = resolveSpecFunc<AnnouncementFormSlot>(
    "Pages/Server/BizFunc/WEB/Announcement/Server_Announcement_Form_Comp.tsx",
    extendAnnouncementFormSlotBase,
    ["extendAnnouncementFormSlot"],
);
// #endregion

// #region Public
/** 後台公告 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_Announcement_Form_Comp = (props: AnnouncementFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const preview = useServerPreviewFrame<AnnouncementPreviewPayload>({ ProgId: PGID.Announcement });

    const onBackToList = useCallback(() =>
    {
        const listPath = LibRoutePath.buildServerBackToListPath(pathname);
        markPageStateMemoryEntry(listPath, "normalize");
        navigate(listPath, { replace: true });
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList, onPreviewFromDto: preview.openPreview };
    }, [onBackToList, preview.openPreview]);

    const template = useAnnouncementFormTemplate({
        lang: props.lang,
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: announcementEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            resolveActionToolbarButtons={({ vm }) => [
                buildServerPreviewToolbarButton({ action: vm.actions.Preview }),
            ]}
            renderContent={({ vm }) => (
                <>
                    <HeaderComp theme={props.theme} binding={vm.binding} refs={vm.refs} />
                    <DetailComp theme={props.theme} lang={props.lang} binding={vm.binding} />
                    <PreviewFrame
                        open={preview.isOpen}
                        siteIndex={preview.siteIndex}
                        onClose={preview.closePreview}
                        payload={preview.framePayload}
                        title={preview.title}
                    />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
/** 公告 Header 區塊，直接使用新版 Template Binding 與 Refs。 */
const HeaderComp = (props: HeaderSectionProps) =>
{
    const setField = useSetTableField<AnnouncementSet>(props.binding);
    const uploadPic = useUploadPicture();
    const [pictureInputResetKey, setPictureInputResetKey] = useState(0);
    const previewSrc = buildPicturePreviewSrc(props.binding, uploadPic);
    const onResetPictureInput = useCallback(() =>
    {
        setPictureInputResetKey(prev => prev + 1);
    }, []);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤", Pic: "圖片", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField, uploadPic, previewSrc, pictureInputResetKey, onResetPictureInput });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** 公告多語 Detail 區塊，語系資料由 Announcement Hook 統一整理。 */
const DetailComp = (props: DetailSectionProps) =>
{
    const setField = useSetTableField<AnnouncementSet>(props.binding);
    const detailTabs = useAnnouncementDetailTabs({ binding: props.binding, lang: props.lang });
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: detailTabs.tabItems };
    const tabContent = buildDetailTabContent({ ...props, tabItems: detailTabs.items, setField });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};

/** 公告附件 SubDetail 區塊，直接掛載 Announcement Hook 產生的 EditGrid props。 */
const SubDetailComp = (props: SubDetailSectionProps) =>
{
    const fileGrid = useAnnouncementFileEditGrid({ binding: props.binding, parentRowId: props.parentRowId, style: editGridStyle });

    return (
        <div className="mt-4">
            <EditGrid {...fileGrid.editGridProps} />
        </div>
    );
};
// #endregion

// #region Protected
/** 建立公告 Header 的各分頁欄位。 */
const buildHeaderTabContent = (opt: HeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    const baseSlotMap = buildHeaderBaseSlotMap(opt);
    return {
        [AnnouncementFormSlotNames.Basic]: applyAnnouncementFormSlot(opt, AnnouncementFormSlotNames.Basic, baseSlotMap[AnnouncementFormSlotNames.Basic]),
        [AnnouncementFormSlotNames.Status]: applyAnnouncementFormSlot(opt, AnnouncementFormSlotNames.Status, baseSlotMap[AnnouncementFormSlotNames.Status]),
        [AnnouncementFormSlotNames.Tags]: applyAnnouncementFormSlot(opt, AnnouncementFormSlotNames.Tags, baseSlotMap[AnnouncementFormSlotNames.Tags]),
        [AnnouncementFormSlotNames.Pic]: applyAnnouncementFormSlot(opt, AnnouncementFormSlotNames.Pic, baseSlotMap[AnnouncementFormSlotNames.Pic]),
        [AnnouncementFormSlotNames.System]: applyAnnouncementFormSlot(opt, AnnouncementFormSlotNames.System, baseSlotMap[AnnouncementFormSlotNames.System]),
    };
};

/** 建立公告 Header 的 Feature 原始欄位表。 */
const buildHeaderBaseSlotMap = (opt: HeaderTabContentOptions): Record<AnnouncementFormSlotName, AnnouncementFormSlotFieldData> =>
{
    return {
        [AnnouncementFormSlotNames.Basic]: buildBasicFieldData(opt),
        [AnnouncementFormSlotNames.Status]: buildStatusFieldData(opt),
        [AnnouncementFormSlotNames.Tags]: buildTagFieldData(opt),
        [AnnouncementFormSlotNames.Pic]: buildPictureFieldData(opt),
        [AnnouncementFormSlotNames.System]: buildSystemFieldData(opt),
    };
};

/** 套用公告 Header 指定區塊的 Spec 欄位插槽。 */
const applyAnnouncementFormSlot = (opt: HeaderTabContentOptions, slotName: AnnouncementFormSlotName, fieldData: AnnouncementFormSlotFieldData): ReactNode[] =>
{
    const ctx = buildAnnouncementFormSlotContext(opt, slotName, fieldData);
    return extendResolvedAnnouncementFormSlot(ctx);
};

/** 建立公告 Form 欄位插槽的上下文資料。 */
const buildAnnouncementFormSlotContext = (opt: HeaderTabContentOptions, slotName: AnnouncementFormSlotName, fieldData: AnnouncementFormSlotFieldData): AnnouncementFormSlotContext =>
{
    const getOnlyBaseFields = (keys: AnnouncementFormFieldKey[]): ReactNode[] => keys.map(key => fieldData.baseFieldMap[key]).filter(isAnnouncementFormFieldNode);
    return {
        ...opt,
        ...fieldData,
        slotName,
        getOnlyBaseFields,
        getBaseFields: () => getOnlyBaseFields(fieldData.baseFieldOrder),
        getBaseFieldsWithout: (keys) => getOnlyBaseFields(fieldData.baseFieldOrder.filter(key => !keys.includes(key))),
    };
};

/** 建立基本分頁的 Feature 原始欄位資料。 */
const buildBasicFieldData = (opt: HeaderTabContentOptions): AnnouncementFormSlotFieldData =>
{
    return {
        baseFieldMap: {
            [AnnouncementBasicFieldKeys.Categories]: <LibCheckBox Style={opt.theme.CheckBox} options={opt.refs.categoryMap} {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Categories, "string", undefined, "csv")} />,
            [AnnouncementBasicFieldKeys.ValidateStart]: <LibCalendar {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start, "datetime")} />,
            [AnnouncementBasicFieldKeys.ValidateEnd]: <LibCalendar {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_End, "datetime")} />,
        },
        baseFieldOrder: [AnnouncementBasicFieldKeys.Categories, AnnouncementBasicFieldKeys.ValidateStart, AnnouncementBasicFieldKeys.ValidateEnd],
    };
};

/** 建立狀態分頁的 Feature 原始欄位資料。 */
const buildStatusFieldData = (opt: HeaderTabContentOptions): AnnouncementFormSlotFieldData =>
{
    return {
        baseFieldMap: {
            [AnnouncementStatusFieldKeys.ContentStatus]: (
                <LibCheckBox
                    Style={opt.theme.CheckBox}
                    options={opt.refs.statusOpts}
                    {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.ContentStatus, "number", undefined, {
                        strategy: "sum",
                        sumKeys: Object.keys(opt.refs.statusOpts ?? {}).map(Number),
                    })}
                />
            ),
        },
        baseFieldOrder: [AnnouncementStatusFieldKeys.ContentStatus],
    };
};

/** 建立標籤分頁的 Feature 原始欄位資料。 */
const buildTagFieldData = (opt: HeaderTabContentOptions): AnnouncementFormSlotFieldData =>
{
    return {
        baseFieldMap: {
            [AnnouncementTagsFieldKeys.Tags]: <LibCheckBox Style={opt.theme.CheckBox} options={opt.refs.tagMap} {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Tags, "string", undefined, "csv")} />,
        },
        baseFieldOrder: [AnnouncementTagsFieldKeys.Tags],
    };
};

/** 建立圖片分頁的 Feature 原始欄位資料。 */
const buildPictureFieldData = (opt: HeaderTabContentOptions): AnnouncementFormSlotFieldData =>
{
    return {
        baseFieldMap: {
            [AnnouncementPictureFieldKeys.Picture]: buildPictureField(opt),
            [AnnouncementPictureFieldKeys.PicDescription]: <LibTextBox Style={opt.theme.TextBox} DefaultInputDisplay="請輸入" {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.PicDescription, "string")} />,
        },
        baseFieldOrder: [AnnouncementPictureFieldKeys.Picture, AnnouncementPictureFieldKeys.PicDescription],
    };
};

/** 建立系統資訊分頁的 Feature 原始欄位資料。 */
const buildSystemFieldData = (opt: HeaderTabContentOptions): AnnouncementFormSlotFieldData =>
{
    return {
        baseFieldMap: {
            [AnnouncementSystemFieldKeys.SystemInfo]: <SystemInfoTabComp theme={opt.theme} formData={opt.binding} setKey={AnnouncementSetFields.Announcement} />,
        },
        baseFieldOrder: [AnnouncementSystemFieldKeys.SystemInfo],
    };
};

/** 建立圖片上傳與預覽欄位。 */
const buildPictureField = (opt: HeaderTabContentOptions): ReactNode =>
{
    const hasPicture = hasAnnouncementPicture(opt.binding, opt.uploadPic);

    return (
        <LibFile
            key={`AnnouncementPictureInput_${opt.pictureInputResetKey}`}
            Style={opt.theme.File}
            ColumnDisplayName="選擇圖片"
            Multiple={AnnouncementPictureUploadLimit.maxFileCount > 1}
            InputValue=""
            accept={AnnouncementPictureUploadLimit.accept}
            maxFileCount={AnnouncementPictureUploadLimit.maxFileCount}
            maxFileSizeMB={AnnouncementPictureUploadLimit.maxFileSizeMB}
            ShowPreview={true}
            ShowFileNameAndImg={false}
            parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
            onChange={(files) => handleAnnouncementPictureChange(files, opt.binding, opt.uploadPic.handleFileChange)}
        >
            <LibPicture
                key="preview"
                ColumnDisplayName={opt.uploadPic.result.previewUrl ?? ""}
                PicSrc={opt.previewSrc}
                PicDescription="選中的圖片"
                onRemove={() => handleAnnouncementPictureRemove(opt)}
                removeDisabled={!hasPicture}
            />
        </LibFile>
    );
};

/** 判斷欄位節點是否可加入畫面陣列。 */
const isAnnouncementFormFieldNode = (node: AnnouncementFormFieldNode | undefined): node is AnnouncementFormFieldNode =>
{
    return node !== undefined;
};

/** 建立 Detail 語系分頁內容，畫面只依 Hook 整理後的 Tab 項目渲染。 */
const buildDetailTabContent = (opt: DetailTabContentOptions): Record<string, ReactNode[]> =>
{
    return opt.tabItems.reduce<Record<string, ReactNode[]>>((compMap, tabItem) =>
    {
        compMap[tabItem.key] = buildDetailFields({ ...opt, rowKeys: tabItem.rowKeys, detailRowId: tabItem.detailRowId });
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
            {...opt.setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Title, "string", opt.rowKeys)}
        />,
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.SubTitle, "string", opt.rowKeys)}
        />,
        <LibTinyMCE
            Style={opt.theme.TinyMCE}
            {...opt.setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Content, "string", opt.rowKeys)}
        />,
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Url, "string", opt.rowKeys)}
        />,
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.UrlDescription, "string", opt.rowKeys)}
        />,
        <SubDetailComp binding={opt.binding} parentRowId={opt.detailRowId} />,
    ];
};

/** 建立圖片預覽來源，沒有圖片時回傳預設圖。 */
const buildPicturePreviewSrc = (binding: ServerFormBinding<AnnouncementSet>, uploadPic: ReturnType<typeof useUploadPicture>): string =>
{
    const initialPicId = binding.data?.Announcement?.PictureId;
    return uploadPic.result.previewUrl || (FileManagementAPI.get_Server_Preview_Url(initialPicId) ?? "https://dummyimage.com/1920x550/555/fff.png");
};

/** 判斷公告主圖是否已有真實圖片來源。 */
const hasAnnouncementPicture = (binding: ServerFormBinding<AnnouncementSet>, uploadPic: ReturnType<typeof useUploadPicture>): boolean =>
{
    const pictureId = LibText.safeTrim(binding.data?.Announcement?.PictureId);
    return Boolean(uploadPic.result.previewUrl || pictureId);
};

/** 手動移除公告主圖，並重掛圖片 input 清除瀏覽器已選檔案。 */
const handleAnnouncementPictureRemove = (opt: HeaderTabContentOptions): void =>
{
    handleAnnouncementPictureChange([], opt.binding, opt.uploadPic.handleFileChange);
    opt.onResetPictureInput();
};
// #endregion

// #region Private
/** 上傳或清除公告主圖，並同步圖片 ID 與圖片說明。 */
const handleAnnouncementPictureChange = (files: File[], binding: ServerFormBinding<AnnouncementSet>, handleFileChange: UploadPictureHandler): void =>
{
    if (files.length === 0)
    {
        clearAnnouncementPictureInfo(binding);
        void handleFileChange([]);
        return;
    }

    const pictureDescription = buildAnnouncementPictureDescription(files[0]);
    void handleFileChange(files, (fileId) => updateAnnouncementPictureInfo(binding, fileId, pictureDescription));
};

/** 清除公告主圖 InternalId 與圖片說明。 */
const clearAnnouncementPictureInfo = (binding: ServerFormBinding<AnnouncementSet>): void =>
{
    binding.setFormData(prev => buildAnnouncementPictureClearData(prev ?? announcementEmptyData));
};

/** 回寫公告主圖 InternalId，並同步覆蓋圖片說明。 */
const updateAnnouncementPictureInfo = (binding: ServerFormBinding<AnnouncementSet>, fileId: string, pictureDescription: string): void =>
{
    binding.setFormData(prev => buildAnnouncementPictureData(prev ?? announcementEmptyData, fileId, pictureDescription));
};

/** 建立公告主圖清除後資料，避免保留舊圖片與舊圖片說明。 */
const buildAnnouncementPictureClearData = (source: AnnouncementSet): AnnouncementSet =>
{
    return {
        ...source,
        Announcement: {
            ...source.Announcement,
            PictureId: "",
            PicDescription: "",
        },
    };
};

/** 建立公告主圖更新後資料，圖片說明跟著新檔案同步更新。 */
const buildAnnouncementPictureData = (source: AnnouncementSet, fileId: string, pictureDescription: string): AnnouncementSet =>
{
    return {
        ...source,
        Announcement: {
            ...source.Announcement,
            PictureId: fileId,
            PicDescription: pictureDescription,
        },
    };
};

/** 從圖片檔案建立預設圖片說明，去除副檔名。 */
const buildAnnouncementPictureDescription = (file?: File): string =>
{
    const description = LibAttachment.getDisplayFileNameWithoutExtension(file);
    return LibText.safeTrim(description);
};
// #endregion