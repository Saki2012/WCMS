import { LibTextBox, LibTinyMCE, LibFile, LibPicture, LibFileInput } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "../../../../../../SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "../../../Theme/ITheme";
import { useGetCategoryListByProgId } from "../Category/Category_Hook"
import { useGetTagListByProgId } from "../Tags/Tag_Hook";
import AnnouncementProvider from "./Announcement_Api"
import { FormComp } from "../../../Scaffold/Content/Form_Comp";
import { useFormToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import type { FormCompProp } from "../../../Scaffold/Content/Content_Data";
import type { components } from "../../../../../../types/api";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"]
type AnnouncementDetail = components["schemas"]["AnnouncementDetail_DTO"]
type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"]
import TabContentComp from "../../../../../../SysCore/Components/TabContent/TabContent";
import LibCheckBox from "../../../../../../SysCore/Components/FormField/FieldComponets/LibCheckBox_Comp";
import LibCalendar from "../../../../../../SysCore/Components/FormField/FieldComponets/LibCalendar_Comp";
import { useFetchFormData } from "../../../../../../SysCore/Utils/API/FetchFormData";
import { useFetchEnumOptions } from "../../../../../../SysCore/Utils/API/SystemAPI_Hook";
import { parseBitmaskToStringArray, sumStringArrayToBitmask } from "../../../../../../SysCore/Utils/Library/LibData";
import { useUploadPicture } from "../../../../../../SysCore/Components/FormField/FieldComponets/LibPicture_Comp";

const emptyData: AnnouncementSet = {
    Announcement: {},
    AnnouncementDetail: []
}
/** 頁面表單
 * @returns 
 */
export const AnnouncementFormComp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams();
    const useCategory = useGetCategoryListByProgId("Announcement", "zh-tw");
    const useTag = useGetTagListByProgId("Announcement", "zh-tw");
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const formData = useFetchFormData<AnnouncementSet>(AnnouncementProvider(), internalId, emptyData)
    const useToolbar = useFormToolbarActions(AnnouncementProvider(), formData.data as AnnouncementSet, internalId as string, () => formData.refetch())
    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error]
    const prop: FormCompProp = { Title: "新增公告", Theme: theme, LoadingList: isLoading, ErrorList: errors, Toolbar: useToolbar.action }
    const LibTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Pic": "圖片" }
    }

    const useUploadPic = useUploadPicture();
    const initialPicId = formData.data?.Announcement?.PictureId;
    const previewSrc = useUploadPic.result.previewUrl || (initialPicId ? `/Service/FileManagement/Preview/${initialPicId}` : "https://dummyimage.com/1920x550/555/fff.png");

    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [<LibCheckBox colDisplayName="類別"
            options={Object.entries(useCategory.data ?? {}).map(([key, value]) => ({ itemId: key, itemDisplayName: value, }))}
            value={formData.data?.Announcement?.Categories?.split(",") ?? []}
            onChange={(val) => { const joined = val.join(","); formData.setFormData((prev) => ({ ...prev, Announcement: { ...prev?.Announcement, Categories: joined, }, })); }}
        />,
        <LibCalendar colDisplayName={"開始時間"}
            InputValue={formData.data?.Announcement?.Validate_Start ?? ""}
            onChange={(val) => { formData.setFormData(prev => ({ ...prev, Announcement: { ...prev?.Announcement, Validate_Start: val, } })); }}
        />,
        <LibCalendar colDisplayName={"結束時間"}
            InputValue={formData.data?.Announcement?.Validate_End ?? ""}
            onChange={(val) => { formData.setFormData(prev => ({ ...prev, Announcement: { ...prev?.Announcement, Validate_End: val, } })); }}
        />,
        ],

        Status: [<LibCheckBox colDisplayName="狀態啟用"
            options={(useContentStatus.data ?? []).map(item => ({ itemId: String(item.Key), itemDisplayName: item.DisplayName, }))}
            value={parseBitmaskToStringArray(formData.data?.Announcement?.ContentStatus ?? 0, useContentStatus.data?.map(d => d.Key) ?? [])}
            onChange={(val) => { const sum = sumStringArrayToBitmask(val); formData.setFormData((prev) => ({ ...prev, Announcement: { ...prev?.Announcement ?? {}, ContentStatus: sum as any, }, })); }}
        />
        ],

        Tags: [<LibCheckBox colDisplayName="標籤"
            options={Object.entries(useTag.data ?? {}).map(([key, value]) => ({ itemId: key, itemDisplayName: value, }))}
            value={formData.data?.Announcement?.Tags?.split(",") ?? []}
            onChange={(val) => { const joined = val.join(","); formData.setFormData((prev) => ({ ...prev, Announcement: { ...prev?.Announcement, Tags: joined, }, })); }}
        />,
        ],

        Pic: [<LibFile Style={theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false}
            accept="image/*"
            parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12" onChange={(files) =>
                useUploadPic.handleFileChange(files, (internalId) => {
                    formData.setFormData((prev) => ({ ...prev, Announcement: { ...prev?.Announcement, PictureId: internalId, }, }));
                })
            }>
            <LibPicture key="preview" ColumnDisplayName={useUploadPic?.result.previewUrl ?? ""} PicSrc={previewSrc} PicDescription={`選中的圖片`} />
        </LibFile>,
        <LibTextBox key={`Title`} Style={theme.TextBox} ColumnDisplayName={`公告圖片說明`} DefaultInputDisplay="請輸入"
            InputValue={formData.data?.Announcement?.PicDescription ?? ""} OnChange={(val) => formData.setFormData(prev => ({ ...prev, Announcement: { ...prev?.Announcement, PicDescription: val }, }))} />,
        ],
    };
    const LibTabsPropB: LibTabsProp = {
        Style: theme.Tabs,
        item: { "zh-tw": "繁體中文", "en": "English", }
    }
    const componentsB: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme, formData.data as AnnouncementSet, formData.setFormData);
            return acc;
        },
        {} as Record<string, React.ReactNode[]>
    );
    return (
        <FormComp prop={prop}>
            <TabContentComp libTabsProp={LibTabsPropA} components={componentsA}></TabContentComp>
            <TabContentComp libTabsProp={LibTabsPropB} components={componentsB}></TabContentComp>
        </FormComp>
    )
}

const generateLangFields = (lang: string, label: string, theme: IBETheme,
    formData: AnnouncementSet, setFormData: React.Dispatch<React.SetStateAction<AnnouncementSet | null>>
): React.ReactNode[] => {
    const details = formData?.AnnouncementDetail ?? [];
    const getLangData = (): AnnouncementDetail => details.find(d => d.Lang === lang) ?? { Lang: lang, Title: "", SubTitle: "", Content: "", Url: "" };
    const updateLangData = (key: "Title" | "SubTitle" | "Content" | "Url" | "UrlDesp", val: string) => {
        const currentData = getLangData();
        const newItem = { ...currentData, [key]: val };
        const isEmpty = (newItem.Title?.trim() ?? "") === "" && (newItem.Content?.trim() ?? "") === "";
        const nextDetails = isEmpty ? details.filter((d) => d.Lang !== lang) : details.some((d) => d.Lang === lang) ? details.map((d) => (d.Lang === lang ? newItem : d)) : [...details, newItem];
        setFormData({ ...formData, AnnouncementDetail: nextDetails });
    };
    const data = getLangData();
    const aId = data.AnnouncementId ?? formData?.Announcement?.AnnouncementId ?? null;
    const parentRowId = data.RowId ?? 0;

    // 整體檔案清單
    const allFiles: AnnouncementDetailFile[] = formData?.AnnouncementDetailFile ?? [];
    const getFiles = (): AnnouncementDetailFile[] => allFiles
        .filter(f => f.ParentRowId === parentRowId && (aId ? f.AnnouncementId === aId : true))
        .sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
    const commitFiles = (nextFiles: AnnouncementDetailFile[]) => {
        setFormData({ ...formData, AnnouncementDetailFile: nextFiles, });
    };

    const addFile = () => {
        const list = getFiles();
        const nextRowId = (list.at(-1)?.RowId ?? 0) + 1;
        const newItem: AnnouncementDetailFile = {
            AnnouncementId: aId ?? undefined,
            ParentRowId: parentRowId,
            RowId: nextRowId,
            FileId: null,
        };

        commitFiles([...allFiles, newItem]);
    };
    // 更新第 i 筆（i 為目前語系+明細的過濾結果索引）
    const updateFileAt = (i: number, patch: Partial<AnnouncementDetailFile>) => {
        const filtered = getFiles();
        const target = filtered[i];
        if (!target) return;

        const nextAll = allFiles.map(f => {
            const isSame =
                f.AnnouncementId === target.AnnouncementId &&
                f.ParentRowId === target.ParentRowId &&
                f.RowId === target.RowId;
            return isSame ? { ...f, ...patch } : f;
        });
        commitFiles(nextAll);
    };

    // 刪除第 i 筆
    const removeFileAt = (i: number) => {
        const filtered = getFiles();
        const target = filtered[i];
        if (!target) return;
        const nextAll = allFiles.filter(
            f =>
                !(
                    f.AnnouncementId === target.AnnouncementId &&
                    f.ParentRowId === target.ParentRowId &&
                    f.RowId === target.RowId
                )
        );
        commitFiles(nextAll);
    };


    return [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.Title ?? ""} OnChange={(val) => updateLangData("Title", val)} />,
        <LibTextBox key={`${lang}-SubTitle`} Style={theme.TextBox} ColumnDisplayName={`副標題（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.SubTitle ?? ""} OnChange={(val) => updateLangData("SubTitle", val)} />,
        <LibTinyMCE key={`${lang}-Content`} Style={theme.TinyMCE} ColumnDisplayName={`內容編輯器（${label}）`} InputValue={data.Content ?? ""} OnChange={(val) => updateLangData("Content", val)} />,
        <LibTextBox key={`${lang}-Url`} Style={theme.TextBox} ColumnDisplayName={`網址（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.Url ?? ""} OnChange={(val) => updateLangData("Url", val)} />,
        <LibTextBox key={`${lang}-UrlDesp`} Style={theme.TextBox} ColumnDisplayName={`網址描述（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.UrlDescription ?? ""} OnChange={(val) => updateLangData("UrlDesp", val)} />,

        // <LibFileInput Style={theme.FileInput} ColumnDisplayName={`檔案名稱`} DefaultInputDisplay="請輸入" />,
        <div role="group" aria-labelledby={`files-${lang}-label`} className="mt-4">
            <div id={`files-${lang}-label`} className="sr-only">附件（{label}）</div>

            <button
                type="button"
                onClick={addFile}
                aria-label={`新增 ${label} 附件`}
                className="btn btn-secondary mb-2"
            >
                新增附件
            </button>

            {getFiles().map((f, i) => (
                <div key={`${lang}-${f.ParentRowId}-${f.RowId}`} className="flex items-center gap-2 mb-2">

                    <LibFileInput
                        ColumnDisplayName={`附件 ${i + 1}`}
                        DefaultInputDisplay="請選擇檔案"
                        Style={theme.FileInput}
                        InputValue={""} // 或 f.FileSrcId
                        OnChange={(internalId, fileName) => {
                            updateFileAt(i, { FileId: internalId });
                        }}
                    />

                    <button
                        type="button"
                        className="btn btn-outline"
                        aria-label={`刪除附件 ${i + 1}（${label}）`}
                        onClick={() => removeFileAt(i)}
                    >
                        移除
                    </button>
                </div>
            ))}
        </div>
    ];
};