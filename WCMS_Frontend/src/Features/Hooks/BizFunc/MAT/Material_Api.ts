import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type MaterialFormModel = components["schemas"]["Material"];
// #endregion

// #region Public
export class MaterialService extends ApiDataService<MaterialFormModel>
{
    // #region Public
    /** 建立 Material API Service。 */
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Material, apiInstance);
    }
    // #endregion
}
export class MaterialAdapterImpl extends ApiDataAdapter<MaterialFormModel, MaterialService>
{}
/** 建立 Material API Adapter。 */
export const MaterialAdapter = (apiInstance?: AxiosInstance) => new MaterialAdapterImpl((api?: AxiosInstance) => new MaterialService(api ?? apiInstance));
// #endregion
