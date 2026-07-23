import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, EditGridCellValue, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import type { LibTabsProp } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/FieldComponets/LibTabs_Comp";
import { LibDropList, LibFile, LibModal, LibPicturePreview, LibTextArea, LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useFormModelField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { TabContentComp } from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { SpecMusicalFields, SpecMusicalPictureListFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    getSpecMusicalPicturePreviewUrl,
    getSpecMusicalSoundPreviewUrl,
    specMusicalEmptyData,
    type SpecMusicalFormRefs,
    toSpecMusicalPictureCellValue,
    toSpecMusicalSoundCellValue,
    useSpecMusicalBatchPhotoUpload,
    useSpecMusicalCoverSelector,
    useSpecMusicalFormTemplate,
    useSpecMusicalPhotoEditGrid,
    useSpecMusicalSoundEditGrid,
} from "./Server_SpecMusical_Form_Hook";

// #region Property
type SpecMusicalFormModel = components["schemas"]["SpecMusical"];

/** 琵琶介紹批次圖片上傳限制。 */
export const SpecMusicalBatchPhotoUploadLimit = {
    accept: "image/*",
    multiple: true,
    maxFileCount: 20,
    maxFileSizeMB: 10,
} as const;


interface SpecMusicalFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** 目前語系 */
    lang: Lang;
}

interface SpecMusicalContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<SpecMusicalFormModel>;

    /** SpecMusical Hook 整理後的參照資料 */
    refs: SpecMusicalFormRefs;
}

interface SpecMusicalBasicProps extends SpecMusicalContentProps
{
    /** 類別下拉選項 */
    cateOpts: Map<string, string>;
}

interface SpecMusicalGridProps
{
    /** 後台主題設定 */
    theme: IBETheme;

    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<SpecMusicalFormModel>;
}

interface SpecMusicalPhotoBatchPreviewProps
{
    /** 批次上傳前選取的檔案 */
    files: File[];

    /** 移除指定預覽檔案 */
    onRemove: (index: number) => void;
}

interface SpecMusicalPicturePreviewProps
{
    /** EditGrid 圖片欄位值 */
    value: EditGridCellValue;

    /** 清除圖片與連動圖片說明 */
    onRemove: () => void;

    /** 控制 EditGrid 內刪除按鈕是否停用。 */
    removeDisabled?: boolean;
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
/** 後台琵琶介紹 Form，透過新版 Form Template 統一外框與資料流程。 */
export const Server_SpecMusical_Form_Comp = (props: SpecMusicalFormCompProps) =>
{
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    const onBackToList = useCallback(() =>
    {
        const listPath = LibRoutePath.buildServerBackToListPath(pathname);
        markPageStateMemoryEntry(listPath, "normalize");
        navigate(listPath, { replace: true });
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = useSpecMusicalFormTemplate({ lang: props.lang, theme: props.theme, internalId: internalId ?? "", emptyData: specMusicalEmptyData, actionsOpt });

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={({ vm }) => <SpecMusicalContentComp theme={props.theme} binding={vm.binding} refs={vm.refs} />}
        />
    );
};
// #endregion

// #region Section
/** 琵琶介紹主要內容，基本資料 / 相片 / 音檔統一由 Template binding 驅動。 */
const SpecMusicalContentComp = (props: SpecMusicalContentProps) =>
{
    const cateOpts = useMemo(() => new Map<string, string>(Object.entries(props.refs.categoryMap ?? {})), [props.refs.categoryMap]);
    const tabInfo: LibTabsProp = { Style: props.theme.Tabs, item: { Basic: "基本資料", Photo: "相片", Sound: "音檔" } };
    const components = buildSpecMusicalTabContent({ ...props, cateOpts });

    return <TabContentComp tabInfos={tabInfo} components={components} />;
};

/** 基本資料欄位，維持舊版欄位排列。 */
const SpecMusicalBasicComp = (props: SpecMusicalBasicProps) =>
{
    const setField = useFormModelField<SpecMusicalFormModel>(props.binding);

    return <>{buildSpecMusicalBasicFields(props.theme, setField, props.cateOpts)}</>;
};

/** 相片區塊，改由 EditGrid 處理單筆新增、上傳、封面、排序與刪除。 */
const SpecMusicalPhotoGridComp = (props: SpecMusicalGridProps) =>
{
    const cover = useSpecMusicalCoverSelector(props.binding);
    const renderPicturePreview = useCallback((args: EditGridCellRenderArgs) => (
        <SpecMusicalPicturePreview value={args.value} onRemove={() => clearSpecMusicalPictureCell(args, props.binding)} removeDisabled={true} />
    ), [props.binding]);
    const renderCoverSelector = useCallback(
        (args: EditGridCellRenderArgs) => <SpecMusicalCoverSelector value={args.value} selected={cover.selected} onSelect={cover.select} />,
        [cover.select, cover.selected],
    );
    const photoGrid = useSpecMusicalPhotoEditGrid({ binding: props.binding, style: editGridStyle, renderPicturePreview, renderCoverSelector });

    return (
        <div className="form-group">
            <SpecMusicalPhotoBatchUploadComp theme={props.theme} binding={props.binding} />
            <EditGrid {...photoGrid.editGridProps} />
        </div>
    );
};

/** 音檔區塊，改由 EditGrid 處理單筆新增、上傳、名稱與刪除。 */
const SpecMusicalSoundGridComp = (props: SpecMusicalGridProps) =>
{
    const renderSoundPreview = useCallback((args: EditGridCellRenderArgs) => <SpecMusicalSoundPreview value={args.value} />, []);
    const soundGrid = useSpecMusicalSoundEditGrid({ binding: props.binding, style: editGridStyle, renderSoundPreview });

    return (
        <div className="form-group">
            <EditGrid {...soundGrid.editGridProps} />
        </div>
    );
};

/** 批次上傳圖片，和 EditGrid 內建新增單筆按鈕分離。 */
const SpecMusicalPhotoBatchUploadComp = (props: { theme: IBETheme; binding: ServerFormBinding<SpecMusicalFormModel>; }) =>
{
    const batch = useSpecMusicalBatchPhotoUpload({ binding: props.binding });
    /** 移除批次上傳前的單張預覽圖片。 */
    const handleRemoveSelectedFile = useCallback((removeIndex: number) =>
    {
        const nextFiles = batch.selectedFiles.filter((_file, index) => index !== removeIndex);
        batch.setSelectedFiles(nextFiles);
    }, [batch.selectedFiles, batch.setSelectedFiles]);

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
                                accept={SpecMusicalBatchPhotoUploadLimit.accept}
                                Multiple={SpecMusicalBatchPhotoUploadLimit.multiple}
                                maxFileCount={SpecMusicalBatchPhotoUploadLimit.maxFileCount}
                                maxFileSizeMB={SpecMusicalBatchPhotoUploadLimit.maxFileSizeMB}
                                onChange={batch.setSelectedFiles}
                                InputValue=""
                            />
                        </div>
                        {batch.error && <div className="col-12 alert alert-danger mt-2">{batch.error}</div>}
                    </div>
                    <SpecMusicalPhotoBatchPreview files={batch.selectedFiles} onRemove={handleRemoveSelectedFile} />
                </div>
            </LibModal>
        </div>
    );
};
// #endregion

// #region Protected
/** 清除 EditGrid 相片欄位與連動圖片說明。 */
const clearSpecMusicalPictureCell = (args: EditGridCellRenderArgs, binding: ServerFormBinding<SpecMusicalFormModel>): void =>
{
    const picture = toSpecMusicalPictureCellValue(args.value);
    args.updateValues({
        [SpecMusicalPictureListFields.PicSrcId]: "",
        [SpecMusicalPictureListFields.Info]: "",
    });
    clearSpecMusicalCoverIfSame(binding, picture.internalId);
};

/** 若被清除圖片為目前封面，則同步清空封面。 */
const clearSpecMusicalCoverIfSame = (binding: ServerFormBinding<SpecMusicalFormModel>, picId?: string | null): void =>
{
    const targetPicId = String(picId ?? "").trim();
    if (!targetPicId) return;
    binding.setFormData(prev =>
    {
        const data = prev ?? specMusicalEmptyData;
        if (data.CoverPicId !== targetPicId) return data;
        return { ...data, CoverPicId: null };
    });
};

/** 建立主分頁內容。 */
const buildSpecMusicalTabContent = (props: SpecMusicalBasicProps): Record<string, ReactNode[]> =>
{
    return {
        Basic: [<SpecMusicalBasicComp key="basic" theme={props.theme} binding={props.binding} refs={props.refs} cateOpts={props.cateOpts} />],
        Photo: [<SpecMusicalPhotoGridComp key="photo-grid" theme={props.theme} binding={props.binding} />],
        Sound: [<SpecMusicalSoundGridComp key="sound-grid" theme={props.theme} binding={props.binding} />],
    };
};

/** 建立基本資料欄位。 */
const buildSpecMusicalBasicFields = (
    theme: IBETheme,
    setField: ReturnType<typeof useFormModelField<SpecMusicalFormModel>>,
    cateOpts: Map<string, string>,
): ReactNode[] =>
{
    return [
        <div key="category" className="col-12 form-group">
            <LibDropList
                Style={theme.DropList}
                Options={cateOpts}
                {...setField(SpecMusicalFields.CategoryId, "string")}
            />
        </div>,
        <div key="name" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.MusicalName, "string")}
            />
        </div>,
        <div key="spec-row-1" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.Specification, "string")}
            />
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.Headstock, "string")}
            />
        </div>,
        <div key="spec-row-2" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.Backboard, "string")}
            />
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.ScaleLength, "string")}
            />
        </div>,
        <div key="spec-row-3" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.Bridge, "string")}
            />
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.BodyForm, "string")}
            />
        </div>,
        <div key="material" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.Material, "string")}
            />
        </div>,
        <div key="info" className="col-12 form-group">
            <LibTextArea
                Style={theme.TextArea}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalFields.Info, "string")}
            />
        </div>,
    ];
};
// #endregion

// #region Private
/** 批次上傳前預覽圖片。 */
const SpecMusicalPhotoBatchPreview = (props: SpecMusicalPhotoBatchPreviewProps) =>
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
                                <LibPicturePreview ColumnDisplayName={file.name} PicSrc={url} PicDescription={`選中的圖片 ${file.name}`} onRemove={() => props.onRemove(index)} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/** 相片預覽元件，沒有圖片時以文字提示避免破圖。 */
const SpecMusicalPicturePreview = (props: SpecMusicalPicturePreviewProps) =>
{
    const picture = toSpecMusicalPictureCellValue(props.value);
    const previewUrl = picture.url ?? getSpecMusicalPicturePreviewUrl(picture.internalId);
    const alt = picture.originalFileName || picture.fileName || "相片預覽";

    if (!previewUrl) return <span className="small">尚未選擇圖片</span>;
    return <LibPicturePreview ColumnDisplayName={alt} PicSrc={previewUrl} PicDescription={alt} onRemove={props.onRemove} removeDisabled={props.removeDisabled} />;
};

/** 封面選擇按鈕，實際資料寫回 Header 的 CoverPicId。 */
const SpecMusicalCoverSelector = (props: { value: EditGridCellValue; selected: string | null; onSelect: (picId: string) => void; }) =>
{
    const picture = toSpecMusicalPictureCellValue(props.value);
    const picId = String(picture.internalId ?? "").trim();
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

/** 音檔預覽元件，支援瀏覽器可播放格式與下載連結。 */
const SpecMusicalSoundPreview = (props: { value: EditGridCellValue; }) =>
{
    const sound = toSpecMusicalSoundCellValue(props.value);
    const previewUrl = sound.url ?? getSpecMusicalSoundPreviewUrl(sound.internalId);
    const displayName = sound.originalFileName || sound.fileName || "音檔";

    if (!sound.internalId && !previewUrl) return <span className="small">尚未選擇音檔</span>;

    return (
        <div className="d-flex flex-column gap-1">
            {previewUrl && <audio src={previewUrl} controls preload="metadata" style={{ maxWidth: "260px" }} aria-label={displayName} />}
            {sound.downloadUrl ? <a className="small text-break" href={sound.downloadUrl} target="_blank" rel="noopener noreferrer">{displayName}</a> : <span className="small text-break">{displayName}</span>}
        </div>
    );
};
// #endregion
