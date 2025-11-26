import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFileArchiveOptions } from "@/Features/Pages/Client/BizFunc/WebManagement/FileArchive/FileArchiveList";

interface FileArchiveProps { Theme: IFETheme; Lang: Lang; Options: IFileArchiveOptions; }
export const FileArchiveList = (props: FileArchiveProps) => { return (<></>) };
