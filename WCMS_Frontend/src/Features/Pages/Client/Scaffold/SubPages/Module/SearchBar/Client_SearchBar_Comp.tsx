import type { ClientDataQuerySearchBarModel } from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { type CSSProperties, useMemo } from "react";
import { type ClientSearchFieldViewModel, useClientSearchBar } from "./Client_SearchBar_Hook";

/** 前台共用搜尋列 */
export const Client_SearchBar_Comp = (
    { title = "搜尋條件", fields, values, actionAlign = "left", searchButtonText = "搜尋", resetButtonText = "重置", columnCount = 3, onSearch, onReset }:
        ClientDataQuerySearchBarModel,
) =>
{
    const { values: draftValues, fieldRows, getFieldId, handleFieldChange, handleSearch, handleReset } = useClientSearchBar({
        fields,
        values,
        columnCount,
        onSearch,
        onReset,
    });

    const formStyle = useMemo(() =>
    {
        return { "--client-searchbar-column-count": columnCount } as CSSProperties;
    }, [columnCount]);

    /** 取得目前草稿值 */
    const getDraftValue = (fieldKey: string): string =>
    {
        const source = draftValues as Record<string, unknown>;
        const value = source[fieldKey];

        return value == null ? "" : `${value}`;
    };

    /** 渲染文字類型欄位 */
    const renderInputField = (field: ClientSearchFieldViewModel) =>
    {
        return (
            <input
                id={getFieldId(field.key)}
                name={field.key}
                type={field.type === "select" ? "text" : field.type}
                value={getDraftValue(field.key)}
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
    const renderSelectField = (field: ClientSearchFieldViewModel) =>
    {
        return (
            <select
                id={getFieldId(field.key)}
                name={field.key}
                value={getDraftValue(field.key)}
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
    const renderControl = (field: ClientSearchFieldViewModel) =>
    {
        if (field.type === "select") return renderSelectField(field);
        return renderInputField(field);
    };

    /** 渲染單一搜尋欄位 */
    const renderField = (field: ClientSearchFieldViewModel) =>
    {
        return (
            <div key={field.key} className="client-searchbar__field">
                <label htmlFor={getFieldId(field.key)} className="client-searchbar__label">{field.label}</label>

                {renderControl(field)}
            </div>
        );
    };

    /** 渲染一列搜尋欄位 */
    const renderRow = (row: ClientSearchFieldViewModel[], rowIndex: number) =>
    {
        return <div key={`client-search-row-${rowIndex}`} className="client-searchbar__row">{row.map(renderField)}</div>;
    };

    return (
        <section className="client-searchbar" aria-labelledby="client-searchbar-title">
            <form className="client-searchbar__form" role="search" style={formStyle} onSubmit={handleSearch}>
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
