// ✅ 自動產生，請勿手動修改

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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  AnnouncementId: 'AnnouncementId',
  Categories: 'Categories',
  Tags: 'Tags',
  Statuses: 'Statuses',
  PictureId: 'PictureId',
  PicDescription: 'PicDescription',
  ViewCount: 'ViewCount',
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
  Row: 'Row',
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
  UID: 'UID',
  Set: 'Set',
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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  BannerId: 'BannerId',
  CategoryId: 'CategoryId',
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
  URL_Open: 'URL_Open',
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
} as const;

export type BannerDetailInfoFieldKey = keyof typeof BannerDetailInfoFields;

export const BannerSetFields = {
  Banner: 'Banner',
  BannerDetail: 'BannerDetail',
  BannerDetailInfo: 'BannerDetailInfo',
} as const;

export type BannerSetFieldKey = keyof typeof BannerSetFields;

export const BannerSetApiRequestFields = {
  UID: 'UID',
  Set: 'Set',
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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  CategoryId: 'CategoryId',
  ProgId: 'ProgId',
} as const;

export type CategoryFieldKey = keyof typeof CategoryFields;

export const CategoryDataSetFields = {
  Category: 'Category',
  CategoryDetail: 'CategoryDetail',
} as const;

export type CategoryDataSetFieldKey = keyof typeof CategoryDataSetFields;

export const CategoryDataSetApiRequestFields = {
  UID: 'UID',
  Set: 'Set',
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

export const DataStatusFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type DataStatusFieldKey = keyof typeof DataStatusFields;

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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  FileArchiveId: 'FileArchiveId',
  Status: 'Status',
  CategoriesId: 'CategoriesId',
  TagsId: 'TagsId',
} as const;

export type FileArchiveFieldKey = keyof typeof FileArchiveFields;

export const FileArchiveDetailFields = {
  RowState: 'RowState',
  FileArchiveId: 'FileArchiveId',
  ParentRowId: 'ParentRowId',
  RowId: 'RowId',
  FileName: 'FileName',
  FileSrcId: 'FileSrcId',
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
  UID: 'UID',
  Set: 'Set',
} as const;

export type FileArchiveSetApiRequestFieldKey = keyof typeof FileArchiveSetApiRequestFields;

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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  GalleryId: 'GalleryId',
  CategoriesId: 'CategoriesId',
  TagsId: 'TagsId',
  Status: 'Status',
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
  IsCovered: 'IsCovered',
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
  UID: 'UID',
  Set: 'Set',
} as const;

export type GallerySetApiRequestFieldKey = keyof typeof GallerySetApiRequestFields;

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
  UID: 'UID',
  Set: 'Set',
} as const;

export type PageManagementSetApiRequestFieldKey = keyof typeof PageManagementSetApiRequestFields;

export const QueryListParamFields = {
  Fields: 'Fields',
  Condition: 'Condition',
  PageNumber: 'PageNumber',
  PageSize: 'PageSize',
} as const;

export type QueryListParamFieldKey = keyof typeof QueryListParamFields;

export const RowStateFields = {
  toString: 'toString',
  toFixed: 'toFixed',
  toExponential: 'toExponential',
  toPrecision: 'toPrecision',
  valueOf: 'valueOf',
  toLocaleString: 'toLocaleString',
} as const;

export type RowStateFieldKey = keyof typeof RowStateFields;

export const SpecResearchFields = {
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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  ResearchId: 'ResearchId',
  CategoryId: 'CategoryId',
  Interval: 'Interval',
  Speed: 'Speed',
  Height: 'Height',
  Width: 'Width',
  Effect: 'Effect',
} as const;

export type SpecResearchFieldKey = keyof typeof SpecResearchFields;

export const SpecResearchDetailFields = {
  RowState: 'RowState',
  ResearchId: 'ResearchId',
  RowId: 'RowId',
  PicSrcId: 'PicSrcId',
  FontColor: 'FontColor',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  URL_Open: 'URL_Open',
  Sort: 'Sort',
} as const;

export type SpecResearchDetailFieldKey = keyof typeof SpecResearchDetailFields;

export const SpecResearchSetFields = {
  MasterData: 'MasterData',
  Details: 'Details',
} as const;

export type SpecResearchSetFieldKey = keyof typeof SpecResearchSetFields;

export const SpecResearchSetApiRequestFields = {
  UID: 'UID',
  Set: 'Set',
} as const;

export type SpecResearchSetApiRequestFieldKey = keyof typeof SpecResearchSetApiRequestFields;

export const SpecUSRFields = {
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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  USRId: 'USRId',
  CategoryId: 'CategoryId',
  Interval: 'Interval',
  Speed: 'Speed',
  Height: 'Height',
  Width: 'Width',
  Effect: 'Effect',
} as const;

export type SpecUSRFieldKey = keyof typeof SpecUSRFields;

export const SpecUSRDetailFields = {
  RowState: 'RowState',
  USRId: 'USRId',
  RowId: 'RowId',
  PicSrcId: 'PicSrcId',
  FontColor: 'FontColor',
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  URL_Open: 'URL_Open',
  Sort: 'Sort',
} as const;

export type SpecUSRDetailFieldKey = keyof typeof SpecUSRDetailFields;

export const SpecUSRSetFields = {
  MasterData: 'MasterData',
  Details: 'Details',
} as const;

export type SpecUSRSetFieldKey = keyof typeof SpecUSRSetFields;

export const SpecUSRSetApiRequestFields = {
  UID: 'UID',
  Set: 'Set',
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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  TagId: 'TagId',
  ProgId: 'ProgId',
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
  UID: 'UID',
  Set: 'Set',
} as const;

export type TagSetApiRequestFieldKey = keyof typeof TagSetApiRequestFields;

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
  Validate_Start: 'Validate_Start',
  Validate_End: 'Validate_End',
  WebResourceId: 'WebResourceId',
  CategoriesId: 'CategoriesId',
  TagsId: 'TagsId',
  Status: 'Status',
  SrcType: 'SrcType',
  SrcData: 'SrcData',
  ResUrl: 'ResUrl',
  Url_OpenType: 'Url_OpenType',
  Sort: 'Sort',
} as const;

export type WebResourceFieldKey = keyof typeof WebResourceFields;

export const WebResourceInfoFields = {
  RowState: 'RowState',
  WebResourceId: 'WebResourceId',
  RowId: 'RowId',
  Lang: 'Lang',
  Title: 'Title',
  Content: 'Content',
} as const;

export type WebResourceInfoFieldKey = keyof typeof WebResourceInfoFields;

export const WebResourceSetFields = {
  WebResource: 'WebResource',
  WebResourceInfo: 'WebResourceInfo',
} as const;

export type WebResourceSetFieldKey = keyof typeof WebResourceSetFields;

export const WebResourceSetApiRequestFields = {
  UID: 'UID',
  Set: 'Set',
} as const;

export type WebResourceSetApiRequestFieldKey = keyof typeof WebResourceSetApiRequestFields;

