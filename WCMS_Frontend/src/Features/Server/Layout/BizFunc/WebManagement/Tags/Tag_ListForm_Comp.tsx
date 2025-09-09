import type { IBETheme } from "../../../Theme/ITheme"
import { useLocation } from 'react-router-dom';
import { FormListComp } from "../../../Scaffold/Content/FormList_Comp";
import type { FormListCompProp } from "../../../Scaffold/Content/Content_Data"
import { useListToolbarActions } from "../../../../../../SysCore/Components/Toolbar/Toolbar_Hook";
import { useParams } from "react-router-dom";
import { useCategoryListData } from "./Tag_Hook";
import type { components } from "../../../../../../types/api";
import { useFetchFormData } from "../../../../../../SysCore/Utils/API/FetchFormData";
import TagProvider from "./Tag_Api";
import { LibTextBox } from "../../../../../../SysCore/Components/FormField/LibFormField";
import { Link } from "react-router-dom";
type TagSet = components["schemas"]["TagSet_DTO"]
type TagDetail = components["schemas"]["TagDetail_DTO"]
const emptyData: TagSet = {
    TagData: {},
    TagDetail: []
}
/** 頁面清單
 * @returns 
 */
export const TagListFormComp = ({ progId, title, theme }: { progId: string; title: string; theme: IBETheme }) => {
    const { internalId } = useParams();
    var dirUrl = useLocation().pathname.replace(/\/Tag$/, `/Tag`);

    const pathParts = useLocation().pathname.split('/');

    //const lastPart = pathParts.pop(); // 移除並取得最後一個部分
    if (pathParts[pathParts.length - 1] !== 'Tag') {

        dirUrl = location.pathname.split('/').slice(0, -1).join('/');
    }
    const useToolbar = useListToolbarActions(dirUrl)

    const useTagList = useCategoryListData(progId, 'zh-tw')
    const formData = useFetchFormData<TagSet>(TagProvider(), internalId, emptyData)


    //*需要itmes動態化
    const LibTabsPropB = {
        item: { "zh-tw": "繁體中文", "en": "English", }
    }

    const components: Record<string, React.ReactNode[]> = Object.entries(LibTabsPropB.item).reduce(
        (acc, [lang, label]) => {
            acc[lang] = generateLangFields(lang, label, theme, formData.data as TagSet, formData.setFormData);
            return acc;
        },
        {} as Record<string, React.ReactNode[]>
    );

    const gridItems: React.ReactNode[] = useTagList.rawData.map(
        (item) => TagListItem(item.TagData?.InternalId ?? "", item.TagDetail?.find(i => i.Lang === 'zh-tw')?.TagName ?? "")
    );

    const isLoading = [useTagList.isLoading, formData.isLoading];
    const errors = [useTagList.error, formData.error];
    const prop: FormListCompProp = { Title: title, SubTitle: title, Theme: theme, LoadingList: isLoading, ErrorList: errors, InputControl: [components['zh-tw'], components['en']], GridItems: gridItems, FormToolbar: useToolbar.toolbarActions }

    return (
        <FormListComp prop={prop}></FormListComp>
    );
}

const TagListItem = (internalId: string, displayName: string) => {
    const basePath = useLocation().pathname.split('/Tag')[0];
    const dirPath = `${basePath}/Tag/${internalId}`;
    return (
        <>
            <div className="checkboxDIV my-2">
                <div className="custom-control form-check">
                    <Link to={dirPath} className="form-check-label" aria-label={`前往 ${displayName} 詳細頁`}>
                        <span className="check-txt">{displayName}</span>
                    </Link>
                </div>
            </div>
        </>
    )
}

const generateLangFields = (lang: string, label: string, theme: IBETheme,
    formData: TagSet, setFormData: React.Dispatch<React.SetStateAction<TagSet | null>>
): React.ReactNode[] => {
    const details: TagDetail[] = (formData?.TagDetail ?? []) as TagDetail[];
    const getLangData = (): TagDetail => details.find(d => d.Lang === lang) ?? ({ Lang: lang, Title: "", SubTitle: "", Content: "", Url: "" } as TagDetail);
    const updateLangData = (key: "TagName", val: string) => {
        const currentData = getLangData();
        const newItem = { ...currentData, [key]: val };
        const isEmpty = (newItem.TagName?.trim() ?? "") === "";
        const nextDetails = isEmpty ? details.filter((d) => d.Lang !== lang) : details.some((d) => d.Lang === lang) ? details.map((d) => (d.Lang === lang ? newItem : d)) : [...details, newItem];
        setFormData({ ...formData, TagDetail: nextDetails });
    };
    const data = getLangData();
    return [
        <LibTextBox key={`${lang}-Title`} Style={theme.TextBox} ColumnDisplayName={`標籤名稱（${label}）`} DefaultInputDisplay="請輸入" InputValue={data.TagName ?? ""} OnChange={(val) => updateLangData("TagName", val)} />,
    ];
};