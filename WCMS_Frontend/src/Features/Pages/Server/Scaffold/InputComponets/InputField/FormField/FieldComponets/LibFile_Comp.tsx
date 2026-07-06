// 原 input 改以使用 "AAInputFieldItem" 20260701
import { useId, useState } from "react";
import type { ILibFileProp } from "./LibFile_Data";
import {
    AAInputFieldItem,
    buildAdapterBaseId,
    buildFieldId,
    type AAFileValue,
    type AAInputValue,
} from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms";

// #region Property
interface LibFileithParentClassProp extends ILibFileProp
{
    parentClass?: string;
}
// #endregion

// #region Public
/** 檔案上傳欄位，保留原本預覽區，並可控制是否顯示預覽與檔名。 */
export const LibFile = ({ children, ...prop }: LibFileithParentClassProp) =>
{
    const reactId = useId();
    const baseId = buildAdapterBaseId(reactId);
    const fieldKey = prop.ColumnDisplayName;
    const inputId = buildFieldId(baseId, fieldKey);
    const hasChildren = !!children;
    const [fileResetKey, setFileResetKey] = useState(0);
    const showPreview = hasChildren && (prop.ShowPreview ?? true);
    const showFileNameAndImg = prop.ShowFileNameAndImg ?? false;

    /** 清除目前檔案欄位與外部 File[] 資料。 */
    const clearFileInput = () =>
    {
        setFileResetKey(value => value + 1);
        prop.onChange?.([]);
    };

    /** 將 AA file value 轉回原本 LibFile 使用的 File[]。 */
    const handleChange = (_fieldKey: string, value: AAInputValue) =>
    {
        const filesArray = getFilesFromAAValue(value);

        if (filesArray.length === 0)
        {
            clearFileInput();
            return;
        }

        prop.onChange?.(filesArray);
    };

    return (
        <>
            <div className="">
                <div className="row">
                    <div className={showPreview ? "col-12" : "d-none"}>
                        <div className="row">
                            <label htmlFor={inputId} className={prop.Style.Labelstyle}>圖片預覽</label>
                            <div className="px-3 mt-2 col-xxl-4 col-xl-5 col-lg-9 col-md-10 col-sm-12 col-12">{children}</div>
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="row">
                            <label htmlFor={inputId} className={prop.Style.Labelstyle}>{prop.ColumnDisplayName}</label>
                            <div className={prop.Style.SelectStyle}>
                                <AAInputFieldItem
                                    key={`lib-file-${fileResetKey}`}
                                    baseId={baseId}
                                    variant="gridCell"
                                    field={{
                                        key: fieldKey,
                                        type: "file",
                                        label: prop.ColumnDisplayName,
                                        aaLabel: `請選擇${prop.ColumnDisplayName}`,
                                        value: [],
                                        accept: prop.accept,
                                        multiple: prop.Multiple,
                                        maxFileCount: prop.maxFileCount ?? 1,
                                        maxFileSizeMB: prop.maxFileSizeMB ?? 10,
                                        showFileNameAndImg,
                                        helpText: `${prop.ColumnDisplayName}欄位`,
                                    }}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion

// #region Private
/** 判斷 AA value 是否為檔案值。 */
const isAAFileValue = (value: unknown): value is AAFileValue =>
{
    if (!value || typeof value !== "object") return false;

    const fileValue = value as AAFileValue;
    return typeof fileValue.name === "string";
};

/** 將 AAInputValue 轉成原本上傳流程使用的 File[]。 */
const getFilesFromAAValue = (value: AAInputValue): File[] =>
{
    if (!Array.isArray(value)) return [];

    return value
        .filter(isAAFileValue)
        .map((item) => item.file)
        .filter((file): file is File => !!file);
};
// #endregion