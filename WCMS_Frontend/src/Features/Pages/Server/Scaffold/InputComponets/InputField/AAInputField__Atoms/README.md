# AAInputField / EditGrid 使用說明

這組檔案是 WCMS 後台用的 AA 輸入欄位元件與 EditGrid 表格編輯整合版本。

目前範例與 Demo 已集中到：

```txt
Features/Pages/Server/BizFunc/WEB/Gallery/TestForEditGrid.tsx
```

因此正式功能資料夾內不需要再保留分散的範例檔。

## 主要入口

一般表單整組欄位使用：

```tsx
import { AAInputFieldList } from "./AAInputFieldList";
```

單一欄位，或 EditGrid 的 `<td>` 內使用：

```tsx
import { AAInputFieldItem } from "./AAInputFieldItem";
```

## EditGrid 使用方式

EditGrid 的 `<td>` 內請使用 `AAInputFieldItem`，不要使用 `AAInputFieldList`。

```tsx
<AAInputFieldItem
    baseId={`edit-grid-${rowId}-${columnKey}`}
    variant="gridCell"
    field={{
        key: columnKey,
        type: "text",
        label: columnTitle,
        aaLabel: `第 ${rowIndex + 1} 列，${columnTitle}，請輸入文字內容`,
        value,
    }}
    onChange={(_, nextValue) => onCellChange(rowId, columnKey, nextValue)}
/>
```

`variant="gridCell"` 會讓提示文字維持給 `aria-describedby` 使用，但視覺上改成 `visually-hidden`，避免表格被 hint 撐開。

## TestForEditGrid.tsx 內含範例

`TestForEditGrid.tsx` 目前集中保留三種測試用途：

1. `TestForEditGrid`
   - 完整 EditGrid 測試頁。
   - 會測試 text / email / tel / password / number / date / date-time / dateRange / dateTimeRange / textarea / selectSingle / selectMultiple / file / radio / checkboxSingle / checkboxMultiple / readonly。

2. `AAInputFieldUsageExample`
   - 一般表單使用 `AAInputFieldList` 的完整欄位範例。

3. `AAInputFieldEditGridExample`
   - 最小表格範例。
   - 示範如何在 `<td>` 內使用 `AAInputFieldItem` 與 `variant="gridCell"`。

## 最小表單使用範例

```tsx
const [state, setState] = useState<AAInputState>(getDefaultAAInputState());
const fields = useMemo(() => createAAInputDemoFields(state), [state]);

const handleChange = (fieldKey: string, value: AAInputValue) =>
{
    setState((prev) => ({ ...prev, [fieldKey]: value }));
};

return (
    <AAInputFieldList
        title="AA 欄位元件測試"
        fields={fields}
        onChange={handleChange}
    />
);
```

## 最小 EditGrid cell 使用範例

```tsx
<AAInputFieldItem
    baseId={`edit-grid-${row.id}-${column.key}`}
    variant="gridCell"
    field={{
        key: String(column.key),
        type: column.type,
        label: column.title,
        aaLabel: `第 ${rowIndex + 1} 列，${column.title}，請輸入或選擇內容`,
        value: row[column.key],
        options: column.options,
        helpText: `${column.title}欄位`,
    }}
    onChange={(_, value) => onCellChange(row.id, column.key, value)}
/>
```

## 建議保留的正式檔案

```txt
AAInputField_Adapter.ts
AAInputField_Focus.ts
AAInputField_Shell.tsx
AAInputField_Types.ts
AAInputField_Utils.ts
AAInputFieldItem.tsx
AAInputFieldList.tsx
index.ts

Fields/BaseTextInputField.tsx
Fields/PasswordField.tsx
Fields/NumberField.tsx
Fields/TextareaField.tsx
Fields/SelectSingleField.tsx
Fields/SelectMultipleField.tsx
Fields/SelectHelpers.tsx
Fields/DateRangeField.tsx
Fields/DateTimeRangeField.tsx
Fields/FileField.tsx
Fields/CheckboxSingleField.tsx
Fields/OptionGroupField.tsx
```

## 可以移除的舊範例檔案

因為範例已集中到 `TestForEditGrid.tsx`，以下檔案可以移除：

```txt
AAInputField_DemoData.ts
AAInputField_UsageExample.tsx
AAInputField_EditGridExample.tsx
```

若移除上述檔案，`index.ts` 也要同步移除：

```ts
export * from "./AAInputField_DemoData";
```

本次提供的 `index.ts` 已移除這個匯出，並補上 `OptionGroupField` 匯出。

## AA / SSR 重點

- 表單 AA 判讀以 `label` / `legend` / `aria-label` / `aria-describedby` 為主。
- `radio` / `checkboxMultiple` 的選項只在外層項目保留 `title={item.label}`。
- `dateRange` / `dateTimeRange` 使用 Tab 離開整個選擇器後會自動關閉。
- Adapter 會在 SSR / CSR 共用正規化，降低 hydration mismatch。
- EditGrid 內的欄位提示文字應使用 `variant="gridCell"` 隱藏視覺提示，避免撐開表格。
