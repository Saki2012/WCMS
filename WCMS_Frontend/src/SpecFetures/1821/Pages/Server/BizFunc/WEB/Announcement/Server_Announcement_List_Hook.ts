import type { AnnouncementListRawData, AnnouncementListSpecTiming, AnnouncementSearchParams } from "@/Features/Pages/Server/BizFunc/WEB/Announcement/Server_Announcement_List_Hook";
import { getServerColumnTitle as getColumnTitle, getServerSearchStringValue as getSearchStringValue } from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type { ColumnConfig, GridProps, GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import { LibCondition, Operator } from "@/SysCore/Utils/Library/LibData";
import { AnnouncementFields } from "@/types/SchemaFields";

// #region Property
type BuildQueryParam = NonNullable<AnnouncementListSpecTiming["buildQueryParam"]>;
type BuildGridProps = NonNullable<AnnouncementListSpecTiming["buildGridProps"]>;
type SearchFieldContext = Parameters<NonNullable<AnnouncementListSpecTiming["buildSearchFields"]>>[0];
interface AnnouncementSchoolYearSearchParams extends AnnouncementSearchParams
{
    /** 1821 公告學年度搜尋條件。 */
    specSchoolYear?: string;
}
const SPEC_SCHOOL_YEAR_SEARCH_KEY = AnnouncementFields.SpecSchoolYear;
// #endregion

// #region Public
/** 取得 1821 公告列表 Spec 擴充流程。 */
export const getAnnouncementListSpecTiming = (): AnnouncementListSpecTiming =>
{
    return {
        buildSearchFields: buildSchoolYearSearchFields,
        toSearchParams: toSchoolYearSearchParams,
        buildSearchConditions: buildSchoolYearSearchConditions,
        buildQueryParam: appendSchoolYearQueryFields,
        buildGridProps: buildSchoolYearGridProps,
    };
};
// #endregion

// #region Private
/** 建立學年度搜尋欄位。 */
const buildSchoolYearSearchFields = (ctx: SearchFieldContext): SearchFieldConfig[] =>
{
    const title = getSchoolYearTitle(ctx.rawData);
    return [{ key: SPEC_SCHOOL_YEAR_SEARCH_KEY, title, type: "number", placeholder: `請輸入${title}` }];
};

/** 將學年度搜尋值加入公告查詢參數。 */
const toSchoolYearSearchParams = (values: SearchValues, currentParams: AnnouncementSearchParams): AnnouncementSearchParams =>
{
    const specSchoolYear = getSearchStringValue(values[SPEC_SCHOOL_YEAR_SEARCH_KEY]);
    return { ...currentParams, specSchoolYear } as AnnouncementSearchParams;
};

/** 建立學年度搜尋條件。 */
const buildSchoolYearSearchConditions = (ctx: { searchParams: AnnouncementSearchParams; }): string[] =>
{
    const searchParams = ctx.searchParams as AnnouncementSchoolYearSearchParams;
    if (!searchParams.specSchoolYear) return [];
    return [LibCondition.joinConditions([LibCondition.createCondition(AnnouncementFields.SpecSchoolYear, Operator.Equal, searchParams.specSchoolYear)])];
};

/** 將學年度加入公告列表查詢欄位。 */
const appendSchoolYearQueryFields: BuildQueryParam = (_ctx, featureQueryParam) =>
{
    if (!featureQueryParam) throw new Error("Announcement list feature queryParam is required.");
    const fields = featureQueryParam.Fields ?? [];
    return { ...featureQueryParam, Fields: appendFieldOnce(fields, AnnouncementFields.SpecSchoolYear) };
};

/** 將學年度欄位加入 Grid 第一欄。 */
const buildSchoolYearGridProps: BuildGridProps = (ctx, featureGridProps) =>
{
    if (!featureGridProps) throw new Error("Announcement list feature gridProps is required.");
    const column = createSchoolYearColumn(ctx.rawData);
    return { ...featureGridProps, columns: [column, ...featureGridProps.columns], rows: prependSchoolYearRows(featureGridProps, column, ctx.rawData) };
};

/** 建立學年度欄位設定。 */
const createSchoolYearColumn = (rawData: AnnouncementListRawData): ColumnConfig =>
{
    return { key: AnnouncementFields.SpecSchoolYear, title: getSchoolYearTitle(rawData), width: 100 };
};

/** 取得學年度欄位標題。 */
const getSchoolYearTitle = (rawData: AnnouncementListRawData): string =>
{
    return getColumnTitle(rawData.modelDisplayName, AnnouncementFields.SpecSchoolYear, "學年度");
};

/** 將學年度儲存格加入每一列最前方。 */
const prependSchoolYearRows = (grid: GridProps, column: ColumnConfig, rawData: AnnouncementListRawData): GridRow[] =>
{
    return grid.rows.map((row, index) => ({
        ...row,
        cells: [{ col: column, content: rawData.list[index]?.Announcement?.SpecSchoolYear ?? "" }, ...row.cells],
    }));
};

/** 追加查詢欄位，避免重複加入。 */
const appendFieldOnce = (fields: string[], fieldName: string): string[] =>
{
    if (fields.includes(fieldName)) return fields;
    return [fieldName, ...fields];
};
// #endregion
