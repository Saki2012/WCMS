import { bannerSliderEmptyData, type BannerSliderFormRefs, toBannerPictureCellValue, useBannerDetailEditGrid, useBannerDetailInfoEditGrid, useBannerSliderFormTemplate } from "@/Features/Pages/Server/BizFunc/WEB/Banner/Server_BannerSlider_Form_Hook";
import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import type { ServerFormBinding } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { EditGridCellRenderArgs, EditGridCellValue, EditGridEditingStateArgs, GridRow, IEditGridView_Style } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { getEditGridRowId, useEditGridSubDetailState } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { LibTextBox } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { useFormModelField } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/useSetTableField";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { markPageStateMemoryEntry } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Navigation";
import type { components } from "@/types/api";
import { BannerFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// #region Property
type BannerFormModel = components["schemas"]["Banner"];
interface BannerSliderFormCompProps
{
    /** 後台主題設定 */
    theme: IBETheme;
    /** 目前語系 */
    lang: Lang;
}
interface BannerContentProps
{
    /** 後台主題設定 */
    theme: IBETheme;
    /** 目前語系 */
    lang: Lang;
    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<BannerFormModel>;
    /** Banner Hook 整理後的參照資料 */
    refs: BannerSliderFormRefs;
}
interface HeaderSectionProps
{
    /** 後台主題設定 */
    theme: IBETheme;
    /** Form Template 提供的主資料 binding */
    binding: ServerFormBinding<BannerFormModel>;
}
interface DetailSectionProps extends BannerContentProps
{
}
interface DetailInfoSubDetailProps extends BannerContentProps
{
    /** 目前圖片 RowId */
    parentRowId: number;
    /** 子明細編輯狀態變化 */
    onEditingStateChange: (args: EditGridEditingStateArgs) => void;
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
/** Banner 輪播表單，透過新版 Form Template 統一外框與資料流程。 */
export const BannerSliderFormComp = (props: BannerSliderFormCompProps) =>
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
    const template = useBannerSliderFormTemplate({ lang: props.lang, theme: props.theme, internalId: internalId ?? "", emptyData: bannerSliderEmptyData, actionsOpt });
    return <Server_FormTemplate_Comp template={template} renderContent={({ vm }) => <BannerContentComp theme={props.theme} lang={props.lang} binding={vm.binding} refs={vm.refs} />} />;
};
// #endregion

// #region Section
/** Banner 主要內容，Header 維持舊 input，圖片明細改由 Hook 提供 EditGrid。 */
const BannerContentComp = (props: BannerContentProps) =>
{
    return (
        <>
            <HeaderSectionComp theme={props.theme} binding={props.binding} />
            <DetailSectionComp theme={props.theme} lang={props.lang} binding={props.binding} refs={props.refs} />
        </>
    );
};

/** 表頭設定區塊，維持既有 Header input 綁定方式。 */
const HeaderSectionComp = (props: HeaderSectionProps) =>
{
    const formField = useFormModelField<BannerFormModel>(props.binding);
    return (
        <>
            <div className="form-group">
                <div className="row">
                    <LibTextBox Style={props.theme.TextBox} DefaultInputDisplay="請輸入" {...formField(BannerFields.BannerCategoryName, "string")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...formField(BannerFields.Width, "number")} />
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...formField(BannerFields.Height, "number")} />
                </div>
            </div>
            <div className="form-group">
                <div className="row">
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...formField(BannerFields.Speed, "number")} />
                    <LibTextBox Style={props.theme.TextBox3} DefaultInputDisplay="請輸入" {...formField(BannerFields.Interval, "number")} />
                </div>
            </div>
        </>
    );
};

/** 圖片明細 Grid，透過眼睛按鈕展開該列的語系子明細。 */
const DetailSectionComp = (props: DetailSectionProps) =>
{
    const subDetailState = useEditGridSubDetailState();
    const renderPicturePreview = useCallback((args: EditGridCellRenderArgs) => <BannerPicturePreview value={args.value} />, []);
    const renderSubDetailToggle = useCallback(
        (args: EditGridCellRenderArgs) => <SubDetailToggleButton row={args.row} expandedRowKey={subDetailState.expandedRowKey} isSubDetailEditing={subDetailState.isSubDetailEditing} onToggle={subDetailState.toggleSubDetail} />,
        [subDetailState.expandedRowKey, subDetailState.isSubDetailEditing, subDetailState.toggleSubDetail],
    );
    const renderSubDetail = useCallback(
        (args: { row: GridRow; rowIndex: number; }) => (
            <DetailInfoSubDetailGridComp theme={props.theme} lang={props.lang} binding={props.binding} refs={props.refs} parentRowId={getEditGridRowId(args.row, args.rowIndex)} onEditingStateChange={subDetailState.onSubDetailEditingStateChange} />
        ),
        [props.binding, props.lang, props.refs, props.theme, subDetailState.onSubDetailEditingStateChange],
    );
    const detailGrid = useBannerDetailEditGrid({
        binding: props.binding,
        style: editGridStyle,
        renderPicturePreview,
        renderSubDetailToggle,
        renderSubDetail,
        expandedRowKey: subDetailState.expandedRowKey,
        isSubDetailEditing: subDetailState.isSubDetailEditing,
    });
    return (
        <div className="form-group">
            <EditGrid {...detailGrid.editGridProps} />
        </div>
    );
};

/** 語系子明細 Grid：固定由系統語系產生，不開放新增或刪除。 */
const DetailInfoSubDetailGridComp = (props: DetailInfoSubDetailProps) =>
{
    const infoGrid = useBannerDetailInfoEditGrid({
        binding: props.binding,
        parentRowId: props.parentRowId,
        lang: props.lang,
        windowTargetOpts: props.refs.windowTargetOpts,
        style: editGridStyle,
    });
    return (
        <div className="p-3" style={{ backgroundColor: "#fafafa", border: "1px solid #dee2e6" }}>
            <div className="mb-2 font-weight-bold">語系明細</div>
            <EditGrid {...infoGrid.editGridProps} onEditingStateChange={props.onEditingStateChange} />
        </div>
    );
};
// #endregion

// #region EntityComp
/** 建立返回列表路徑，維持舊 Form 的 /Form -> /List 規則。 */
// #endregion

// #region Private
/** 圖片預覽元件，沒有圖片時以文字提示避免破圖。 */
const BannerPicturePreview = (props: { value: EditGridCellValue; }) =>
{
    const picture = toBannerPictureCellValue(props.value);
    const previewUrl = picture.url ?? "";
    const altText = picture.originalFileName || picture.fileName || "輪播圖片預覽";
    if (!previewUrl) return <span className="small">尚未選擇圖片</span>;
    return <img src={previewUrl} alt={altText} style={{ display: "block", maxWidth: "12rem", maxHeight: "6rem", objectFit: "contain" }} />;
};

/** 語系明細展開按鈕，避免把子 Grid 直接塞在同一欄位。 */
const SubDetailToggleButton = (props: { row: GridRow; expandedRowKey: string | null; isSubDetailEditing: boolean; onToggle: (row: GridRow) => void; }) =>
{
    const rowKey = getBannerGridRowKey(props.row);
    const isExpanded = props.expandedRowKey === rowKey;
    const title = isExpanded ? "收合語系明細" : "展開語系明細";
    return (
        <button type="button" className="btn btn-outline-primary btn-sm" title={title} disabled={props.isSubDetailEditing} onClick={() => props.onToggle(props.row)}>
            <i className={isExpanded ? "fa fa-eye-slash" : "fa fa-eye"} aria-hidden="true" />
            <span className="ml-1">{isExpanded ? "收合" : "查看"}</span>
        </button>
    );
};
/** 取得 Grid Row key，讓主 Grid 與子明細展開狀態一致。 */
const getBannerGridRowKey = (row: GridRow): string =>
{
    return String(row.keyId || row.RowId || row.rowId || row.rowid || "");
};
// #endregion
