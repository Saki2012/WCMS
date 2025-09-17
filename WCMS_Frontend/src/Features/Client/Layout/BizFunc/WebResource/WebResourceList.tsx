/**公告清單 */
import type { components } from "../../../../../types/api";
import type { IFETheme } from "../../Theme/ITheme";
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
import { useFetchGridListData } from "../../../../../SysCore/Utils/API/FetchGridListData";
import * as SchemaFields from "../../../../../types/SchemaFields";
import { LibMerge } from "../../../../../SysCore/Utils/Library/LibMergeData";
import type { Lang } from "../../../../../SysCore/i18n/lang";
import WebResourceProvider from "../../../../Server/Layout/BizFunc/WebManagement/WebResource/WebResource_Api";
import LoadingErrorHandler from "../../../../../SysCore/Components/LoadingErrorHandler";
import { SubPageTitle } from "../../Scaffold/Header/SubPageTitle_Comp";

const useWebResourceList = (categoryIds: string, tagIds: string) => {
    var condition: string = "";
    if (categoryIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.WebResourceFields.Categories} HasAny (${categoryIds})`)
    if (tagIds) condition = LibMerge(" And ", false, condition, `${SchemaFields.WebResourceFields.Tags} HasAny (${tagIds})`)
    condition = LibMerge(" And ", false, condition, `${SchemaFields.WebResourceFields.ContentStatus} !& 4`)//不包含隱藏的資料
    const provider = WebResourceProvider();
    return useFetchGridListData<WebResourceSet>({
        getModelDisplayName: () => provider.getModelDisplayName(),
        fetchList: (cond) => provider.fetchList(cond),
        fetchListCount: (cond) => provider.fetchListCount(cond),
        visibleKeys: [
        ],
        buildQueryCondition: () => ({
            Fields: [
                SchemaFields.WebResourceFields.InternalId,
                SchemaFields.WebResourceFields.WebResourceId,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Lang}`,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Title}`,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.Content}`,
                `${SchemaFields.WebResourceSetFields.WebResourceInfo}.${SchemaFields.WebResourceInfoFields.ResUrl}`,
            ],
            Condition: condition,
            PageNumber: 0,
            PageSize: 0,
        }),
        enabled: true,
        deps: [categoryIds, tagIds],
    });
};


export interface IWebResourceListOptions { Category?: string; Tag?: string; Style: number; }
interface IWebResourceListProps { Theme: IFETheme; Lang: string | Lang; Options?: IWebResourceListOptions; title: string }

export const WebResourceListComp = (props: IWebResourceListProps) => {
    const useWebResList = useWebResourceList(props.Options?.Category ?? "", props.Options?.Tag ?? "");
    const isLoading = [useWebResList.isLoading];
    const errors = [useWebResList.error];
    return (
        <>
            <LoadingErrorHandler loadingList={isLoading} errorList={errors} >
                <SubPageTitle title={props.title} />
                <YoutubeContent lang={props.Lang} datas={useWebResList.rawData ?? []} />
                {/* <Paginator {...prop.PaginatorProp}></Paginator> */}
            </LoadingErrorHandler>
        </>);
};

const YoutubeContent = ({ lang, datas }: { lang: string, datas: WebResourceSet[] }) => {
    return (<>
        <div className="row margin_0">
            {datas.map((item) => {
                const detail = item.WebResourceInfo?.find(p => p.Lang === lang)
                return (
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12 photo_standardbox">
                        <a className="venobox vbox-item" data-autoplay="true" data-vbtype="video" href={detail?.ResUrl ?? ""} title={`${detail?.Title ?? ""} (另開新視窗)`} target="_blank" rel="noopener noreferrer">
                            <div className="img-box">
                                <iframe width="100%" height="275" src={detail?.ResUrl ?? ""}
                                    title={detail?.Title ?? ""} style={{ border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen></iframe>
                            </div>
                            <figcaption>
                                <h3 className="title mt-0 mb-0">{detail?.Title ?? ""}</h3>
                            </figcaption>
                        </a>
                    </div>
                )
            })}
        </div>
    </>)
}