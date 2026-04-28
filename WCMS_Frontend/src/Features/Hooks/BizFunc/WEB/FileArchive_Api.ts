import { ApiDataAdapter } from "@/SysCore/Utils/API/APIAdapter";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
class FileArchiveService extends ApiDataService<FileArchiveSet>
{
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.FileArchive, apiInstance);
    }
}
export const FileArchiveAdapter = (apiInstance?: AxiosInstance) =>
    new ApiDataAdapter<FileArchiveSet, FileArchiveService>((api?: AxiosInstance) => new FileArchiveService(api ?? apiInstance));
