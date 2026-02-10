import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

export class SpecJournalService extends ApiDataService<SpecJournalSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecJournal, apiInstance);
    }
}
export const SpecJournalAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecJournalSet, SpecJournalService>((api?: AxiosInstance) =>
        new SpecJournalService(api ?? apiInstance)
    );
