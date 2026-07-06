import { useMemo, useState, useCallback } from "react";
import { AAInputFieldList } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms/AAInputFieldList";
import { AAInputFieldItem } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms/AAInputFieldItem";
import { defaultAccept } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms/AAInputField_Utils";
import type { AAInputField, AAInputOption, AAInputState, AAInputValue } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/AAInputField__Atoms/AAInputField_Types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Server_FormTemplate_Comp } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Comp";
import { EditGrid } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid";
import type { ColumnConfig, EditGridCellValue, EditGridFileValue, EditGridOptionValue, GridProps, GridRow, RowCell } from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { galleryEmptyData, useGalleryFormTemplate } from "@/Features/Pages/Server/BizFunc/WEB/Gallery/Server_Gallery_Form_Hook";
import type { Lang } from "@/SysCore/i18n/lang";

//#region Public
export const TestForEditGrid = (prop: { theme: IBETheme; lang: Lang; }) =>
{
    // 宣告變數：建立測試表格資料與篩選後顯示資料
    const [rows, setRows] = useState<GridRow[]>(() => buildDemoRows());
    const [query] = useState<SearchState>(getDefaultSearchState());
    const displayRows = useMemo(() => filterRows(rows, query), [rows, query]);
    const gridData = useMemo<GridProps>(() => buildGridData(displayRows), [displayRows]);

    // 宣告變數：建立 Gallery FormTemplate 需要的路由與回列表動作
    const { internalId } = useParams();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;

    /** 回到列表頁，避免測試頁仍引用舊版 Form Fetch hook。 */
    const onBackToList = useCallback(() =>
    {
        navigate(buildBackToListPath(pathname));
    }, [navigate, pathname]);

    const actionsOpt = useMemo(() =>
    {
        return { onBackToList };
    }, [onBackToList]);

    const template = useGalleryFormTemplate({
        lang: prop.lang,
        theme: prop.theme,
        internalId: internalId ?? "",
        emptyData: galleryEmptyData,
        actionsOpt,
    });

    /** 接收 EditGrid 回傳的完整 GridData。 */
    const handleGridDataChange = useCallback((nextGridData: GridProps) =>
    {
        setRows((prev) => mergeDisplayRows(prev, displayRows, nextGridData.rows));
    }, [displayRows]);

    /** 新增測試列。 */
    const createRow = useCallback((nextRowNo: number): GridRow =>
    {
        const rowNo = getNextRowNo(rows, nextRowNo);
        return buildDemoRow(`new-${Date.now()}`, rowNo, createEmptyDemoRowValue(rowNo));
    }, [rows]);

    return (
        <Server_FormTemplate_Comp
            template={template}
            renderContent={() => (
                <TestForEditGridContent
                    gridData={gridData}
                    createRow={createRow}
                    onGridDataChange={handleGridDataChange}
                />
            )}
        />
    );
};

/** EditGrid 測試內容，避免主 Component 混入過多 JSX。 */
const TestForEditGridContent = (props: TestForEditGridContentProps) =>
{
    return (
        <div className="row">
            <div className="col-12">
                <DemoReadonlyInput inputId="test-edit-grid-title-1" label="橫幅類別名稱" />
                <DemoReadonlyInput inputId="test-edit-grid-title-2" label="橫幅類別名稱" />
                <DemoReadonlyInput inputId="test-edit-grid-title-3" label="橫幅類別名稱" />
            </div>

            <div className="col-12">
                <EditGrid
                    title="EditGrid AA InputField 全欄位測試"
                    ariaLabel="EditGrid AA InputField 全欄位測試表格"
                    GridData={props.gridData}
                    canAdd
                    canEdit
                    canDelete
                    canDrag
                    showRowNo
                    showOperationGuide
                    createRow={props.createRow}
                    onGridDataChange={props.onGridDataChange}
                    deleteConfirmMessage="確定要刪除此列資料嗎？"
                    minTableWidth={3000}
                    maxVisibleRows={5}
                />
            </div>
        </div>
    );
};

/** 測試用唯讀輸入欄位，補上 htmlFor / id 避免 AA label 斷線。 */
const DemoReadonlyInput = (props: DemoReadonlyInputProps) =>
{
    return (
        <div className="form-group">
            <div className="row">
                <label htmlFor={props.inputId} className="col-12 float-md-left float-sm-none col-form-label mb-1">
                    {props.label}
                </label>
                <div className="col-12 float-md-left float-sm-none mb-1">
                    <input
                        id={props.inputId}
                        type="text"
                        className="form-control"
                        placeholder={`請輸入${props.label} ...`}
                        defaultValue=""
                    />
                </div>
            </div>
        </div>
    );
};

/** 建立回列表路徑，集中處理 Form / List 切換。 */
const buildBackToListPath = (pathname: string): string =>
{
    return pathname.replace(/\/Form(\/[^\/]*)?$/, "/List");
};
//#endregion

// #region Property
interface TestForEditGridContentProps
{
    /** EditGrid 顯示資料 */
    gridData: GridProps;

    /** 新增列 callback */
    createRow: (nextRowNo: number) => GridRow;

    /** GridData 變更 callback */
    onGridDataChange: (nextGridData: GridProps) => void;
}

interface DemoReadonlyInputProps
{
    /** input id，給 label htmlFor 使用 */
    inputId: string;

    /** 欄位顯示名稱 */
    label: string;
}
// #endregion

// #region Components

/** AAInputFieldList 完整欄位範例，正式功能不引用時可只留作測試頁。 */
export const AAInputFieldUsageExample = () =>
{
    const [state, setState] = useState<AAInputState>(getDefaultAAInputState());
    const fields = useMemo(() => createAAInputDemoFields(state), [state]);

    /** 更新欄位值，避免直接改動原 state 造成資料同步問題。 */
    const handleChange = (fieldKey: string, value: AAInputValue) =>
    {
        setState((prev) => ({ ...prev, [fieldKey]: value }));
    };

    return (
        <AAInputFieldList
            title="AA 欄位元件測試"
            description="此範例使用 visually-hidden label / legend 作為 AA 判讀主體，並以 aria-describedby 串接提示與錯誤訊息。"
            fields={fields}
            onChange={handleChange}
        />
    );
};

/** AAInputFieldItem 放在表格 td 內的最小使用範例。 */
export const AAInputFieldEditGridExample = () =>
{
    const categoryOptions = useMemo<AAInputOption[]>(() => buildAAInputCategoryOptions(), []);
    const [rows, setRows] = useState<DemoSimpleGridRow[]>(getDefaultSimpleGridRows());
    const columns = useMemo<DemoSimpleGridColumn[]>(() => buildSimpleGridColumns(categoryOptions), [categoryOptions]);

    /** 更新指定列與欄位的值。 */
    const handleCellChange = (rowId: string, columnKey: DemoSimpleGridColumn["key"], value: AAInputValue) =>
    {
        setRows((prev) => prev.map((row) => row.id === rowId ? { ...row, [columnKey]: value } as DemoSimpleGridRow : row));
    };

    return (
        <table className="table table-bordered align-middle">
            <caption className="visually-hidden">EditGrid AA 欄位測試表格</caption>
            <thead>
                <tr>{columns.map((column) => <th key={column.key} scope="col">{column.title}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => renderSimpleGridRow(row, rowIndex, columns, handleCellChange))}
            </tbody>
        </table>
    );
};

/** 渲染最小表格範例列。 */
const renderSimpleGridRow = (
    row: DemoSimpleGridRow,
    rowIndex: number,
    columns: DemoSimpleGridColumn[],
    onCellChange: (rowId: string, columnKey: DemoSimpleGridColumn["key"], value: AAInputValue) => void,
) =>
{
    return (
        <tr key={row.id}>
            {columns.map((column) => renderSimpleGridCell(row, rowIndex, column, onCellChange))}
        </tr>
    );
};

/** 渲染最小表格範例欄位。 */
const renderSimpleGridCell = (
    row: DemoSimpleGridRow,
    rowIndex: number,
    column: DemoSimpleGridColumn,
    onCellChange: (rowId: string, columnKey: DemoSimpleGridColumn["key"], value: AAInputValue) => void,
) =>
{
    return (
        <td key={column.key}>
            <AAInputFieldItem
                baseId={`edit-grid-${row.id}-${column.key}`}
                variant="gridCell"
                field={buildSimpleGridCellField(row, rowIndex, column)}
                onChange={(_fieldKey, value) => onCellChange(row.id, column.key, value)}
            />
        </td>
    );
};

// #endregion

// #region AAInputField Demo Data

/** 建立可直接放入後台測試頁的預設欄位資料。 */
export const createAAInputDemoFields = (state: AAInputState): AAInputField[] =>
{
    return [
        buildAAInputTextField(state),
        buildAAInputEmailField(state),
        buildAAInputTelField(state),
        buildAAInputPasswordField(state),
        buildAAInputNumberField(state),
        buildAAInputDateField(state),
        buildAAInputDateTimeField(state),
        buildAAInputDateRangeField(state),
        buildAAInputDateTimeRangeField(state),
        buildAAInputTextareaField(state),
        buildAAInputSelectSingleField(state),
        buildAAInputSelectMultipleField(state),
        buildAAInputFileField(state),
        buildAAInputRadioField(state),
        buildAAInputCheckboxSingleField(state),
        buildAAInputCheckboxMultipleField(state),
        buildAAInputReadonlyField(state),
    ];
};

/** 建立預設測試值，保持 SSR 與 CSR 初始輸出一致。 */
export const getDefaultAAInputState = (): AAInputState => ({
    text: "",
    email: "",
    tel: "",
    password: "",
    number: "",
    date: "",
    "date-time": "",
    dateRange: [],
    dateTimeRange: [],
    textarea: "",
    selectSingle: "",
    selectMultiple: [],
    file: [],
    radio: "1",
    checkboxSingle: false,
    checkboxMultiple: [],
    readonly: "系統產生欄位，僅供檢視。",
});

/** 建立文字欄位範例。 */
const buildAAInputTextField = (state: AAInputState): AAInputField =>
{
    return { key: "text", type: "text", label: "text", value: state.text, required: true, maxLength: 80, placeholder: "請輸入文字", helpText: "請輸入一般文字內容。" };
};

/** 建立 Email 欄位範例。 */
const buildAAInputEmailField = (state: AAInputState): AAInputField =>
{
    return { key: "email", type: "email", label: "email", value: state.email, maxLength: 120, placeholder: "請輸入電子郵件", autoComplete: "off", helpText: "請輸入有效的電子郵件。" };
};

/** 建立電話欄位範例。 */
const buildAAInputTelField = (state: AAInputState): AAInputField =>
{
    return { key: "tel", type: "tel", label: "tel", value: state.tel, maxLength: 30, placeholder: "請輸入聯絡電話", autoComplete: "off", helpText: "請輸入聯絡電話。" };
};

/** 建立密碼欄位範例。 */
const buildAAInputPasswordField = (state: AAInputState): AAInputField =>
{
    return { key: "password", type: "password", label: "請輸入新密碼", aaLabel: "請輸入新密碼", value: state.password ?? "", maxLength: 64, placeholder: "請輸入新密碼", autoComplete: "new-password", helpText: "請輸入新密碼" };
};

/** 建立數字欄位範例。 */
const buildAAInputNumberField = (state: AAInputState): AAInputField =>
{
    return { key: "number", type: "number", label: "number", value: state.number, min: 0, max: 9999, step: 1, placeholder: "請輸入數字", helpText: "請輸入 0 到 9999 的數字。" };
};

/** 建立日期欄位範例。 */
const buildAAInputDateField = (state: AAInputState): AAInputField =>
{
    return { key: "date", type: "date", label: "date", value: state.date, helpText: "請選擇日期。" };
};

/** 建立日期時間欄位範例。 */
const buildAAInputDateTimeField = (state: AAInputState): AAInputField =>
{
    return { key: "date-time", type: "date-time", label: "date-time", value: state["date-time"], helpText: "請選擇日期與時間。" };
};

/** 建立日期區間欄位範例。 */
const buildAAInputDateRangeField = (state: AAInputState): AAInputField =>
{
    return { key: "dateRange", type: "dateRange", label: "dateRange", value: state.dateRange, calendarBaseDate: "2026-05-01", helpText: "請選擇日期區間。" };
};

/** 建立日期時間區間欄位範例。 */
const buildAAInputDateTimeRangeField = (state: AAInputState): AAInputField =>
{
    return { key: "dateTimeRange", type: "dateTimeRange", label: "dateTimeRange", value: state.dateTimeRange, calendarBaseDate: "2026-05-01", helpText: "請選擇日期與時間區間。" };
};

/** 建立多行文字欄位範例。 */
const buildAAInputTextareaField = (state: AAInputState): AAInputField =>
{
    return { key: "textarea", type: "textarea", label: "textarea", value: state.textarea, maxLength: 500, rows: 5, placeholder: "請輸入多行文字", helpText: "請輸入多行文字內容，最多 500 字。" };
};

/** 建立單選下拉欄位範例。 */
const buildAAInputSelectSingleField = (state: AAInputState): AAInputField =>
{
    return { key: "selectSingle", type: "selectSingle", label: "selectSingle", value: state.selectSingle, required: true, options: buildAAInputCategoryOptions(), searchPlaceholder: "查詢選項", helpText: "請選擇一個選項，可輸入關鍵字搜尋。" };
};

/** 建立複選下拉欄位範例。 */
const buildAAInputSelectMultipleField = (state: AAInputState): AAInputField =>
{
    return { key: "selectMultiple", type: "selectMultiple", label: "selectMultiple", value: state.selectMultiple, options: buildAAInputCategoryOptions(), searchPlaceholder: "查詢選項", helpText: "可輸入關鍵字搜尋，並將選取項目加入框內。" };
};

/** 建立檔案欄位範例。 */
const buildAAInputFileField = (state: AAInputState): AAInputField =>
{
    return { key: "file", type: "file", label: "file", value: state.file, accept: defaultAccept, multiple: false, maxFileCount: 1, maxFileSizeMB: 10, helpText: "選擇或拖曳檔案至虛框內，僅限上傳1個10MB以內檔案。" };
};

/** 建立 radio 欄位範例。 */
const buildAAInputRadioField = (state: AAInputState): AAInputField =>
{
    return { key: "radio", type: "radio", label: "radio", value: state.radio, required: true, options: buildAAInputYesNoOptions(), helpText: "請選擇一個狀態。" };
};

/** 建立單一 checkbox 欄位範例。 */
const buildAAInputCheckboxSingleField = (state: AAInputState): AAInputField =>
{
    return { key: "checkboxSingle", type: "checkboxSingle", label: "checkboxSingle", value: state.checkboxSingle, helpText: "勾選後會回傳 true，未勾選會回傳 false。" };
};

/** 建立多選 checkbox 欄位範例。 */
const buildAAInputCheckboxMultipleField = (state: AAInputState): AAInputField =>
{
    return { key: "checkboxMultiple", type: "checkboxMultiple", label: "checkboxMultiple", value: state.checkboxMultiple, options: buildAAInputMultipleOptions(), helpText: "可勾選一個或多個分類。" };
};

/** 建立唯讀欄位範例。 */
const buildAAInputReadonlyField = (state: AAInputState): AAInputField =>
{
    return { key: "readonly", type: "readonly", label: "readonly", value: state.readonly, readOnly: true, helpText: "此欄位僅供檢視，不可編輯。" };
};

/** 建立 AAInputField 分類選項。 */
const buildAAInputCategoryOptions = (): AAInputOption[] =>
{
    return [
        { value: "news", label: "News" }, { value: "travel", label: "Travel" }, { value: "shopping", label: "Shopping" },
        { value: "business", label: "Business" }, { value: "entertainment", label: "Entertainment" }, { value: "food", label: "Food" },
        { value: "technology", label: "Technology" }, { value: "health", label: "Health" }, { value: "science", label: "Science" },
        { value: "licence", label: "Licence" }, { value: "finance", label: "Finance" }, { value: "medicine", label: "Medicine" },
    ];
};

/** 建立 AAInputField 啟用選項。 */
const buildAAInputYesNoOptions = (): AAInputOption[] =>
{
    return [{ value: "1", label: "啟用" }, { value: "0", label: "停用" }];
};

/** 建立 AAInputField 複選選項。 */
const buildAAInputMultipleOptions = (): AAInputOption[] =>
{
    return [{ value: "news", label: "最新消息" }, { value: "event", label: "活動訊息" }, { value: "download", label: "檔案下載" }];
};

// #endregion

// #region AAInputField EditGrid Simple Demo

interface DemoSimpleGridRow { id: string; title: string; count: string; category: string; enabled: boolean; }
interface DemoSimpleGridColumn { key: keyof Omit<DemoSimpleGridRow, "id">; title: string; type: AAInputField["type"]; options?: AAInputOption[]; }

/** 建立最小表格範例資料。 */
const getDefaultSimpleGridRows = (): DemoSimpleGridRow[] =>
{
    return [
        { id: "row-1", title: "第一筆資料", count: "1", category: "news", enabled: true },
        { id: "row-2", title: "第二筆資料", count: "2", category: "download", enabled: false },
    ];
};

/** 建立最小表格範例欄位。 */
const buildSimpleGridColumns = (categoryOptions: AAInputOption[]): DemoSimpleGridColumn[] =>
{
    return [
        { key: "title", title: "標題", type: "text" },
        { key: "count", title: "數量", type: "number" },
        { key: "category", title: "分類", type: "selectSingle", options: categoryOptions },
        { key: "enabled", title: "啟用", type: "checkboxSingle" },
    ];
};

/** 將 Grid 欄位轉成 AAInputField。 */
const buildSimpleGridCellField = (row: DemoSimpleGridRow, rowIndex: number, column: DemoSimpleGridColumn): AAInputField =>
{
    return {
        key: String(column.key),
        type: column.type,
        label: column.title,
        aaLabel: `第 ${rowIndex + 1} 列，${column.title}，${getSimpleGridCellAaAction(column.type)}`,
        value: row[column.key],
        options: column.options,
        min: column.type === "number" ? 0 : undefined,
        max: column.type === "number" ? 9999 : undefined,
        step: column.type === "number" ? 1 : undefined,
        searchable: column.type === "selectSingle" ? true : undefined,
        helpText: `${column.title}欄位`,
    };
};

/** 依欄位型別建立表格 cell 用的 AA 動作文字。 */
const getSimpleGridCellAaAction = (type: AAInputField["type"]) =>
{
    if (type === "number") return "請輸入數字";
    if (type === "selectSingle") return "請選擇項目";
    if (type === "checkboxSingle") return "請勾選項目";
    return "請輸入文字內容";
};

// #endregion

// #region Demo Data

/** 建立 GridProps。 */
const buildGridData = (rows: GridRow[]): GridProps =>
{
    return { columns: buildDemoColumns(), rows, CurrentPage: 1, TotalPage: 1, onPageChange: () => undefined };
};

/** 建立測試資料列。 */
const buildDemoRows = (): GridRow[] =>
{
    return Array.from({ length: 12 }, (_, index) =>
    {
        const rowNo = index + 1;
        return buildDemoRow(`row-${rowNo}`, rowNo, createDemoRowValue(rowNo));
    });
};

/** 建立指定列測試資料。 */
const createDemoRowValue = (rowNo: number): DemoRowValue =>
{
    const categoryOptions = buildCategoryOptions();
    const category = categoryOptions[(rowNo - 1) % categoryOptions.length].value;
    const secondCategory = categoryOptions[rowNo % categoryOptions.length].value;
    const month = String(((rowNo - 1) % 12) + 1).padStart(2, "0");
    const startDay = String(Math.min(rowNo + 1, 24)).padStart(2, "0");
    const endDay = String(Math.min(rowNo + 3, 28)).padStart(2, "0");
    const isEven = rowNo % 2 === 0;

    return {
        text: `第 ${rowNo} 筆文字`,
        email: `demo${rowNo}@example.com`,
        tel: `09${String(10000000 + rowNo).slice(-8)}`,
        password: "",
        number: rowNo * 10,
        date: `2026-${month}-${startDay}`,
        dateTime: `2026-${month}-${startDay}T${String((rowNo + 7) % 24).padStart(2, "0")}:30`,
        dateRange: [`2026-${month}-${startDay}`, `2026-${month}-${endDay}`],
        dateTimeRange: [`2026-${month}-${startDay}T08:30`, `2026-${month}-${endDay}T17:45`],
        textarea: `這是第 ${rowNo} 筆多行文字測試資料`,
        selectSingle: String(category),
        selectMultiple: [category, secondCategory],
        file: createDemoFileValue(rowNo),
        radio: isEven ? "hide" : "show",
        checkboxSingle: !isEven,
        checkboxMultiple: isEven ? ["read"] : ["read", "download"],
        readonly: `系統資料 ${rowNo}`,
    };
};

/** 建立測試檔案值。 */
const createDemoFileValue = (rowNo: number): EditGridFileValue =>
{
    if (rowNo % 3 === 1) return { fileName: `demo-image-${rowNo}.jpg`, url: `/demo/demo-image-${rowNo}.jpg`, mimeType: "image/jpeg", size: 20480 + rowNo };
    if (rowNo % 3 === 2) return { fileName: `demo-video-${rowNo}.mp4`, url: `/demo/demo-video-${rowNo}.mp4`, mimeType: "video/mp4", size: 40960 + rowNo };
    return { fileName: `guide-${rowNo}.pdf`, url: `/demo/guide-${rowNo}.pdf`, mimeType: "application/pdf", size: 10240 + rowNo };
};

/** 建立空白新增列資料。 */
const createEmptyDemoRowValue = (nextRowNo: number): DemoRowValue =>
{
    return {
        text: "",
        email: "",
        tel: "",
        password: "",
        number: 0,
        date: "",
        dateTime: "",
        dateRange: [],
        dateTimeRange: [],
        textarea: "",
        selectSingle: "",
        selectMultiple: [],
        file: { fileName: "", url: "", mimeType: "", size: 0 },
        radio: "show",
        checkboxSingle: false,
        checkboxMultiple: [],
        readonly: `系統產生-${nextRowNo}`,
    };
};

/** 建立測試欄位設定，所有欄位都交給 EditGrid 轉 AAInputField。 */
const buildDemoColumns = (): ColumnConfig[] =>
{
    return [
        { key: "text", title: "text", editable: true, required: true, inputType: "text", width: 180, placeholder: "請輸入文字", aaLabel: "請輸入文字內容", helpText: "text 欄位", maxLength: 80 },
        { key: "email", title: "email", editable: true, inputType: "email", width: 220, placeholder: "請輸入電子郵件", aaLabel: "請輸入有效電子郵件", helpText: "email 欄位", maxLength: 120 },
        { key: "tel", title: "tel", editable: true, inputType: "tel", width: 180, placeholder: "請輸入聯絡電話", aaLabel: "請輸入聯絡電話", helpText: "tel 欄位", maxLength: 30 },
        { key: "password", title: "password", editable: true, inputType: "password", width: 220, placeholder: "請輸入新密碼", aaLabel: "請輸入新密碼", helpText: "請輸入新密碼", maxLength: 64, render: () => "●●●●●●" },
        { key: "number", title: "number", editable: true, inputType: "number", width: 140, placeholder: "請輸入數字", aaLabel: "請輸入數字", helpText: "number 欄位，範圍 0 到 9999", min: 0, max: 9999, step: 1 },
        { key: "date", title: "date", editable: true, inputType: "date", width: 170, aaLabel: "請選擇日期", helpText: "date 欄位" },
        { key: "dateTime", title: "date-time", editable: true, inputType: "date-time", width: 220, aaLabel: "請選擇日期與時間", helpText: "date-time 欄位" },
        { key: "dateRange", title: "dateRange", editable: true, inputType: "dateRange", width: 260, aaLabel: "請選擇日期區間", helpText: "dateRange 欄位", render: (args) => formatArrayValue(args.value) },
        { key: "dateTimeRange", title: "dateTimeRange", editable: true, inputType: "dateTimeRange", width: 360, aaLabel: "請選擇日期與時間區間", helpText: "dateTimeRange 欄位", render: (args) => formatArrayValue(args.value) },
        { key: "textarea", title: "textarea", editable: true, inputType: "textarea", width: 260, placeholder: "請輸入多行文字", aaLabel: "請輸入文字內容，可多行", helpText: "textarea 欄位", rows: 3, maxLength: 300 },
        { key: "selectSingle", title: "selectSingle", editable: true, inputType: "selectSingle", width: 210, options: buildCategoryOptions(), searchPlaceholder: "查詢分類", aaLabel: "請選擇項目", helpText: "selectSingle 欄位", searchable: true },
        { key: "selectMultiple", title: "selectMultiple", editable: true, inputType: "selectMultiple", width: 260, options: buildCategoryOptions(), searchPlaceholder: "查詢分類", aaLabel: "請選擇項目，可複選", helpText: "selectMultiple 欄位", searchable: true },
        { key: "file", title: "file", editable: true, inputType: "file", width: 220, accept: ".jpg,.jpeg,.png,.pdf,.mp4", aaLabel: "請上傳檔案", helpText: "file 欄位", maxFileCount: 1, maxFileSizeMB: 10 },
        { key: "radio", title: "radio", editable: true, inputType: "radio", width: 180, options: buildDisplayModeOptions(), aaLabel: "請選擇項目，擇一", helpText: "radio 欄位" },
        { key: "checkboxSingle", title: "checkboxSingle", editable: true, inputType: "checkboxSingle", width: 160, aaLabel: "請勾選項目", helpText: "checkboxSingle 欄位" },
        { key: "checkboxMultiple", title: "checkboxMultiple", editable: true, inputType: "checkboxMultiple", width: 260, options: buildPermissionOptions(), aaLabel: "請勾選項目，可複選", helpText: "checkboxMultiple 欄位" },
        { key: "readonly", title: "readonly", editable: false, inputType: "readonly", width: 180, aaLabel: "僅供檢視", helpText: "readonly 欄位" },
    ];
};

/** 建立測試列。 */
const buildDemoRow = (keyId: string, rowNo: number, value: DemoRowValue): GridRow =>
{
    const columns = buildDemoColumns();

    return {
        keyId,
        rowNo,
        RowNo: rowNo,
        rowState: "none",
        cells: columns.map((column) => buildDemoCell(column, value[column.key])),
    };
};

/** 建立單一 cell。 */
const buildDemoCell = (column: ColumnConfig, value: EditGridCellValue): RowCell =>
{
    return {
        col: column,
        content: valueToContent(value, column),
        value,
        editable: column.editable,
        required: column.required,
        placeholder: column.placeholder,
        inputType: column.inputType,
        options: column.options,
        selectionMode: column.selectionMode,
        searchPlaceholder: column.searchPlaceholder,
        aaLabel: column.aaLabel,
        helpText: column.helpText,
        maxLength: column.maxLength,
        min: column.min,
        max: column.max,
        step: column.step,
        rows: column.rows,
        searchable: column.searchable,
        maxSearchLength: column.maxSearchLength,
        accept: column.accept,
        multiple: column.multiple,
        maxFileCount: column.maxFileCount,
        maxFileSizeMB: column.maxFileSizeMB,
        render: column.render,
        editRender: column.editRender,
    };
};

// #endregion

// #region Demo Options

/** 建立分類選項，共 12 筆，用來測試 selectSingle / selectMultiple 搜尋與捲動。 */
const buildCategoryOptions = () =>
{
    return [
        { label: "最新消息", value: "news" },
        { label: "活動訊息", value: "event" },
        { label: "檔案下載", value: "download" },
        { label: "成果展示", value: "gallery" },
        { label: "成績展示", value: "gallery2" },
        { label: "理展示", value: "gallery3" },
        { label: "常見問題", value: "faq" },
        { label: "政策公告", value: "policy" },
        { label: "教育訓練", value: "training" },
        { label: "系統維護", value: "maintenance" },
        { label: "表單申請", value: "apply" },
        { label: "其他", value: "other" },
    ];
};

/** 建立顯示狀態選項。 */
const buildDisplayModeOptions = () =>
{
    return [
        { label: "顯示", value: "show" },
        { label: "隱藏", value: "hide" },
    ];
};

/** 建立權限選項。 */
const buildPermissionOptions = () =>
{
    return [
        { label: "閱讀", value: "read" },
        { label: "下載", value: "download" },
        { label: "管理", value: "manage" },
    ];
};

// #endregion

// #region Private Helpers

interface SearchState { keyword: string; category: string; enabled: string; }

interface DemoRowValue
{
    text: string;
    email: string;
    tel: string;
    password: string;
    number: number;
    date: string;
    dateTime: string;
    dateRange: EditGridOptionValue[];
    dateTimeRange: EditGridOptionValue[];
    textarea: string;
    selectSingle: string;
    selectMultiple: EditGridOptionValue[];
    file: EditGridFileValue;
    radio: string;
    checkboxSingle: boolean;
    checkboxMultiple: EditGridOptionValue[];
    readonly: string;
    [key: string]: EditGridCellValue;
}

/** 建立預設查詢條件。 */
const getDefaultSearchState = (): SearchState => ({ keyword: "", category: "", enabled: "" });

/** 篩選目前顯示列。 */
const filterRows = (rows: GridRow[], query: SearchState) =>
{
    const keyword = query.keyword.trim().toLowerCase();

    return rows.filter((row) =>
    {
        const textMatched = !keyword || row.cells.some((cell) => valueToSearchText(cell.value).includes(keyword));
        const categoryMatched = !query.category || getCellValueText(row, "selectSingle") === query.category;
        const enabledMatched = !query.enabled || String(getCellValue(row, "checkboxSingle") === true) === query.enabled;
        return textMatched && categoryMatched && enabledMatched;
    });
};

/** 將 EditGrid 回傳的顯示列合併回完整列，並用 keyId 去重避免新增列被重複合併。 */
const mergeDisplayRows = (allRows: GridRow[], previousDisplayRows: GridRow[], nextDisplayRows: GridRow[]) =>
{
    const displayKeySet = new Set(previousDisplayRows.map((row) => row.keyId));
    const keepRows = allRows.filter((row) => !displayKeySet.has(row.keyId));
    return distinctRowsByKey([...keepRows, ...nextDisplayRows]).sort((a, b) => getRowNo(a) - getRowNo(b));
};

/** 依 keyId 去除重複列，保留後進資料讓 EditGrid 回傳的新狀態優先。 */
const distinctRowsByKey = (rows: GridRow[]) =>
{
    const rowMap = new Map<string, GridRow>();
    rows.forEach((row, index) => rowMap.set(getStableRowKey(row, index), row));
    return Array.from(rowMap.values());
};

/** 取得穩定列 key。 */
const getStableRowKey = (row: GridRow, index: number) =>
{
    return String(row.keyId || row.RowId || row.rowId || row.rowid || `new-${index}`);
};

/** 取得下一列號。 */
const getNextRowNo = (rows: GridRow[], fallback: number) =>
{
    return rows.reduce((max, row) => Math.max(max, getRowNo(row)), fallback - 1) + 1;
};

/** 取得列號。 */
const getRowNo = (row: GridRow) =>
{
    return Number(row.rowNo ?? row.RowNo ?? row.rowno ?? 0);
};

/** 取得指定欄位值。 */
const getCellValue = (row: GridRow, key: string) =>
{
    return row.cells.find((cell) => cell.col.key === key)?.value;
};

/** 取得指定欄位文字值。 */
const getCellValueText = (row: GridRow, key: string) =>
{
    const value = getCellValue(row, key);
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "";
};

/** 將 value 轉成搜尋文字。 */
const valueToSearchText = (value: EditGridCellValue) =>
{
    if (Array.isArray(value)) return value.map(String).join(" ").toLowerCase();
    if (toFileValue(value)) return toFileValue(value)?.fileName.toLowerCase() ?? "";
    return String(value ?? "").toLowerCase();
};

/** 將 value 轉成唯讀顯示內容。 */
const valueToContent = (value: EditGridCellValue, column: ColumnConfig) =>
{
    const file = toFileValue(value);
    if (file) return file.fileName ?? "";
    if (Array.isArray(value)) return value.map((item) => getOptionLabel(column, item)).join("、");
    if (typeof value === "boolean") return getBooleanContent(value, column);
    if (typeof value === "string" || typeof value === "number") return getOptionLabel(column, value);
    return "";
};

/** 將 boolean value 轉成唯讀顯示內容。 */
const getBooleanContent = (value: boolean, column: ColumnConfig) =>
{
    if (column.options?.length) return getOptionLabel(column, value);
    return value ? "是" : "否";
};

/** 依 option value 取得 label。 */
const getOptionLabel = (column: ColumnConfig, value: EditGridOptionValue) =>
{
    return column.options?.find((option) => String(option.value) === String(value))?.label ?? String(value);
};

/** 顯示陣列欄位。 */
const formatArrayValue = (value: EditGridCellValue) =>
{
    return Array.isArray(value) ? value.map(String).join(" ~ ") : "";
};

/** 將欄位值轉成檔案值。 */
const toFileValue = (value: EditGridCellValue): EditGridFileValue | null =>
{
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return "fileName" in value ? value as EditGridFileValue : null;
};

// #endregion
