// ✅ 自動產生，請勿手動修改

export const AccountStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type AccountStatusFieldKey = keyof typeof AccountStatusFields;

export const AnnouncementFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  AnnouncementId: 'AnnouncementId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  PictureId: 'PictureId',
  PicDescription: 'PicDescription',
  ViewCount: 'ViewCount',
  AnnouncementDetail: 'AnnouncementDetail',
} as const;

export type AnnouncementFieldKey = keyof typeof AnnouncementFields;

export const AnnouncementDetailFields = {
  RowState: 'RowState',
  AnnouncementId: 'AnnouncementId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  SubTitle: 'SubTitle',
  Content: 'Content',
  Url: 'Url',
} as const;

export type AnnouncementDetailFieldKey = keyof typeof AnnouncementDetailFields;

export const AnnouncementDetailFileFields = {
  RowState: 'RowState',
  AnnouncementId: 'AnnouncementId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  FileId: 'FileId',
} as const;

export type AnnouncementDetailFileFieldKey = keyof typeof AnnouncementDetailFileFields;

export const AnnouncementSetFields = {
  Announcement: 'Announcement',
  AnnouncementDetail: 'AnnouncementDetail',
  AnnouncementDetailFile: 'AnnouncementDetailFile',
} as const;

export type AnnouncementSetFieldKey = keyof typeof AnnouncementSetFields;

export const AnnouncementSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type AnnouncementSetApiRequestFieldKey = keyof typeof AnnouncementSetApiRequestFields;

export const BannerFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  BannerId: 'BannerId',
  BannerCategoryName: 'BannerCategoryName',
  Interval: 'Interval',
  Speed: 'Speed',
  Height: 'Height',
  Width: 'Width',
  Effect: 'Effect',
} as const;

export type BannerFieldKey = keyof typeof BannerFields;

export const BannerDetailFields = {
  RowState: 'RowState',
  BannerId: 'BannerId',
  RowId: 'RowId',
  PicSrcId: 'PicSrcId',
  FontColor: 'FontColor',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  Sort: 'Sort',
} as const;

export type BannerDetailFieldKey = keyof typeof BannerDetailFields;

export const BannerDetailInfoFields = {
  RowState: 'RowState',
  BannerId: 'BannerId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
  URL_Open: 'URL_Open',
} as const;

export type BannerDetailInfoFieldKey = keyof typeof BannerDetailInfoFields;

export const BannerSetFields = {
  Banner: 'Banner',
  BannerDetail: 'BannerDetail',
  BannerDetailInfo: 'BannerDetailInfo',
} as const;

export type BannerSetFieldKey = keyof typeof BannerSetFields;

export const BannerSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type BannerSetApiRequestFieldKey = keyof typeof BannerSetApiRequestFields;

export const CategoryFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  CategoryId: 'CategoryId',
  ProgId: 'ProgId',
  CategoryDetail: 'CategoryDetail',
} as const;

export type CategoryFieldKey = keyof typeof CategoryFields;

export const CategoryDataSetFields = {
  Category: 'Category',
  CategoryDetail: 'CategoryDetail',
} as const;

export type CategoryDataSetFieldKey = keyof typeof CategoryDataSetFields;

export const CategoryDataSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type CategoryDataSetApiRequestFieldKey = keyof typeof CategoryDataSetApiRequestFields;

export const CategoryDetailFields = {
  RowState: 'RowState',
  CategoryId: 'CategoryId',
  RowId: 'RowId',
  Lang: 'Lang',
  CategoryName: 'CategoryName',
} as const;

export type CategoryDetailFieldKey = keyof typeof CategoryDetailFields;

export const ContentStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type ContentStatusFieldKey = keyof typeof ContentStatusFields;

export const CreateUserDtoFields = {
  UserId: 'UserId',
  UserName: 'UserName',
  Password: 'Password',
  Email: 'Email',
} as const;

export type CreateUserDtoFieldKey = keyof typeof CreateUserDtoFields;

export const DataStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type DataStatusFieldKey = keyof typeof DataStatusFields;

export const EndTypeFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type EndTypeFieldKey = keyof typeof EndTypeFields;

export const FileArchiveFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  FileArchiveId: 'FileArchiveId',
  ContentStatus: 'ContentStatus',
  CategoriesId: 'CategoriesId',
  TagsId: 'TagsId',
} as const;

export type FileArchiveFieldKey = keyof typeof FileArchiveFields;

export const FileArchiveDetailFields = {
  RowState: 'RowState',
  FileArchiveId: 'FileArchiveId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  FileSrcId: 'FileSrcId',
  FileName: 'FileName',
} as const;

export type FileArchiveDetailFieldKey = keyof typeof FileArchiveDetailFields;

export const FileArchiveInfoFields = {
  RowState: 'RowState',
  FileArchiveId: 'FileArchiveId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
} as const;

export type FileArchiveInfoFieldKey = keyof typeof FileArchiveInfoFields;

export const FileArchiveSetFields = {
  FileArchive: 'FileArchive',
  FileArchiveInfo: 'FileArchiveInfo',
  FileArchiveDetail: 'FileArchiveDetail',
} as const;

export type FileArchiveSetFieldKey = keyof typeof FileArchiveSetFields;

export const FileArchiveSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileArchiveSetApiRequestFieldKey = keyof typeof FileArchiveSetApiRequestFields;

export const FileManageModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  InternalId: 'InternalId',
  Path: 'Path',
  FileName: 'FileName',
  FileExtension: 'FileExtension',
  FileDescription: 'FileDescription',
  MimeType: 'MimeType',
  FileSHA256: 'FileSHA256',
  FileSize: 'FileSize',
  ProgId: 'ProgId',
  ImportLabel: 'ImportLabel',
  FileStatus: 'FileStatus',
  DownloadCount: 'DownloadCount',
  File_DownloadInfo: 'File_DownloadInfo',
  File_SyncInfo: 'File_SyncInfo',
} as const;

export type FileManageModelFieldKey = keyof typeof FileManageModelFields;

export const FileManageSetFields = {
  FileManage: 'FileManage',
  FileManage_DownloadInfo: 'FileManage_DownloadInfo',
  FileManage_SyncInfo: 'FileManage_SyncInfo',
} as const;

export type FileManageSetFieldKey = keyof typeof FileManageSetFields;

export const FileManageSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type FileManageSetApiRequestFieldKey = keyof typeof FileManageSetApiRequestFields;

export const FileManage_DownloadInfoModelFields = {
  RowState: 'RowState',
  InternalId: 'InternalId',
  RowId: 'RowId',
  DownloadUserIP: 'DownloadUserIP',
  UserAgent: 'UserAgent',
  RefererURL: 'RefererURL',
  DownloadStatus: 'DownloadStatus',
  DownloadTime: 'DownloadTime',
} as const;

export type FileManage_DownloadInfoModelFieldKey = keyof typeof FileManage_DownloadInfoModelFields;

export const FileManage_SyncInfoModelFields = {
  RowState: 'RowState',
  InternalId: 'InternalId',
  RowId: 'RowId',
  FileStatus: 'FileStatus',
  SrcIP: 'SrcIP',
  SrcNode: 'SrcNode',
  SrcFullPath: 'SrcFullPath',
  DestIP: 'DestIP',
  DestNode: 'DestNode',
  DestFullPath: 'DestFullPath',
  ErrorCode: 'ErrorCode',
  ErrorMessage: 'ErrorMessage',
  ExecuteTime: 'ExecuteTime',
} as const;

export type FileManage_SyncInfoModelFieldKey = keyof typeof FileManage_SyncInfoModelFields;

export const FileStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type FileStatusFieldKey = keyof typeof FileStatusFields;

export const FormStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type FormStatusFieldKey = keyof typeof FormStatusFields;

export const GalleryFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  GalleryId: 'GalleryId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  CoverPicSrcId: 'CoverPicSrcId',
  Sort: 'Sort',
} as const;

export type GalleryFieldKey = keyof typeof GalleryFields;

export const GalleryInfoFields = {
  RowState: 'RowState',
  GalleryId: 'GalleryId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type GalleryInfoFieldKey = keyof typeof GalleryInfoFields;

export const GalleryPhotosFields = {
  RowState: 'RowState',
  GalleryId: 'GalleryId',
  RowId: 'RowId',
  PicSrcId: 'PicSrcId',
  Sort: 'Sort',
} as const;

export type GalleryPhotosFieldKey = keyof typeof GalleryPhotosFields;

export const GalleryPhotosInfoFields = {
  RowState: 'RowState',
  GalleryId: 'GalleryId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
} as const;

export type GalleryPhotosInfoFieldKey = keyof typeof GalleryPhotosInfoFields;

export const GallerySetFields = {
  Gallery: 'Gallery',
  GalleryInfo: 'GalleryInfo',
  GalleryPhotos: 'GalleryPhotos',
  GalleryPhotosInfo: 'GalleryPhotosInfo',
} as const;

export type GallerySetFieldKey = keyof typeof GallerySetFields;

export const GallerySetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type GallerySetApiRequestFieldKey = keyof typeof GallerySetApiRequestFields;

export const LoginDtoFields = {
  Account: 'Account',
  Password: 'Password',
} as const;

export type LoginDtoFieldKey = keyof typeof LoginDtoFields;

export const PageManagementFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  PageId: 'PageId',
  CategoryId: 'CategoryId',
  ViewCount: 'ViewCount',
  PageManagementDetail: 'PageManagementDetail',
} as const;

export type PageManagementFieldKey = keyof typeof PageManagementFields;

export const PageManagementDetailFields = {
  RowState: 'RowState',
  PageId: 'PageId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type PageManagementDetailFieldKey = keyof typeof PageManagementDetailFields;

export const PageManagementSetFields = {
  PageManagement: 'PageManagement',
  PageManagementDetail: 'PageManagementDetail',
} as const;

export type PageManagementSetFieldKey = keyof typeof PageManagementSetFields;

export const PageManagementSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type PageManagementSetApiRequestFieldKey = keyof typeof PageManagementSetApiRequestFields;

export const PermissionModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  UserId: 'UserId',
  RoleId: 'RoleId',
  User: 'User',
  Role: 'Role',
} as const;

export type PermissionModelFieldKey = keyof typeof PermissionModelFields;

export const QueryListParamFields = {
  Fields: 'Fields',
  Condition: 'Condition',
  PageNumber: 'PageNumber',
  PageSize: 'PageSize',
} as const;

export type QueryListParamFieldKey = keyof typeof QueryListParamFields;

export const RoleModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  RoleId: 'RoleId',
  RoleName: 'RoleName',
  EndType: 'EndType',
  IsAdmin: 'IsAdmin',
  UserRoles: 'UserRoles',
} as const;

export type RoleModelFieldKey = keyof typeof RoleModelFields;

export const RowStateFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type RowStateFieldKey = keyof typeof RowStateFields;

export const SpecCategoryDetailModelFields = {
  RowState: 'RowState',
  CategoryId: 'CategoryId',
  RowId: 'RowId',
  Lang: 'Lang',
  CategoryName: 'CategoryName',
} as const;

export type SpecCategoryDetailModelFieldKey = keyof typeof SpecCategoryDetailModelFields;

export const SpecCategoryModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  CategoryId: 'CategoryId',
  ProgId: 'ProgId',
  ShowColumnItems: 'ShowColumnItems',
} as const;

export type SpecCategoryModelFieldKey = keyof typeof SpecCategoryModelFields;

export const SpecCategorySetFields = {
  SpecCategory: 'SpecCategory',
  SpecCategoryDetail: 'SpecCategoryDetail',
} as const;

export type SpecCategorySetFieldKey = keyof typeof SpecCategorySetFields;

export const SpecCategorySetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecCategorySetApiRequestFieldKey = keyof typeof SpecCategorySetApiRequestFields;

export const SpecResearchDetailModelFields = {
  RowState: 'RowState',
  ResearchId: 'ResearchId',
  RowId: 'RowId',
  Lang: 'Lang',
  Year: 'Year',
  AcademicYear: 'AcademicYear',
  Semester: 'Semester',
  DuringExecution: 'DuringExecution',
  ContractPeriod: 'ContractPeriod',
  ClassTime: 'ClassTime',
  ProjectLeader: 'ProjectLeader',
  Name: 'Name',
  TeachingStaffOfOurSchool: 'TeachingStaffOfOurSchool',
  ApprovalNumber: 'ApprovalNumber',
  ApprovedAmount: 'ApprovedAmount',
  College: 'College',
  Department: 'Department',
  GraduationDegree: 'GraduationDegree',
  CooperatingUnits: 'CooperatingUnits',
  CooperationProject: 'CooperationProject',
  Courses: 'Courses',
  ProjectName: 'ProjectName',
  PaperTitle: 'PaperTitle',
  Remark: 'Remark',
  Cohost1: 'Cohost1',
  Cohost2: 'Cohost2',
  Commissioned: 'Commissioned',
  PlanAmount: 'PlanAmount',
  PlanContent: 'PlanContent',
} as const;

export type SpecResearchDetailModelFieldKey = keyof typeof SpecResearchDetailModelFields;

export const SpecResearchModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  ResearchId: 'ResearchId',
  CategoryId: 'CategoryId',
  ContentStatus: 'ContentStatus',
  Tags: 'Tags',
} as const;

export type SpecResearchModelFieldKey = keyof typeof SpecResearchModelFields;

export const SpecResearchSetFields = {
  SpecResearch: 'SpecResearch',
  SpecResearchDetail: 'SpecResearchDetail',
} as const;

export type SpecResearchSetFieldKey = keyof typeof SpecResearchSetFields;

export const SpecResearchSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecResearchSetApiRequestFieldKey = keyof typeof SpecResearchSetApiRequestFields;

export const SpecUSRDetailFields = {
  RowState: 'RowState',
  USRId: 'USRId',
  RowId: 'RowId',
  Lang: 'Lang',
  Year: 'Year',
  AcademicYear: 'AcademicYear',
  Courses: 'Courses',
  PracticeField: 'PracticeField',
  ProjectName: 'ProjectName',
  ExternalCooperationUnit: 'ExternalCooperationUnit',
  Department: 'Department',
  DuringExecution: 'DuringExecution',
  PlanAmount: 'PlanAmount',
  ExecutionStrategy: 'ExecutionStrategy',
  ContentIntroduction: 'ContentIntroduction',
  ProjectConcept: 'ProjectConcept',
  ProjectHighlights: 'ProjectHighlights',
  ProjectLeader: 'ProjectLeader',
  Cohost1: 'Cohost1',
  Cohost2: 'Cohost2',
  Commissioned: 'Commissioned',
  Remark: 'Remark',
} as const;

export type SpecUSRDetailFieldKey = keyof typeof SpecUSRDetailFields;

export const SpecUSRModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  USRId: 'USRId',
  CategoryId: 'CategoryId',
  ContentStatus: 'ContentStatus',
  Tags: 'Tags',
  PictureId: 'PictureId',
  PicDescription: 'PicDescription',
} as const;

export type SpecUSRModelFieldKey = keyof typeof SpecUSRModelFields;

export const SpecUSRSetFields = {
  SpecUSR: 'SpecUSR',
  SpecUSRDetail: 'SpecUSRDetail',
} as const;

export type SpecUSRSetFieldKey = keyof typeof SpecUSRSetFields;

export const SpecUSRSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type SpecUSRSetApiRequestFieldKey = keyof typeof SpecUSRSetApiRequestFields;

export const TagDataFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  TagId: 'TagId',
  ProgId: 'ProgId',
  TagDetail: 'TagDetail',
} as const;

export type TagDataFieldKey = keyof typeof TagDataFields;

export const TagDetailFields = {
  RowState: 'RowState',
  TagId: 'TagId',
  RowId: 'RowId',
  Lang: 'Lang',
  TagName: 'TagName',
} as const;

export type TagDetailFieldKey = keyof typeof TagDetailFields;

export const TagSetFields = {
  TagData: 'TagData',
  TagDetail: 'TagDetail',
} as const;

export type TagSetFieldKey = keyof typeof TagSetFields;

export const TagSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type TagSetApiRequestFieldKey = keyof typeof TagSetApiRequestFields;

export const UserModelFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  UserId: 'UserId',
  UserName: 'UserName',
  Email: 'Email',
  PasswordHash: 'PasswordHash',
  PasswordSalt: 'PasswordSalt',
  PasswordAlgoVer: 'PasswordAlgoVer',
  AccountStatus: 'AccountStatus',
  UserRoles: 'UserRoles',
} as const;

export type UserModelFieldKey = keyof typeof UserModelFields;

export const UserSetFields = {
  User: 'User',
} as const;

export type UserSetFieldKey = keyof typeof UserSetFields;

export const UserSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type UserSetApiRequestFieldKey = keyof typeof UserSetApiRequestFields;

export const WebResourceFields = {
  CreateTime: 'CreateTime',
  CreateUserId: 'CreateUserId',
  ModifyTime: 'ModifyTime',
  ModifyUserId: 'ModifyUserId',
  FormStatus: 'FormStatus',
  DataStatus: 'DataStatus',
  InvalidTime: 'InvalidTime',
  InvalidUserId: 'InvalidUserId',
  InternalId: 'InternalId',
  OrgLvId: 'OrgLvId',
  IsIniData: 'IsIniData',
  DataVersion: 'DataVersion',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  WebResourceId: 'WebResourceId',
  Categories: 'Categories',
  Tags: 'Tags',
  ContentStatus: 'ContentStatus',
  PicId: 'PicId',
  PicDescription: 'PicDescription',
} as const;

export type WebResourceFieldKey = keyof typeof WebResourceFields;

export const WebResourceInfoFields = {
  RowState: 'RowState',
  WebResourceId: 'WebResourceId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
  ResUrl: 'ResUrl',
  Url_OpenType: 'Url_OpenType',
} as const;

export type WebResourceInfoFieldKey = keyof typeof WebResourceInfoFields;

export const WebResourceSetFields = {
  WebResource: 'WebResource',
  WebResourceInfo: 'WebResourceInfo',
} as const;

export type WebResourceSetFieldKey = keyof typeof WebResourceSetFields;

export const WebResourceSetApiRequestFields = {
  InternalId: 'InternalId',
  Data: 'Data',
} as const;

export type WebResourceSetApiRequestFieldKey = keyof typeof WebResourceSetApiRequestFields;

