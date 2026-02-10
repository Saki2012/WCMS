import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];

class SpecResearchService extends ApiDataService<SpecResearchSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecResearch, apiInstance);
    }
}
export const SpecResearchAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecResearchSet, SpecResearchService>(
        (api?: AxiosInstance) => new SpecResearchService(api ?? apiInstance),
    );
