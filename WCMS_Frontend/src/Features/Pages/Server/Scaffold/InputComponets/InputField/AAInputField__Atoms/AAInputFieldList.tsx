import { useId, useMemo } from "react";
import type { AAInputFieldListProps } from "./AAInputField_Types";
import { AAInputFieldItem } from "./AAInputFieldItem";
import { buildAdapterBaseId } from "./AAInputField_Utils";

// #region Public
/**
 * 使用範例：
 * <AAInputFieldList title="欄位設定" fields={fields} onChange={handleChange} />
 */

/** 後台欄位清單容器，使用穩定 useId 避免 SSR/CSR hydration id 不一致。 */
export const AAInputFieldList = (props: AAInputFieldListProps) =>
{
    const reactBaseId = useId();
    const adapterBaseId = props.idPrefix ?? reactBaseId;
    const baseId = useMemo(() => buildAdapterBaseId(adapterBaseId), [adapterBaseId]);
    const titleId = `${baseId}-title`;
    const descriptionId = `${baseId}-description`;
    const describedBy = props.description ? descriptionId : undefined;

    return (
        <section className={props.className ?? "card shadow-sm border-0 mb-3"} aria-labelledby={titleId} aria-describedby={describedBy}>
            <div className="card-header bg-white">
                <h2 id={titleId} className="h5 mb-0">{props.title ?? "欄位設定"}</h2>
                {props.description && <p id={descriptionId} className="text-muted mb-0 mt-1">{props.description}</p>}
            </div>
            <div className="card-body">
                <div className="row g-3">
                    {props.fields.map((field) => <AAInputFieldItem key={field.key} baseId={baseId} field={field} variant="form" onChange={props.onChange} className="h-100 rounded bg-white" />)}
                </div>
            </div>
        </section>
    );
};
// #endregion
