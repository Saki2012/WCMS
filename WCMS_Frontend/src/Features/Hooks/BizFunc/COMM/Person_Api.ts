import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type PersonSet = components["schemas"]["PersonSet_DTO"];

class PersonService extends ApiDataService<PersonSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Person, apiInstance);
    }
}
export const PersonAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<PersonSet, PersonService>((api?: AxiosInstance) => new PersonService(api ?? apiInstance));
