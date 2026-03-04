import type { Lang } from "@/SysCore/i18n/lang";
import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";

type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

class SpecResearchService extends ApiDataService<SpecResearchSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecResearch, apiInstance);
    }
}

export const SpecResearchAdapter = (apiInstance?: AxiosInstance) =>{
 
    const adapter = new ApiDataAdapter<SpecResearchSet, SpecResearchService>(
        (api?: AxiosInstance) => new SpecResearchService(api ?? apiInstance),
    );

    return adapter
}
