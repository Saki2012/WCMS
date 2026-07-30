import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecUSRFormModel = components["schemas"]["SpecUSR"];
// #endregion

// #region Public
class SpecUSRService extends ApiDataService<SpecUSRFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecUSR, apiInstance);
    }
    // #endregion
}

export const SpecUSRAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecUSRFormModel, SpecUSRService>((api?: AxiosInstance) => new SpecUSRService(api ?? apiInstance));
// #endregion
