import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { SystemInfoTabComp } from "@/Features/Pages/Server/Scaffold/SystemTab/SystemTab";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { DividerComp } from "@/SysCore/Components/Divider/Divider_Comp";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCheckBox, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { FileArchiveFields, FileArchiveInfoFields, FileArchiveSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    type FileArchiveDetailTabItem,
    fileArchiveEmptyData,
    type FileArchiveFormRefs,
    type FileArchiveInfoRowKeys,
    useFileArchiveDetailTabs,
    useFileArchiveFileEditGrid,
    useFileArchiveFormTemplate,
    useFileArchiveUrlEditGrid,
} from "./Server_FileArchive_Form_Hook";

// #region Property
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];


interface FileArchiveFormCompProps
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
    binding: ServerFormBinding<FileArchiveSet>;

    /** FileArchive Hook 整理後的參照資料 */
    refs: FileArchiveFormRefs;
}


interface DetailSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<FileArchiveSet>;

    /** FileArchive Hook 整理後的參照資料 */
    refs: FileArchiveFormRefs;
}


interface SubDetailSectionProps
{
    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<FileArchiveSet>;

    /** 目前 Detail RowId，給 SubDetail Grid 綁 ParentRowId */
    parentRowId: number;
}


interface UrlSubDetailSectionProps extends SubDetailSectionProps
{
    /** WindowTarget 下拉選項 */
    windowTargetOpts: Record<string, string>;
}


interface HeaderTabContentOptions extends HeaderSectionProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<FileArchiveSet>>;
}


interface DetailTabContentOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<FileArchiveSet>;

    /** Hook 整理後的 Detail tabs */
    tabItems: FileArchiveDetailTabItem[];

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<FileArchiveSet>>;

    /** FileArchive Hook 整理後的參照資料 */
    refs: FileArchiveFormRefs;
}


interface DetailFieldsOptions
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<FileArchiveSet>;

    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<FileArchiveSet>>;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: FileArchiveInfoRowKeys;

    /** Detail RowId，給 SubDetail 綁 ParentRowId */
    detailRowId: number;

    /** WindowTarget 下拉選項 */
    windowTargetOpts: Record<string, string>;
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
/** 後台檔案室 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_FileArchive_Form_Comp = (props: FileArchiveFormCompProps) =>
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

    const template = useFileArchiveFormTemplate({
        lang: props.lang,
        theme: props.theme,
        internalId: internalId ?? "",
        emptyData: fileArchiveEmptyData,
        actionsOpt,
    });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => (
                <>
                    <HeaderComp theme={props.theme} binding={vm.binding} refs={vm.refs} />
                    <DetailComp theme={props.theme} lang={props.lang} binding={vm.binding} refs={vm.refs} />
                </>
            )}
        />
    );
};
// #endregion

// #region Section
/** 檔案室 Header 區塊，直接使用新版 Template Binding 與 Refs。 */
const HeaderComp = (props: HeaderSectionProps) =>
{
    const setField = useSetTableField<FileArchiveSet>(props.binding);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤", System: "系統資訊" } };
    const tabContent = buildHeaderTabContent({ ...props, setField });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};


/** 檔案室多語 Detail 區塊，語系資料由 Hook 統一整理。 */
const DetailComp = (props: DetailSectionProps) =>
{
    const setField = useSetTableField<FileArchiveSet>(props.binding);
    const detailTabs = useFileArchiveDetailTabs({ binding: props.binding, lang: props.lang });
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: detailTabs.tabItems };
    const tabContent = buildDetailTabContent({ ...props, tabItems: detailTabs.items, setField });

    return <TabContentComp tabInfos={tabInfo} components={tabContent}></TabContentComp>;
};


/** 檔案室檔案 SubDetail 區塊，直接掛載 Hook 產生的 EditGrid props。 */
const FileSubDetailComp = (props: SubDetailSectionProps) =>
{
    const fileGrid = useFileArchiveFileEditGrid({ binding: props.binding, parentRowId: props.parentRowId, style: editGridStyle });

    return (
        <div className="mt-4">
            <EditGrid {...fileGrid.editGridProps} />
        </div>
    );
};


/** 檔案室外部連結 SubDetail 區塊，直接掛載 Hook 產生的 EditGrid props。 */
const UrlSubDetailComp = (props: UrlSubDetailSectionProps) =>
{
    const urlGrid = useFileArchiveUrlEditGrid({
        binding: props.binding,
        parentRowId: props.parentRowId,
        windowTargetOpts: props.windowTargetOpts,
        style: editGridStyle,
    });

    return (
        <div className="mt-4">
            <EditGrid {...urlGrid.editGridProps} />
        </div>
    );
};
// #endregion

// #region Protected
/** 建立檔案室 Header 的各分頁欄位。 */
const buildHeaderTabContent = (opt: HeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    return {
        Basic: buildBasicFields(opt),
        Status: buildStatusFields(opt),
        Tags: buildTagFields(opt),
        System: [<SystemInfoTabComp theme={opt.theme} formData={opt.binding} setKey={FileArchiveSetFields.FileArchive} />],
    };
};


/** 建立基本資料欄位。 */
const buildBasicFields = (opt: HeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.categoryMap}
            {...opt.setField(FileArchiveSetFields.FileArchive, FileArchiveFields.CategoriesId, "string", undefined, "csv")}
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
            {...opt.setField(FileArchiveSetFields.FileArchive, FileArchiveFields.ContentStatus, "number", undefined, {
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
            {...opt.setField(FileArchiveSetFields.FileArchive, FileArchiveFields.TagsId, "string", undefined, "csv")}
        />,
    ];
};


/** 建立 Detail 語系分頁內容，畫面只依 Hook 整理後的 Tab 項目渲染。 */
const buildDetailTabContent = (opt: DetailTabContentOptions): Record<string, ReactNode[]> =>
{
    return opt.tabItems.reduce<Record<string, ReactNode[]>>((compMap, tabItem) =>
    {
        compMap[tabItem.key] = buildDetailFields({
            theme: opt.theme,
            binding: opt.binding,
            setField: opt.setField,
            rowKeys: tabItem.rowKeys,
            detailRowId: tabItem.detailRowId,
            windowTargetOpts: opt.refs.windowTargetOpts,
        });
        return compMap;
    }, {});
};


/** 建立單一語系 Detail 欄位與 SubDetail Grid。 */
const buildDetailFields = (opt: DetailFieldsOptions): ReactNode[] =>
{
    return [
        <LibTextBox
            Style={opt.theme.TextBox}
            DefaultInputDisplay="請輸入標題 ..."
            {...opt.setField(FileArchiveSetFields.FileArchiveInfo, FileArchiveInfoFields.Title, "string", opt.rowKeys)}
        />,
        <DividerComp />,
        <FileSubDetailComp binding={opt.binding} parentRowId={opt.detailRowId} />,
        <DividerComp />,
        <UrlSubDetailComp binding={opt.binding} parentRowId={opt.detailRowId} windowTargetOpts={opt.windowTargetOpts} />,
    ];
};
// #endregion
