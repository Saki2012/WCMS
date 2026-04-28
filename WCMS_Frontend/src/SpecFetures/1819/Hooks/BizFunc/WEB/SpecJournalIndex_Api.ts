import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];

export class SpecJournalIndexService extends ApiDataService<SpecJournalIndexSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecJournalIndex, apiInstance);
    }
}
export const SpecJournalIndexAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecJournalIndexSet, SpecJournalIndexService>((api?: AxiosInstance) => new SpecJournalIndexService(api ?? apiInstance));
