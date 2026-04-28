import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
class MaterialService extends ApiDataService<MaterialSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Material, apiInstance);
    }
}
export const MaterialAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<MaterialSet, MaterialService>((api?: AxiosInstance) => new MaterialService(api ?? apiInstance));
