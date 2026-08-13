import type {
    BannerDetailInfo,
    BannerDetailInfoEditGridExtension,
} from "@/Features/Pages/Server/BizFunc/WEB/Banner/Server_BannerSlider_Form_Hook";
import type { ColumnConfig, GridRow, RowCell } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import { buildEditGridCell, getEditGridNullableStringCellValue } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import { getModelColumnDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { BannerDetailFields, BannerDetailInfoFields } from "@/types/SchemaFields";

// #region Public
/**
 * Spec1817 Banner 語系明細擴充。
 * 僅在 Spec1817 注入三個展演客製欄位，不污染 Feature 共用 Banner。
 */
export const spec1817BannerDetailInfoExtension: BannerDetailInfoEditGridExtension = {
    buildColumns: displayName => buildSpecBannerDetailInfoColumns(displayName),
    buildCells: (info, displayName) => buildSpecBannerDetailInfoCells(info, displayName),
    extendItem: (item, row) => extendSpecBannerDetailInfoItem(item, row),
};
// #endregion

// #region Private
/** 建立 Spec1817 Banner 語系明細客製欄位。 */
const buildSpecBannerDetailInfoColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    return [
        {
            key: BannerDetailInfoFields.SpecLatestShows,
            title: getSpecBannerColumnTitle(displayName, BannerDetailInfoFields.SpecLatestShows, "最新展演"),
            width: 180,
            inputType: "text",
            editable: true,
            maxLength: 200,
        },
        {
            key: BannerDetailInfoFields.SpecShowLocation,
            title: getSpecBannerColumnTitle(displayName, BannerDetailInfoFields.SpecShowLocation, "展演地點"),
            width: 180,
            inputType: "text",
            editable: true,
            maxLength: 200,
        },
        {
            key: BannerDetailInfoFields.SpecShowDate,
            title: getSpecBannerColumnTitle(displayName, BannerDetailInfoFields.SpecShowDate, "展演時間"),
            width: 180,
            inputType: "text",
            editable: true,
            maxLength: 100,
        },
    ];
};

/** 建立 Spec1817 Banner 語系明細客製 Cell。 */
const buildSpecBannerDetailInfoCells = (info: BannerDetailInfo, displayName: ModelDisplaySchema): RowCell[] =>
{
    return [
        buildEditGridCell(
            BannerDetailInfoFields.SpecLatestShows,
            getSpecBannerColumnTitle(displayName, BannerDetailInfoFields.SpecLatestShows, "最新展演"),
            info.SpecLatestShows ?? "",
            { inputType: "text", editable: true, maxLength: 200 },
        ),
        buildEditGridCell(
            BannerDetailInfoFields.SpecShowLocation,
            getSpecBannerColumnTitle(displayName, BannerDetailInfoFields.SpecShowLocation, "展演地點"),
            info.SpecShowLocation ?? "",
            { inputType: "text", editable: true, maxLength: 200 },
        ),
        buildEditGridCell(
            BannerDetailInfoFields.SpecShowDate,
            getSpecBannerColumnTitle(displayName, BannerDetailInfoFields.SpecShowDate, "展演時間"),
            info.SpecShowDate ?? "",
            { inputType: "text", editable: true, maxLength: 100 },
        ),
    ];
};

/** 將 Spec1817 客製 Cell 寫回 BannerDetailInfo DTO。 */
const extendSpecBannerDetailInfoItem = (item: BannerDetailInfo, row: GridRow): BannerDetailInfo =>
{
    return {
        ...item,
        SpecLatestShows: getEditGridNullableStringCellValue(row, BannerDetailInfoFields.SpecLatestShows),
        SpecShowLocation: getEditGridNullableStringCellValue(row, BannerDetailInfoFields.SpecShowLocation),
        SpecShowDate: getEditGridNullableStringCellValue(row, BannerDetailInfoFields.SpecShowDate),
    };
};

/** 取得 Spec1817 Banner 客製欄位顯示名稱。 */
const getSpecBannerColumnTitle = (displayName: ModelDisplaySchema, columnId: string, fallback: string): string =>
{
    return getModelColumnDisplayName(displayName, BannerDetailFields._BannerDetailInfo, columnId, fallback);
};
// #endregion
