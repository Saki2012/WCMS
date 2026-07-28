import {
    Server_ListGridTemplate_Comp,
    type ServerListGridSearchRenderProps,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Comp";
import { Server_SearchBar_Comp } from "@/Features/Pages/Server/Scaffold/SearchBar/Server_SearchBar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactNode } from "react";
import {
    type MatCategoryFormModel,
    type MatCategoryListRenderers,
    useMatCategoryListGridTemplate,
} from "./Server_MatCategory_List_Hook";

// #region Property
type MatCategoryInfoField = NonNullable<MatCategoryFormModel["MatCategoryInfoField"]>[number];
type MatCategoryInfoFieldDisplay = NonNullable<MatCategoryInfoField["_MatCategoryInfoFieldDisplay"]>[number];
interface MatCategoryInfoFieldDisplayItem
{
    key: string;
    title: string;
}
// #endregion

// #region Public
/** 物件類別列表。 */
export const Server_MatCategory_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const template = useMatCategoryListGridTemplate({ lang: prop.lang, renderers: matCategoryListRenderers });
    return <Server_ListGridTemplate_Comp Title={prop.title} Theme={prop.theme} template={template} buildSearchBarNode={MatCategorySearchBarSection} />;
};
// #endregion

// #region Section
/** 渲染物件類別列表搜尋列。 */
const MatCategorySearchBarSection = (props: ServerListGridSearchRenderProps) =>
{
    return <Server_SearchBar_Comp fields={props.fields} submittedValues={props.submittedValues} onSubmit={props.onSubmit} onReset={props.onReset} ariaLabel="物件類別列表搜尋" />;
};
// #endregion

// #region Protected
/** 依欄位排序渲染指定語系的自定義欄位資訊。 */
const buildMatCategoryInfoFieldContentNode = (formModel: MatCategoryFormModel, lang: Lang): ReactNode =>
{
    const items = buildMatCategoryInfoFieldDisplayItems(formModel, lang);
    if (items.length === 0) return "";
    return <ul className="m-0 p-0" style={{ listStylePosition: "inside" }}>{items.map(item => <li key={item.key} className="m-0 p-0">{item.title}</li>)}</ul>;
};
// #endregion

// #region Private
/** 建立列表自定義欄位節點產生器。 */
const matCategoryListRenderers: MatCategoryListRenderers = { buildInfoFieldContentNode: buildMatCategoryInfoFieldContentNode };

/** 依父欄位 RowNo 建立指定語系的顯示項目。 */
const buildMatCategoryInfoFieldDisplayItems = (model: MatCategoryFormModel, lang: Lang): MatCategoryInfoFieldDisplayItem[] =>
{
    const fields = sortMatCategoryInfoFields(model.MatCategoryInfoField ?? []);
    return fields.map(field => buildDisplayItem(field, lang)).filter((item): item is MatCategoryInfoFieldDisplayItem => item !== null);
};

/** 建立單一父欄位的語系顯示項目。 */
const buildDisplayItem = (field: MatCategoryInfoField, lang: Lang): MatCategoryInfoFieldDisplayItem | null =>
{
    const display = (field._MatCategoryInfoFieldDisplay ?? []).find(item => String(item.Lang).toLowerCase() === String(lang).toLowerCase());
    const title = display?.FieldDisplayName?.trim() ?? "";
    if (!title) return null;
    return { key: `${field.CategoryId ?? "category"}-${field.RowId ?? 0}-${lang}`, title };
};

/** 依 RowNo、RowId 穩定排序父欄位。 */
const sortMatCategoryInfoFields = (fields: MatCategoryInfoField[]): MatCategoryInfoField[] =>
{
    return [...fields].sort((left, right) => getFieldOrder(left) - getFieldOrder(right) || Number(left.RowId ?? 0) - Number(right.RowId ?? 0));
};

/** 取得排序值，未設定 RowNo 的舊資料排到最後。 */
const getFieldOrder = (field: MatCategoryInfoField): number =>
{
    const rowNo = Number(field.RowNo ?? 0);
    return rowNo > 0 ? rowNo : Number.MAX_SAFE_INTEGER;
};
// #endregion
