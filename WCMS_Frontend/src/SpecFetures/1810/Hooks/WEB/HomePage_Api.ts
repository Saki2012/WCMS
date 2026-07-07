import {
    type ApiAdapterError,
    ApiBaseAdapter,
    type ApiLoaderData,
    type EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiBaseService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

type BannerSet = components["schemas"]["BannerSet_DTO"];

type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];

type GallerySet = components["schemas"]["GallerySet_DTO"];

type TagSet = components["schemas"]["TagSet_DTO"];

type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

export interface SpecHomePageInitialDataDTO
{
    BannerSlider?: SpecHomePageBannerSectionDTO | null;
    CategoryTabs?: SpecHomePageCategoryTabsSectionDTO | null;
    EventSession?: SpecHomePageEventSectionDTO | null;
    GallerySession?: SpecHomePageGallerySectionDTO | null;
    VideoSession?: SpecHomePageVideoSectionDTO | null;
}

export interface SpecHomePageBannerSectionDTO
{
    Banner?: BannerSet | null;
}

export interface SpecHomePageCategoryTabsSectionDTO
{
    AllNews?: AnnouncementSet[] | null;
    ProjectNews?: AnnouncementSet[] | null;
    LegalNews?: AnnouncementSet[] | null;
    EventNews?: AnnouncementSet[] | null;
    AwardNews?: AnnouncementSet[] | null;
    MediaNews?: AnnouncementSet[] | null;
    Categories?: CategoryDataSet[] | null;
    Tags?: TagSet[] | null;
}

export interface SpecHomePageEventSectionDTO
{
    Announcements?: AnnouncementSet[] | null;
    Tags?: TagSet[] | null;
}

export interface SpecHomePageGallerySectionDTO
{
    Galleries?: GallerySet[] | null;
    Categories?: CategoryDataSet[] | null;
}

export interface SpecHomePageVideoSectionDTO
{
    WebResources?: WebResourceSet[] | null;
}

export type HomePageInitialArgs = Record<string, never>;

export type HomePageInitialLoaderData = ApiLoaderData<HomePageInitialArgs, SpecHomePageInitialDataDTO[]>;

interface IUseInitialData
{
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    onError?: (err: ApiAdapterError) => void;
    initial?: HomePageInitialLoaderData | null;
}

interface ICreateInitialDataLoader
{
    getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
}

type HomePageInitialHookResult = {
    data: SpecHomePageInitialDataDTO | null;
    initialData: SpecHomePageInitialDataDTO | null;
    list: SpecHomePageInitialDataDTO[];
    apiRes: ApiResponse<SpecHomePageInitialDataDTO[]> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
};

type ExtraLoaders = {
    /** SSR / CSR loader：取得 1810 首頁初始化資料。 */
    createInitialDataLoader: (opt?: ICreateInitialDataLoader) => (args: LoaderFunctionArgs) => Promise<HomePageInitialLoaderData>;
};

type ExtraHooks = {
    /** CSR / Hydration hook：取得 1810 首頁初始化資料。 */
    useInitialData: (opt?: IUseInitialData) => HomePageInitialHookResult;
};

const HOME_PAGE_SETTING_ENDPOINT = "SpecHomePageSetting/GetInitialData";
// #endregion

// #region Public
export class SpecHomePage1810Service extends ApiBaseService
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecHomePageApi, apiInstance);
    }

    /** 呼叫 1810 首頁初始化 API。 */
    public async getInitialDataAsync(): Promise<ApiResponse<SpecHomePageInitialDataDTO[]>>
    {
        // return
        return await this.CallApi<SpecHomePageInitialDataDTO[]>(() => this.Api.get<ApiResponse<SpecHomePageInitialDataDTO[]>>(HOME_PAGE_SETTING_ENDPOINT));
    }
    // #endregion
}

export class SpecHomePage1810AdapterImpl extends ApiBaseAdapter<SpecHomePage1810Service>
{
    // #region Property
    public loader: ExtraLoaders;

    public hooks: ExtraHooks;
    // #endregion

    // #region Public
    constructor(createService: (apiInstance?: AxiosInstance) => SpecHomePage1810Service)
    {
        super(createService);
        this.loader = this.buildLoaderGroup();
        this.hooks = this.buildHookGroup();
    }
    // #endregion

    // #region Private
    /** 建立 1810 首頁 loader 群組。 */
    private buildLoaderGroup(): ExtraLoaders
    {
        const createInitialDataLoader: ExtraLoaders["createInitialDataLoader"] = (opt) => this.createApiLoader<HomePageInitialArgs, SpecHomePageInitialDataDTO[]>({
            action: "SpecHomePage1810.GetInitialData",
            getArgs: () => this.buildInitialArgs(),
            call: (svc) => svc.getInitialDataAsync(),
            getApiInstance: opt?.getApiInstance,
        });

        return { createInitialDataLoader };
    }

    /** 建立 1810 首頁 hook 群組。 */
    private buildHookGroup(): ExtraHooks
    {
        const useInitialData: ExtraHooks["useInitialData"] = (opt) => this.useInitialData(opt);

        return { useInitialData };
    }

    /** 取得首頁初始化資料 hook。 */
    private useInitialData(opt?: IUseInitialData): HomePageInitialHookResult
    {
        const args = useMemo<HomePageInitialArgs>(() => this.buildInitialArgs(), []);
        const query = this.useApiQuery<HomePageInitialArgs, SpecHomePageInitialDataDTO[]>({
            action: "SpecHomePage1810.GetInitialData",
            args,
            initial: opt?.initial ?? null,
            call: (svc) => svc.getInitialDataAsync(),
            fallbackError: "查詢 1810 首頁初始化資料失敗",
            deps: opt?.deps ?? [],
            onError: opt?.onError,
            apiInstance: opt?.apiInstance,
        });
        const list = useMemo<SpecHomePageInitialDataDTO[]>(() => query.data ?? [], [query.data]);
        const initialData = useMemo<SpecHomePageInitialDataDTO | null>(() => pickFirst(list), [list]);

        return { ...query, data: initialData, initialData, list };
    }

    /** 建立首頁初始化查詢參數。 */
    private buildInitialArgs(): HomePageInitialArgs
    {
        // return
        return {};
    }
    // #endregion
}

export const SpecHomePage1810Adapter = (apiInstance?: AxiosInstance) =>
{
    return new SpecHomePage1810AdapterImpl((api?: AxiosInstance) => new SpecHomePage1810Service(api ?? apiInstance));
};
// #endregion

// #region Private
/** 取第一筆首頁初始化資料。 */
const pickFirst = (data?: SpecHomePageInitialDataDTO[] | null): SpecHomePageInitialDataDTO | null =>
{
    // return
    return data?.[0] ?? null;
};
// #endregion
