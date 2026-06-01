import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, EditGridCellValue, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { LibTabsProp } from "@/SysCore/Components/FormField/FieldComponets/LibTabs_Comp";
import { LibDropList, LibFile, LibModal, LibPicturePreview, LibTextArea, LibTextBox } from "@/SysCore/Components/FormField/LibFormField";
import { useSetTableField } from "@/SysCore/Components/FormField/useSetTableField";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import { SpecMusicalModelFields, SpecMusicalSetFields } from "@/types/SchemaFields";
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
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

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
    binding: ServerFormBinding<SpecMusicalSet>;

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
    binding: ServerFormBinding<SpecMusicalSet>;
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
        navigate(buildBackToListPath(pathname));
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
    const setField = useSetTableField<SpecMusicalSet>(props.binding);

    return <>{buildSpecMusicalBasicFields(props.theme, setField, props.cateOpts)}</>;
};

/** 相片區塊，改由 EditGrid 處理單筆新增、上傳、封面、排序與刪除。 */
const SpecMusicalPhotoGridComp = (props: SpecMusicalGridProps) =>
{
    const cover = useSpecMusicalCoverSelector(props.binding);
    const renderPicturePreview = useCallback((args: EditGridCellRenderArgs) => <SpecMusicalPicturePreview value={args.value} />, []);
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
// #endregion

// #region EntityComp
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
    setField: ReturnType<typeof useSetTableField<SpecMusicalSet>>,
    cateOpts: Map<string, string>,
): ReactNode[] =>
{
    return [
        <div key="category" className="col-12 form-group">
            <LibDropList
                Style={theme.DropList}
                Options={cateOpts}
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.CategoryId, "string")}
            />
        </div>,
        <div key="name" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.MusicalName, "string")}
            />
        </div>,
        <div key="spec-row-1" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Specification, "string")}
            />
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Headstock, "string")}
            />
        </div>,
        <div key="spec-row-2" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Backboard, "string")}
            />
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.ScaleLength, "string")}
            />
        </div>,
        <div key="spec-row-3" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Bridge, "string")}
            />
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.BodyForm, "string")}
            />
        </div>,
        <div key="material" className="col-12 form-group">
            <LibTextBox
                Style={theme.TextBox3}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Material, "string")}
            />
        </div>,
        <div key="info" className="col-12 form-group">
            <LibTextArea
                Style={theme.TextArea}
                DefaultInputDisplay="請輸入"
                {...setField(SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.Info, "string")}
            />
        </div>,
    ];
};

/** 批次上傳圖片，和 EditGrid 內建新增單筆按鈕分離。 */
const SpecMusicalPhotoBatchUploadComp = (props: { theme: IBETheme; binding: ServerFormBinding<SpecMusicalSet>; }) =>
{
    const batch = useSpecMusicalBatchPhotoUpload({ binding: props.binding });

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
                                Multiple={true}
                                onChange={batch.setSelectedFiles}
                                InputValue=""
                            />
                        </div>
                        {batch.error && <div className="col-12 alert alert-danger mt-2">{batch.error}</div>}
                    </div>
                    <SpecMusicalPhotoBatchPreview files={batch.selectedFiles} />
                </div>
            </LibModal>
        </div>
    );
};

/** 批次上傳前預覽圖片。 */
const SpecMusicalPhotoBatchPreview = (props: { files: File[]; }) =>
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
const SpecMusicalPicturePreview = (props: { value: EditGridCellValue; }) =>
{
    const picture = toSpecMusicalPictureCellValue(props.value);
    const previewUrl = picture.url ?? getSpecMusicalPicturePreviewUrl(picture.internalId);
    const alt = picture.originalFileName || picture.fileName || "相片預覽";

    if (!previewUrl) return <span className="small">尚未選擇圖片</span>;
    return <img src={previewUrl} alt={alt} style={{ maxWidth: "160px", maxHeight: "120px", objectFit: "contain" }} />;
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

// #region Private
/** 建立返回 List 的路徑。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(\/[^\/]*)?$/, "/List");
};
// #endregion
