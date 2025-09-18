import { LibCheckBox, LibTextBox, LibTextArea, LibFile, LibDropList, LibPicture } from "@/SysCore/Components/FormField/LibFormField"
import type { LibTabsProp } from "@/SysCore/Components/FormField/LibFormField"
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useGetCategoryListByProgId } from "@/Features/Pages/Server/BizFunc/WebManagement/Category/Category_Hook"
import { FormComp } from "@/Features/Pages/Server/Scaffold/Content/Form_Comp";
import { useParams } from "react-router-dom";
import TabContentComp from "@/SysCore/Components/TabContent/TabContent";
import type { FormCompProp } from "@/Features/Pages/Server/Scaffold/Content/Content_Data";
import { useState } from "react";
import type { components } from "@/types/api";
import WebResourceProvider from "./WebResource_Api";
import { useGetTagListByProgId } from "../Tags/Tag_Hook";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { useFetchFormData, type UseFetchFormDataResult } from "@/SysCore/Utils/API/FetchFormData";
import { parseBitmaskToStringArray, sumStringArrayToBitmask } from "@/SysCore/Utils/Library/LibData";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"]
type WebResourceInfo = components["schemas"]["WebResourceInfo_DTO"]


const emptyData: WebResourceSet = {
    WebResource: {},
    WebResourceInfo: []
}
/** 網路資源表單
 * @returns 
 */
export const WebResourceFormComp = ({ theme }: { theme: IBETheme }) => {
    const { internalId } = useParams()

    const useCategory = useGetCategoryListByProgId("WebResource", "zh-tw");
    const useTag = useGetTagListByProgId("WebResource", "zh-tw");
    const useContentStatus = useFetchEnumOptions("ContentStatus")
    const formData = useFetchFormData<WebResourceSet>(WebResourceProvider(), internalId, emptyData)

    const isLoading = [useTag.isLoading, useCategory.isLoading, formData.isLoading, useContentStatus.isLoading]
    const errors = [useTag.error, useCategory.error, formData.error, useContentStatus.error]
    const prop: FormCompProp = { Title: "新增網路資源", Theme: theme, LoadingList: isLoading, ErrorList: errors, }

    // state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    // 當 LibFile onChange 回傳 File[]
    const handleFileChange = (files: File[]) => {
        if (files && files.length > 0) {
            const file = files[0];   // 只取第一個
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setPreviewUrl("");
        }
    };

    const LibTabsPropA: LibTabsProp = {
        Style: theme.Tabs,
        item: { "Basic": "基本", "Status": "狀態", "Tags": "標籤", "Img": "圖片", }
    }
    const componentsA: Record<string, React.ReactNode[]> = {
        Basic: [
            <LibCheckBox colDisplayName="類別" options={Object.entries(useCategory.data ?? {}).map(([key, value]) => ({ itemId: key, itemDisplayName: value, }))}
                InputValue={formData.data?.WebResource?.Categories?.split(",") ?? []}
                onChange={(val) => { const joined = val.join(","); formData.setFormData((prev) => ({ ...prev, WebResource: { ...prev?.WebResource, Categories: joined, }, })); }}
            />,
            <LibTextBox Style={theme.TextBox} ColumnDisplayName="排序編號" DefaultInputDisplay="請輸入" ></LibTextBox>,
        ],
        Status: [
            <LibCheckBox colDisplayName="狀態"
                options={(useContentStatus.data ?? []).map(item => ({ itemId: String(item.Key), itemDisplayName: item.DisplayName, }))}
                InputValue={parseBitmaskToStringArray(formData.data?.WebResource?.ContentStatus ?? 0, useContentStatus.data?.map(d => d.Key) ?? [])}
                onChange={(val) => { const sum = sumStringArrayToBitmask(val); formData.setFormData((prev) => ({ ...prev, WebResource: { ...prev?.WebResource ?? {}, ContentStatus: sum as any, }, })); }}
            />
        ],
        Tags: [
            <LibCheckBox colDisplayName="標籤"
                options={Object.entries(useTag.data ?? {}).map(([key, value]) => ({ itemId: key, itemDisplayName: value, }))}
                InputValue={formData.data?.WebResource?.Tags?.split(",") ?? []}
                onChange={(val) => { const joined = val.join(","); formData.setFormData((prev) => ({ ...prev, WebResource: { ...prev?.WebResource, Tags: joined, }, })); }}
            />
        ],
        Img: [
            <LibFile Style={theme.File} ColumnDisplayName={`選擇圖片`} Multiple={false} parentClass="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12" onChange={handleFileChange}>
                <LibPicture
                    key="preview"
                    ColumnDisplayName={selectedFile?.name ?? ""}
                    PicSrc={previewUrl || "https://dummyimage.com/1920x550/555/fff.png"}
                    PicDescription={`選中的圖片 ${selectedFile?.name ?? ""}`}
                />
            </LibFile>,
            <LibTextBox key={`Title`} Style={theme.TextBox} ColumnDisplayName={`圖片說明`} DefaultInputDisplay="請輸入" />,
        ]
    }
    const LibTabsPropB: LibTabsProp = {
        Style: theme.Tabs,
        item: {
            "Chinese": "繁體中文",
            "English": "English",
        }
    }
    const componentsB: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme, formData);
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

const generateLangFields = (lang: string, label: string, theme: IBETheme, formData: UseFetchFormDataResult<WebResourceSet>): React.ReactNode[] => {
    const details = formData?.data?.WebResourceInfo ?? [];
    const langDaTa: WebResourceInfo = details.find(d => d.Lang === lang) ?? { Lang: lang, Title: "" };

    return [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標題（${label}）`} DefaultInputDisplay="請輸入" InputValue={langDaTa.Title ?? ""} />,
        <LibTextArea key={`${lang}-Content`} Style={theme.TextArea} ColumnDisplayName={`內容（${label}）`} DefaultInputDisplay="請輸入" InputValue={langDaTa.Content ?? ""} />,
        <LibTextBox key={`${lang}-Url`} Style={theme.TextBox} ColumnDisplayName={`網址（${label}）`} DefaultInputDisplay="請輸入" InputValue={langDaTa.ResUrl ?? ""} />,
        <LibDropList key={`${lang}-Target`} Style={theme.DropList} ColumnDisplayName={`開啟方式（${label}）`} InputValue={langDaTa.Url_OpenType ?? ""} />
    ];
};
