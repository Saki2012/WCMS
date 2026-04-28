import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

class SpecMusicalService extends ApiDataService<SpecMusicalSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecMusical, apiInstance);
    }
}
export const SpecMusicalAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecMusicalSet, SpecMusicalService>((api?: AxiosInstance) => new SpecMusicalService(api ?? apiInstance));
