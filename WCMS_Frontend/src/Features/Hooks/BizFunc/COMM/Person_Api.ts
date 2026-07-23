import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";

// #region Property
type PersonFormModel = components["schemas"]["Person"];
// #endregion

// #region Public
export class PersonService extends ApiDataService<PersonFormModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Person, apiInstance);
    }
    // #endregion
}
export class PersonAdapterImpl extends ApiDataAdapter<PersonFormModel, PersonService>
{}
export const PersonAdapter = (apiInstance?: AxiosInstance) => new PersonAdapterImpl((api?: AxiosInstance) => new PersonService(api ?? apiInstance));
// #endregion
