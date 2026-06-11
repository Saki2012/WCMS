import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { PreviewFrame } from "@/Features/Pages/Server/Scaffold/PreviewFrame/PreviewFrame";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibCalendar } from "@/SysCore/Components/FormField/FieldComponets/LibCalendar_Comp";
import { LibCheckBox } from "@/SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import { useUploadPicture } from "@/SysCore/Components/FormField/FieldComponets/LibPicture_Comp";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibFile, LibPicture, LibTextBox, LibTinyMCE } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields, AnnouncementSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    type AnnouncementDetailRowKeys,
    type AnnouncementDetailTabItem,
    announcementEmptyData,
    type AnnouncementFormRefs,
    useAnnouncementDetailTabs,
    useAnnouncementFileEditGrid,
    useAnnouncementFormTemplate,
} from "./Server_Announcement_Form_Hook";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

type PreviewPayload = { type: "wcms:preview"; module: "announcement"; payload: { kind: "dto"; dto: AnnouncementSet; }; };


interface AnnouncementFormCompProps
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


interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<AnnouncementSet>>;

    /** 圖片上傳 hook */
    uploadPic: ReturnType<typeof useUploadPicture>;

    /** 圖片預覽來源 */
    previewSrc: string;
}


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
// #endregion

// #region Public
/** 後台公告 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_Announcement_Form_Comp = (props: AnnouncementFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const [open, setOpen] = useState(false);
    const [payload, setPayload] = useState<PreviewPayload | undefined>(undefined);

    const onBackToList = useCallback(() =>
    {
        navigate(LibRoutePath.buildServerBackToListPath(pathname));
    }, [navigate, pathname]);

    const handlePreviewFromDto = useCallback((dto: AnnouncementSet) =>
    {
        setPayload(buildPreviewPayload(dto));
        setOpen(true);
    }, []);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList, onPreviewFromDto: handlePreviewFromDto };
    }, [handlePreviewFromDto, onBackToList]);

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
            renderContent={({ vm }) => (
                <>
                    <HeaderComp theme={props.theme} binding={vm.binding} refs={vm.refs} />
                    <DetailComp theme={props.theme} lang={props.lang} binding={vm.binding} />
                    <PreviewFrame
                        open={open}
                        siteIndex={""}
                        onClose={() => setOpen(false)}
                        payload={payload}
                        title="預覽"
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
    const previewSrc = buildPicturePreviewSrc(props.binding, uploadPic);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤", Pic: "圖片", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField, uploadPic, previewSrc });

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
    return {
        Basic: buildBasicFields(opt),
        Status: buildStatusFields(opt),
        Tags: buildTagFields(opt),
        Pic: buildPictureFields(opt),
        System: [<SystemInfoTabComp theme={opt.theme} formData={opt.binding} setKey={AnnouncementSetFields.Announcement} />],
    };
};


/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.categoryMap}
            {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Categories, "string", undefined, "csv")}
        />,
        <LibCalendar {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start, "datetime")} />,
        <LibCalendar {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Validate_End, "datetime")} />,
    ];
};


/** 建立狀態欄位。 */
const buildStatusFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.statusOpts}
            {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.ContentStatus, "number", undefined, {
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
            {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.Tags, "string", undefined, "csv")}
        />,
    ];
};


/** 建立圖片欄位。 */
const buildPictureFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibFile
            Style={opt.theme.File}
            ColumnDisplayName="選擇圖片"
            Multiple={false}
            InputValue=""
            accept="image/*"
            parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"
            onChange={(files) => opt.uploadPic.handleFileChange(files, (fileId) => updateAnnouncementPictureId(opt.binding, fileId))}
        >
            <LibPicture key="preview" ColumnDisplayName={opt.uploadPic.result.previewUrl ?? ""} PicSrc={opt.previewSrc} PicDescription="選中的圖片" />
        </LibFile>,
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入"
            {...opt.setField(AnnouncementSetFields.Announcement, AnnouncementFields.PicDescription, "string")}
        />,
    ];
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


/** 建立公告預覽 payload，讓 PreviewFrame 只接固定資料格式。 */
const buildPreviewPayload = (dto: AnnouncementSet): PreviewPayload =>
{
    return { type: "wcms:preview", module: "announcement", payload: { kind: "dto", dto } };
};


/** 建立圖片預覽來源，沒有圖片時回傳預設圖。 */
const buildPicturePreviewSrc = (binding: ServerFormBinding<AnnouncementSet>, uploadPic: ReturnType<typeof useUploadPicture>): string =>
{
    const initialPicId = binding.data?.Announcement?.PictureId;
    return (uploadPic.result.previewUrl || (FileManagementAPI.get_Server_Preview_Url(initialPicId) ?? "https://dummyimage.com/1920x550/555/fff.png"));
};
// #endregion

// #region Private
/** 回寫公告主圖 InternalId，避免圖片欄位直接處理 DTO 細節。 */
const updateAnnouncementPictureId = (binding: ServerFormBinding<AnnouncementSet>, fileId: string): void =>
{
    binding.setFormData((prev) => ({ ...prev, Announcement: { ...prev.Announcement, PictureId: fileId } }));
};
// #endregion
