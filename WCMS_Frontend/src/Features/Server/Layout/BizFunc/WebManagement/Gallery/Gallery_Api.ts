import { IApiProvider, IDataProvider } from "../../../../../../SysCore/Interface/IApiProvider";
import type { ApiResponse, QueryListCondition } from "../../../../../../SysCore/Interface/IApiProvider";
import { BaseApiService } from "../../../../../../SysCore/Utils/API/APIClient";
import type { components } from "../../../../../../types/api";
import type { ModelDisplaySchema } from "../../../../../../types/IApiSchema";
type GallerySet = components["schemas"]["GallerySet_DTO"];

abstract class IGalleryProvider extends IDataProvider<GallerySet>
{}
class MockProvider extends IGalleryProvider
{
    protected doCreateData(
        set?: {
            Gallery?: components["schemas"]["Gallery_DTO"];
            GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
            GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
            GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
        } | undefined,
    ): Promise<
        ApiResponse<
            {
                Gallery?: components["schemas"]["Gallery_DTO"];
                GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
                GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
                GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doUpdateData(
        internaId: string,
        set: {
            Gallery?: components["schemas"]["Gallery_DTO"];
            GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
            GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
            GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
        },
    ): Promise<
        ApiResponse<
            {
                Gallery?: components["schemas"]["Gallery_DTO"];
                GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
                GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
                GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doDelete(
        internaId: string,
    ): Promise<
        ApiResponse<
            {
                Gallery?: components["schemas"]["Gallery_DTO"];
                GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
                GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
                GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doInvalid(
        internaId: string,
        isInvalid: boolean,
    ): Promise<
        ApiResponse<
            {
                Gallery?: components["schemas"]["Gallery_DTO"];
                GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
                GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
                GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchData(
        internaId?: string,
    ): Promise<
        ApiResponse<
            {
                Gallery?: components["schemas"]["Gallery_DTO"];
                GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
                GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
                GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
            }
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchList(
        condition?: QueryListCondition,
    ): Promise<
        ApiResponse<
            {
                Gallery?: components["schemas"]["Gallery_DTO"];
                GalleryInfo?: components["schemas"]["GalleryInfo_DTO"][] | null;
                GalleryPhotos?: components["schemas"]["GalleryPhotos_DTO"][] | null;
                GalleryPhotosInfo?: components["schemas"]["GalleryPhotosInfo_DTO"][] | null;
            }[]
        >
    >
    {
        throw new Error("Method not implemented.");
    }
    protected doFetchListCount(condition?: QueryListCondition): Promise<ApiResponse<number>>
    {
        throw new Error("Method not implemented.");
    }
    protected doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        throw new Error("Method not implemented.");
    }
}
class APIProvider extends IGalleryProvider
{
    private readonly ModuleName = "Gallery";
    private readonly API = new BaseApiService<GallerySet>(this.ModuleName);

    protected async doCreateData(set: GallerySet): Promise<ApiResponse<GallerySet>>
    {
        const res = await this.API.create(set);
        return res.data;
    }
    protected async doUpdateData(internaId: string, set: GallerySet): Promise<ApiResponse<GallerySet>>
    {
        const res = await this.API.update(internaId, set);
        return res.data;
    }
    protected async doDelete(internaId: string): Promise<ApiResponse<GallerySet>>
    {
        const res = await this.API.delete(internaId);
        return res.data;
    }
    protected async doInvalid(internaId: string, isInvalid: boolean): Promise<ApiResponse<GallerySet>>
    {
        const res = await this.API.invalid(internaId, isInvalid);
        return res.data;
    }
    protected async doFetchData(internaId: string): Promise<ApiResponse<GallerySet>>
    {
        const res = await this.API.queryData(internaId);
        return res.data;
    }
    protected async doFetchList(condition: QueryListCondition): Promise<ApiResponse<GallerySet[]>>
    {
        const res = await this.API.queryList(condition);
        return res.data;
    }
    protected async doFetchListCount(condition: QueryListCondition): Promise<ApiResponse<number>>
    {
        const res = await this.API.queryCount(condition);
        return res.data;
    }
    protected async doGetModelDisplayName(): Promise<ModelDisplaySchema>
    {
        const res = await this.API.getModelDisplayName();
        return res;
    }
}
const GalleryProvider = (): IGalleryProvider => IApiProvider<IGalleryProvider>(APIProvider, MockProvider);
export default GalleryProvider;
