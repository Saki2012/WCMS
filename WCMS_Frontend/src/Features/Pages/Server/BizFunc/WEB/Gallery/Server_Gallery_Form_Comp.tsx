import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type {
    EditGridCellRenderArgs,
    EditGridCellValue,
    EditGridEditingStateArgs,
    GridRow,
    IEditGridView_Style,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { getEditGridCellValue, getEditGridRowId, getEditGridRowKey, useEditGridSubDetailState } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibCalendar, LibCheckBox, LibFile, LibModal, LibPicturePreview, LibTextBox, LibTinyMCE } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useSetTableField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { GalleryFields, GalleryInfoFields, GalleryPhotosFields, GallerySetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    GalleryBatchPhotoUploadLimit,
    galleryEmptyData,
    type GalleryFormRefs,
    type GalleryInfoRowKeys,
    getGalleryPhotoPreviewUrl,
    toGalleryPhotoCellValue,
    useGalleryBatchPhotoUpload,
    useGalleryCoverSelector,
    useGalleryFormTemplate,
    useGalleryInfoTabs,
    useGalleryPhotoEditGrid,
    useGalleryPhotoInfoEditGrid,
} from "./Server_Gallery_Form_Hook";

// #region Property
type GallerySet = components["schemas"]["GallerySet_DTO"];

interface GalleryFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface GalleryContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<GallerySet>;

    /** Gallery Hook 整理後的參照資料 */
    refs: GalleryFormRefs;
}

interface GalleryHeaderProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<GallerySet>;

    /** Gallery Hook 整理後的參照資料 */
    refs: GalleryFormRefs;
}

interface GalleryInfoProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<GallerySet>;
}

interface PhotoGridProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<GallerySet>;
}

interface PhotoInfoSubDetailProps extends PhotoGridProps
{
    /** 目前相片 RowId */
    parentRowId: number;

    /** 子明細編輯狀態變化 */
    onEditingStateChange: (args: EditGridEditingStateArgs) => void;
}

interface GalleryHeaderTabContentOptions extends GalleryHeaderProps
{
    /** 欄位 binding helper */
    setField: ReturnType<typeof useSetTableField<GallerySet>>;
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
/** 後台相簿 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_GalleryFormComp = (props: GalleryFormCompProps) =>
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

    const template = useGalleryFormTemplate({ lang: props.lang, theme: props.theme, internalId: internalId ?? "", emptyData: galleryEmptyData, actionsOpt });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => <GalleryContentComp theme={props.theme} lang={props.lang} binding={vm.binding} refs={vm.refs} />}
        />
    );
};
// #endregion

// #region Section
/** 相簿主要內容，維持相簿 / 相片兩個主要分頁。 */
const GalleryContentComp = (props: GalleryContentProps) =>
{
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Album: "相簿", Photo: "相片" } };
    const components = buildGalleryMainTabContent(props);

    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

/** 相簿 Header 區塊，維持舊版 Header input。 */
const GalleryHeaderComp = (props: GalleryHeaderProps) =>
{
    const setField = useSetTableField<GallerySet>(props.binding);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本", Status: "狀態", Tags: "標籤" } };
    const components = buildGalleryHeaderTabContent({ ...props, setField });

    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

/** 相簿語系 Detail 區塊，語系資料由 Hook 統一整理。 */
const GalleryInfoComp = (props: GalleryInfoProps) =>
{
    const setField = useSetTableField<GallerySet>(props.binding);
    const detailTabs = useGalleryInfoTabs({ binding: props.binding, lang: props.lang });
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: detailTabs.tabItems };
    const components = detailTabs.items.reduce<Record<string, ReactNode[]>>((compMap, item) =>
    {
        compMap[item.key] = buildGalleryInfoFields(props.theme, setField, item.rowKeys);
        return compMap;
    }, {});

    return <TabContentComp tabInfos={tabInfo} components={components}></TabContentComp>;
};

/** 相片區塊，批次上傳按鈕與 EditGrid 單筆新增按鈕分離。 */
const PhotoGridComp = (props: PhotoGridProps) =>
{
    const cover = useGalleryCoverSelector(props.binding);
    const coverSelectedRef = useRef<string | null>(cover.selected);
    const subDetailState = useEditGridSubDetailState();
    const subDetailExpandedRowKeyRef = useRef<string | null>(subDetailState.expandedRowKey);
    const subDetailEditingRef = useRef<boolean>(subDetailState.isSubDetailEditing);
    const renderPicturePreview = useCallback((args: EditGridCellRenderArgs) => <GalleryPicturePreview value={args.value} />, []);

    coverSelectedRef.current = cover.selected;
    subDetailExpandedRowKeyRef.current = subDetailState.expandedRowKey;
    subDetailEditingRef.current = subDetailState.isSubDetailEditing;

    /** 渲染封面按鈕，直接讀目前唯一封面值，避免 EditGrid 內部 cell value 不同步。 */
    const renderCoverSelector = useCallback(
        (args: EditGridCellRenderArgs) => (
            <GalleryCoverSelector
                value={getEditGridCellValue(args.row, GalleryPhotosFields.PicSrcId)}
                selected={coverSelectedRef.current}
                onSelect={cover.select}
            />
        ),
        [cover.select],
    );

    /** 渲染語系明細切換按鈕，使用 ref 讀最新展開狀態，避免 EditGrid cell render 吃舊閉包。 */
    const renderSubDetailToggle = useCallback(
        (args: EditGridCellRenderArgs) => (
            <GallerySubDetailToggleButton
                row={args.row}
                expandedRowKey={subDetailExpandedRowKeyRef.current}
                isSubDetailEditing={subDetailEditingRef.current}
                onToggle={subDetailState.toggleSubDetail}
            />
        ),
        [subDetailState.toggleSubDetail],
    );

    const renderSubDetail = useCallback(
        (args: { row: GridRow; rowIndex: number; }) => (
            <PhotoInfoSubDetailGridComp
                theme={props.theme}
                lang={props.lang}
                binding={props.binding}
                parentRowId={getEditGridRowId(args.row, args.rowIndex)}
                onEditingStateChange={subDetailState.onSubDetailEditingStateChange}
            />
        ),
        [props.binding, props.lang, props.theme, subDetailState.onSubDetailEditingStateChange],
    );

    const photoGrid = useGalleryPhotoEditGrid({
        binding: props.binding,
        style: editGridStyle,
        renderPicturePreview,
        renderCoverSelector,
        renderSubDetailToggle,
        renderSubDetail,
        expandedRowKey: subDetailState.expandedRowKey,
        isSubDetailEditing: subDetailState.isSubDetailEditing,
    });

    return (
        <div className="form-group">
            <GalleryBatchUploadComp theme={props.theme} binding={props.binding} />
            <EditGrid {...photoGrid.editGridProps} />
        </div>
    );
};

/** 相片語系 SubDetail Grid，固定由系統語系產生，不開放新增或刪除。 */
const PhotoInfoSubDetailGridComp = (props: PhotoInfoSubDetailProps) =>
{
    const infoGrid = useGalleryPhotoInfoEditGrid({ binding: props.binding, parentRowId: props.parentRowId, lang: props.lang, style: editGridStyle });

    return (
        <div className="p-3" style={{ backgroundColor: "#fafafa", border: "1px solid #dee2e6" }}>
            <div className="mb-2 font-weight-bold">語系明細</div>
            <EditGrid {...infoGrid.editGridProps} onEditingStateChange={props.onEditingStateChange} />
        </div>
    );
};

/** 批次上傳圖片，和 EditGrid 內建新增單筆按鈕分離。 */
const GalleryBatchUploadComp = (props: { theme: IBETheme; binding: ServerFormBinding<GallerySet>; }) =>
{
    const batch = useGalleryBatchPhotoUpload({ binding: props.binding });

    return (
        <div className="mb-3">
            <LibModal
                ModalName="批次上傳圖片"
                BtnName1="關閉"
                BtnName2="儲存並上傳"
                onConfirm={batch.uploadSelectedFiles}
                confirmDisabled={batch.isUploading || batch.selectedFiles.length === 0}
                confirmBusy={batch.isUploading}
            >
                <div className="row mx-0">
                    <div className="col-12">
                        <div className="row">
                            <LibFile
                                Style={props.theme.File}
                                ColumnDisplayName="選擇圖片(多選)"
                                accept={GalleryBatchPhotoUploadLimit.accept}
                                Multiple={GalleryBatchPhotoUploadLimit.maxFileCount > 1}
                                maxFileCount={GalleryBatchPhotoUploadLimit.maxFileCount}
                                maxFileSizeMB={GalleryBatchPhotoUploadLimit.maxFileSizeMB}
                                onChange={batch.setSelectedFiles}
                                InputValue=""
                            />
                        </div>
                        {batch.error && <div className="col-12 alert alert-danger mt-2">{batch.error}</div>}
                    </div>
                    <GalleryBatchPreview files={batch.selectedFiles} />
                </div>
            </LibModal>
        </div>
    );
};
// #endregion

// #region Protected
/** 建立相簿主分頁內容。 */
const buildGalleryMainTabContent = (props: GalleryContentProps): Record<string, ReactNode[]> =>
{
    return {
        Album: [
            <GalleryHeaderComp theme={props.theme} binding={props.binding} refs={props.refs} />,
            <GalleryInfoComp theme={props.theme} lang={props.lang} binding={props.binding} />,
        ],
        Photo: [<PhotoGridComp theme={props.theme} lang={props.lang} binding={props.binding} />],
    };
};

/** 建立相簿 Header 的各分頁欄位。 */
const buildGalleryHeaderTabContent = (opt: GalleryHeaderTabContentOptions): Record<string, ReactNode[]> =>
{
    return { Basic: buildGalleryBasicFields(opt), Status: buildGalleryStatusFields(opt), Tags: buildGalleryTagFields(opt) };
};

/** 建立相簿基本資料欄位。 */
const buildGalleryBasicFields = (opt: GalleryHeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.categoryMap}
            {...opt.setField(GallerySetFields.Gallery, GalleryFields.Categories, "string", undefined, "csv")}
        />,
        <LibCalendar {...opt.setField(GallerySetFields.Gallery, GalleryFields.Validate_Start, "datetime")}></LibCalendar>,
    ];
};

/** 建立相簿狀態欄位。 */
const buildGalleryStatusFields = (opt: GalleryHeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.statusOpts}
            {...opt.setField(GallerySetFields.Gallery, GalleryFields.ContentStatus, "number", undefined, {
                strategy: "sum",
                sumKeys: Object.keys(opt.refs.statusOpts ?? {}).map(Number),
            })}
        />,
    ];
};

/** 建立相簿標籤欄位。 */
const buildGalleryTagFields = (opt: GalleryHeaderTabContentOptions): ReactNode[] =>
{
    return [
        <LibCheckBox
            Style={opt.theme.CheckBox}
            options={opt.refs.tagMap}
            {...opt.setField(GallerySetFields.Gallery, GalleryFields.Tags, "string", undefined, "csv")}
        />,
    ];
};

/** 建立相簿語系欄位。 */
const buildGalleryInfoFields = (theme: IBETheme, setField: ReturnType<typeof useSetTableField<GallerySet>>, rowKeys: GalleryInfoRowKeys): ReactNode[] =>
{
    return [
        <LibTextBox
            Style={theme.TextBox}
            DefaultInputDisplay="請輸入標題 ..."
            {...setField(GallerySetFields.GalleryInfo, GalleryInfoFields.Title, "string", rowKeys)}
        />,
        <LibTinyMCE Style={theme.TinyMCE} {...setField(GallerySetFields.GalleryInfo, GalleryInfoFields.Content, "string", rowKeys)} />,
    ];
};
// #endregion

// #region Private
/** 批次上傳前預覽圖片。 */
const GalleryBatchPreview = (props: { files: File[]; }) =>
{
    if (props.files.length === 0) return null;

    return (
        <div className="col-12">
            <div className="row mt-3 mx-0">
                <div className="col-12 col-form-label bg-secondary mb-1">預覽圖片</div>
                {props.files.map((file, index) =>
                {
                    const url = URL.createObjectURL(file);
                    return (
                        <div key={`${file.name}-${index}`} className="col-12 border-bottom">
                            <div className="d-flex align-items-center">
                                <LibPicturePreview ColumnDisplayName={file.name} PicSrc={url} PicDescription={`選中的圖片 ${file.name}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/** 相片預覽元件，沒有圖片時以文字提示避免破圖。 */
const GalleryPicturePreview = (props: { value: EditGridCellValue; }) =>
{
    const photo = toGalleryPhotoCellValue(props.value);
    const previewUrl = photo.url ?? getGalleryPhotoPreviewUrl(photo.internalId);
    const alt = photo.originalFileName || photo.fileName || "相片預覽";

    if (!previewUrl) return <span className="small">尚未選擇圖片</span>;
    return <img src={previewUrl} alt={alt} style={{ maxWidth: "160px", maxHeight: "120px", objectFit: "contain" }} />;
};

/** 封面選擇按鈕，實際資料寫回 Header 的 CoverPicSrcId。 */
const GalleryCoverSelector = (props: { value: EditGridCellValue; selected: string | null; onSelect: (picId: string) => void; }) =>
{
    const photo = toGalleryPhotoCellValue(props.value);
    const picId = String(photo.internalId ?? "").trim();
    const isSelected = Boolean(picId && props.selected === picId);

    return (
        <button
            type="button"
            className={isSelected ? "btn btn-primary btn-sm" : "btn btn-outline-primary btn-sm"}
            disabled={!picId}
            aria-pressed={isSelected}
            onClick={() => props.onSelect(picId)}
        >
            {isSelected ? "目前封面" : "設為封面"}
        </button>
    );
};

/** 語系明細展開按鈕，避免把子 Grid 直接塞在同一欄位。 */
const GallerySubDetailToggleButton = (props: { row: GridRow; expandedRowKey: string | null; isSubDetailEditing: boolean; onToggle: (row: GridRow) => void; }) =>
{
    const rowKey = getEditGridRowKey(props.row);
    const isExpanded = props.expandedRowKey === rowKey;
    const title = isExpanded ? "收合語系明細" : "展開語系明細";

    return (
        <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            title={title}
            disabled={props.isSubDetailEditing}
            aria-expanded={isExpanded}
            onClick={() => props.onToggle(props.row)}
        >
            <i className={isExpanded ? "fa fa-eye-slash" : "fa fa-eye"} aria-hidden="true" />
            <span className="ml-1">{isExpanded ? "收合" : "查看"}</span>
        </button>
    );
};
// #endregion