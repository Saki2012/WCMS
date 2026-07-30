import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecMusicalFormModel = components["schemas"]["SpecMusical"];
// #endregion

// #region Public
class SpecMusicalService extends ApiDataService<SpecMusicalFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecMusical, apiInstance);
    }
    // #endregion
}

export const SpecMusicalAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecMusicalFormModel, SpecMusicalService>((api?: AxiosInstance) => new SpecMusicalService(api ?? apiInstance));
// #endregion
