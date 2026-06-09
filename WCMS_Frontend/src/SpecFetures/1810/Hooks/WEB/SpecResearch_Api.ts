import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
// #endregion

// #region Public
class SpecResearchService extends ApiDataService<SpecResearchSet>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecResearch, apiInstance);
    }
    // #endregion
}

class SpecResearchAdapterImpl extends ApiDataAdapter<SpecResearchSet, SpecResearchService>
{}


export const SpecResearchAdapter = (apiInstance?: AxiosInstance) =>
    new SpecResearchAdapterImpl((api?: AxiosInstance) => new SpecResearchService(api ?? apiInstance));
// #endregion
