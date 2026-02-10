import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
class SpecCategoryService extends ApiDataService<SpecCategorySet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecCategory, apiInstance);
    }
    async getShowColumnItems(): Promise<ApiResponse<Record<string, string>[]>>
    {
        return await this.CallApi<Record<string, string>[]>(() =>
            this.Api.get<ApiResponse<Record<string, string>[]>>(`${this.Module}/GetShowColumnItems`)
        );
    }
}
export const SpecCategoryAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecCategorySet, SpecCategoryService>(
        (api?: AxiosInstance) => new SpecCategoryService(api ?? apiInstance),
    );
