import { LibCheckBox, LibTextBox, LibFileInput } from "@/SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "@/Features/Pages/Server/BizFunc/WebManagement/Category/Category_Hook"
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import type { components } from "@/types/api";
import FileArchiveProvider from "./FileArchive_Api";
import { useGetTagListByProgId } from "../Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { parseBitmaskToStringArray, sumStringArrayToBitmask } from "@/SysCore/Utils/Library/LibData";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"]


const emptyData: FileArchiveSet = {
    FileArchive: {},
    FileArchiveInfo: [
        {
            RowId: 1,
            Lang: "zh-tw",
            FileArchiveId: ""
        },
    ],
    FileArchiveDetail: [
    ]
}

/** 檔案室表單
 * @returns 
 */
export const FileArchiveFormComp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams()

    const useCategory = useGetCategoryListByProgId("FileArchive", "zh-tw");
    const useTag = useGetTagListByProgId("FileArchive", "zh-tw");
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const formData = useFetchFormData<FileArchiveSet>(FileArchiveProvider(), internalId, emptyData)

    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error]

    const prop: FormCompProp = { Title: "新增檔案室", Theme: theme, LoadingList: isLoading, ErrorList: errors, }

    const LibTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", }
    }

    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox colDisplayName="類別"
                options={Object.entries(useCategory.data ?? {}).map(([key, value]) => ({ itemId: key, itemDisplayName: value, }))}
                InputValue={formData.data?.FileArchive?.CategoriesId?.split(",") ?? []}
                onChange={(val) => { const joined = val.join(","); formData.setFormData((prev) => ({ ...prev, FileArchive: { ...prev?.FileArchive, CategoriesId: joined, }, })); }}
            />,
        ],
        Status: [
            <LibCheckBox colDisplayName="狀態"
                options={(useContentStatus.data ?? []).map(item => ({ itemId: String(item.Key), itemDisplayName: item.DisplayName, }))}
                InputValue={parseBitmaskToStringArray(formData.data?.FileArchive?.ContentStatus ?? 0, useContentStatus.data?.map(d => d.Key) ?? [])}
                onChange={(val) => { const sum = sumStringArrayToBitmask(val); formData.setFormData((prev) => ({ ...prev, FileArchive: { ...prev?.FileArchive ?? {}, ContentStatus: sum as any, }, })); }}
            />
        ],
        Tags: [
            <LibCheckBox colDisplayName="標籤"
                options={Object.entries(useTag.data ?? {}).map(([key, value]) => ({ itemId: key, itemDisplayName: value, }))}
                InputValue={formData.data?.FileArchive?.TagsId?.split(",") ?? []}
                onChange={(val) => { const joined = val.join(","); formData.setFormData((prev) => ({ ...prev, FileArchive: { ...prev?.FileArchive, TagsId: joined, }, })); }}
            />
        ]
    }

    const LibTabsPropB: LibTabsProp = {
        Style: theme.Tabs,
        item: { "zh-tw": "繁體中文", "en": "English", }
    }
    const componentsB: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme);
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


const generateLangFields = (lang: string, label: string, theme: IBETheme, formData: UseFetchFormDataResult<FileArchiveSet>): React.ReactNode[] => {

    const details = formData?.data?.FileArchiveInfo ?? [];
    const getLangData = details.find(d => d.Lang === lang) ?? { Lang: lang, Title: "", SubTitle: "", Content: "", Url: "" };
    // 先放標題
    const fields: React.ReactNode[] = [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入"
            InputValue={getLangData.Title ?? ""}
            OnChange={(val) => {
                formData.setFormData(prev => {
                    const next = { ...(prev ?? {}) } as FileArchiveSet;
                    next.FileArchiveInfo = (next.FileArchiveInfo ?? []).map(x =>
                        (x.RowId ?? -1) === detailRowId ? { ...x, SortNo: Number(val) || 0 } : x
                    );
                    return next;
                });
            }}
        />
    ];

    // 再重複 10 次檔案名稱 + 上傳檔案
    Array.from({ length: 10 }, (_, index) => {
        const num = index + 1;
        fields.push(
            <hr
                key={`hr-${num}`}
                style={{ border: "1px solid #ccc", margin: "10px 0" }}
            />,
            <LibFileInput
                key={`${lang}-Content-${num}`}
                Style={theme.FileInput}
                ColumnDisplayName={`上傳檔案 - ${num} 名稱`}
                DefaultInputDisplay="請輸入"
            />,
        );
    });

    return fields;
};



