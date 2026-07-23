import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecResearchFormModel = components["schemas"]["SpecResearch"];
// #endregion

// #region Public
class SpecResearchService extends ApiDataService<SpecResearchFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecResearch, apiInstance);
    }
    // #endregion
}

class SpecResearchAdapterImpl extends ApiDataAdapter<SpecResearchFormModel, SpecResearchService>
{}


export const SpecResearchAdapter = (apiInstance?: AxiosInstance) =>
    new SpecResearchAdapterImpl((api?: AxiosInstance) => new SpecResearchService(api ?? apiInstance));
// #endregion
