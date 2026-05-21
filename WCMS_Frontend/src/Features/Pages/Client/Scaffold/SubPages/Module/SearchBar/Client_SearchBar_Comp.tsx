import { type ClientSearchActionAlign, type ClientSearchField, type ClientSearchValues, useClientSearchBar } from "./Client_SearchBar_Hook";
import "./Client_SearchBar.css";

interface ClientSearchBarCompProps
{
    title?: string;
    fields: ClientSearchField[];
    defaultValues?: ClientSearchValues;
    actionAlign?: ClientSearchActionAlign;
    searchButtonText?: string;
    resetButtonText?: string;
    resetPageKey?: string;
    onSearch?: (values: ClientSearchValues) => void;
    onReset?: () => void;
}

/** 前台共用搜尋列 */
export const Client_SearchBar_Comp = (
    {
        title = "搜尋條件",
        fields,
        defaultValues,
        actionAlign = "right",
        searchButtonText = "搜尋",
        resetButtonText = "重置",
        resetPageKey = "page",
        onSearch,
        onReset,
    }: ClientSearchBarCompProps,
) =>
{
    const { values, fieldRows, getFieldId, handleFieldChange, handleSearch, handleReset } = useClientSearchBar({
        fields,
        defaultValues,
        resetPageKey,
        onSearch,
        onReset,
    });

    /** 渲染文字類型欄位 */
    const renderInputField = (field: ClientSearchField) =>
    {
        return (
            <input
                id={getFieldId(field.key)}
                name={field.key}
                type={field.type}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                disabled={field.disabled}
                maxLength={field.maxLength}
                inputMode={field.inputMode}
                className="client-searchbar__input"
                onChange={(event) => handleFieldChange(field.key, event)}
            />
        );
    };

    /** 渲染下拉選單欄位 */
    const renderSelectField = (field: ClientSearchField) =>
    {
        return (
            <select
                id={getFieldId(field.key)}
                name={field.key}
                value={values[field.key] ?? ""}
                disabled={field.disabled}
                className="client-searchbar__select"
                onChange={(event) => handleFieldChange(field.key, event)}
            >
                <option value="">全部</option>

                {field.options?.map((option) => (
                    <option key={`${field.key}-${option.value}`} value={option.value} disabled={option.disabled}>{option.label}</option>
                ))}
            </select>
        );
    };

    /** 依照欄位類型渲染控制項 */
    const renderControl = (field: ClientSearchField) =>
    {
        if (field.type === "select")
        {
            return renderSelectField(field);
        }

        return renderInputField(field);
    };

    /** 渲染單一搜尋欄位 */
    const renderField = (field: ClientSearchField) =>
    {
        return (
            <div key={field.key} className="client-searchbar__field">
                <label htmlFor={getFieldId(field.key)} className="client-searchbar__label">{field.label}</label>

                {renderControl(field)}
            </div>
        );
    };

    /** 渲染一列搜尋欄位，固定最多兩欄 */
    const renderRow = (row: ClientSearchField[], rowIndex: number) =>
    {
        return <div key={`client-search-row-${rowIndex}`} className="client-searchbar__row">{row.map(renderField)}</div>;
    };

    return (
        <section className="client-searchbar" aria-labelledby="client-searchbar-title">
            <form className="client-searchbar__form" role="search" onSubmit={handleSearch}>
                <div className="client-searchbar__header">
                    <h2 id="client-searchbar-title" className="client-searchbar__title">{title}</h2>
                </div>

                <div className="client-searchbar__body">{fieldRows.map(renderRow)}</div>

                <div className={`client-searchbar__actions client-searchbar__actions--${actionAlign}`}>
                    <button type="button" className="client-searchbar__button client-searchbar__button--reset" onClick={handleReset}>{resetButtonText}</button>

                    <button type="submit" className="client-searchbar__button client-searchbar__button--search">{searchButtonText}</button>
                </div>
            </form>
        </section>
    );
};
