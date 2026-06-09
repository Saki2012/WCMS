import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
// #endregion

// #region Public
export class MaterialService extends ApiDataService<MaterialSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Material, apiInstance);
    }
    // #endregion
}
export class MatCategoryAdapterImpl extends ApiDataAdapter<MaterialSet, MaterialService>
{}
export const MaterialAdapter = (apiInstance?: AxiosInstance) => new MatCategoryAdapterImpl((api?: AxiosInstance) => new MaterialService(api ?? apiInstance));
// #endregion
