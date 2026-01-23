import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import ModuleContent from "@/Features/Pages/Client/Scaffold/SubPages/Section/ModuleContent";
import parse from 'html-react-parser';
import { useFetchFormData } from "@/SysCore/Utils/API/FetchFormData";
import PageManagementProvider from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";
import { useResolveInternalIds } from "@/SysCore/Components/File/useResolveInternalIds";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";

export interface IPageManagementOptions { PageId?: string }
interface IPageManagementProps { node: INormNode; lang: string; theme?: IFETheme; options?: IPageManagementOptions; }
const PageManagementFormComp = (props: IPageManagementProps) => {
    const pageData = useFetchFormData(PageManagementProvider(), props.options?.PageId);
    const detail = pageData.data?.PageManagementDetail?.find(d => (d.Lang ?? "").toLowerCase() === props.lang)
    const parseContent = useResolveInternalIds(detail?.Content ?? "", { locale: props.lang });
    const content = parseContent.html ? parse(parseContent.html) : null;
    const loadingList: boolean[] = [pageData.isLoading];
    const errorList: (string | null | undefined)[] = [pageData.error];
    return (
        <ModuleContent nodeTitle={""} title={detail?.Title ?? ""} loadingList={loadingList} errorList={errorList}>
            {content}
        </ModuleContent>
    )
};
export default PageManagementFormComp

