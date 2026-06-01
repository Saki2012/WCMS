import type { Editor as TinyMCEEditor } from "tinymce";

export type TinySetup = { setup: (editor: TinyMCEEditor) => void; };
export type TinyMceFileKind = "file" | "image";
export type TinyMceResolveFileUrl = (internalId: string, kind: TinyMceFileKind) => string;
export type TinyMceUploadResult = { isSuccess: boolean; internalId: string; name?: string; };
export type TinyMceUploadFile = (file: File) => Promise<TinyMceUploadResult>;
export type { TinyMCEEditor };
