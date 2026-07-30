import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type SpecJournalIndexFormModel = components["schemas"]["SpecJournalIndex"];
// #endregion

// #region Public
export class SpecJournalIndexService extends ApiDataService<SpecJournalIndexFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SpecJournalIndex, apiInstance);
    }
    // #endregion
}

export const SpecJournalIndexAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<SpecJournalIndexFormModel, SpecJournalIndexService>((api?: AxiosInstance) => new SpecJournalIndexService(api ?? apiInstance));
// #endregion
