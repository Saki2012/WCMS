IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Announcement] (
    [CustomerCode] nvarchar(450) NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_Announcement] PRIMARY KEY ([CustomerCode])
);

CREATE TABLE [Banner] (
    [BannerId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [Interval] smallint NOT NULL,
    [Speed] smallint NOT NULL,
    [Height] smallint NOT NULL,
    [Width] smallint NOT NULL,
    [Effect] tinyint NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_Banner] PRIMARY KEY ([BannerId])
);

CREATE TABLE [BannerDetail] (
    [BannerId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [FontColor] tinyint NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    [URL_Open] tinyint NOT NULL,
    [Sort] int NOT NULL,
    CONSTRAINT [PK_BannerDetail] PRIMARY KEY ([BannerId], [RowId])
);

CREATE TABLE [BannerDetailInfo] (
    [BannerId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_BannerDetailInfo] PRIMARY KEY ([BannerId], [ParentRowId], [RowId])
);

CREATE TABLE [Category] (
    [CategoryId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_Category] PRIMARY KEY ([CategoryId])
);

CREATE TABLE [CategoryDetail] (
    [CategoryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [CategoryName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_CategoryDetail] PRIMARY KEY ([CategoryId], [RowId])
);

CREATE TABLE [DataChangeLog] (
    [DataChangeId] bigint NOT NULL IDENTITY,
    [UserId] nvarchar(max) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(max) NOT NULL,
    [DataChangeTime] datetime2 NOT NULL,
    CONSTRAINT [PK_DataChangeLog] PRIMARY KEY ([DataChangeId])
);

CREATE TABLE [FileArchive] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [Status] int NOT NULL,
    [CategoriesId] nvarchar(max) NOT NULL,
    [TagsId] nvarchar(max) NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_FileArchive] PRIMARY KEY ([FileArchiveId])
);

CREATE TABLE [FileArchiveDetail] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [FileName] nvarchar(max) NOT NULL,
    [FileSrcId] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_FileArchiveDetail] PRIMARY KEY ([FileArchiveId], [ParentRowId], [RowId])
);

CREATE TABLE [FileArchiveInfo] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_FileArchiveInfo] PRIMARY KEY ([FileArchiveId], [RowId])
);

CREATE TABLE [Gallery] (
    [GalleryId] nvarchar(450) NOT NULL,
    [CategoriesId] nvarchar(max) NOT NULL,
    [TagsId] nvarchar(max) NOT NULL,
    [Status] int NOT NULL,
    [CoverPicSrcId] nvarchar(max) NOT NULL,
    [Sort] int NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_Gallery] PRIMARY KEY ([GalleryId])
);

CREATE TABLE [GalleryInfo] (
    [GalleryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_GalleryInfo] PRIMARY KEY ([GalleryId], [RowId])
);

CREATE TABLE [GalleryPhotos] (
    [GalleryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [Sort] int NOT NULL,
    [IsCovered] bit NOT NULL,
    CONSTRAINT [PK_GalleryPhotos] PRIMARY KEY ([GalleryId], [RowId])
);

CREATE TABLE [GalleryPhotosInfo] (
    [GalleryId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_GalleryPhotosInfo] PRIMARY KEY ([GalleryId], [ParentRowId], [RowId])
);

CREATE TABLE [OperateLog] (
    [Id] bigint NOT NULL IDENTITY,
    [UserId] nvarchar(max) NOT NULL,
    [IP] nvarchar(max) NOT NULL,
    [Browser] nvarchar(max) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [PK] nvarchar(max) NOT NULL,
    [OperateTime] datetime2 NOT NULL,
    [Action] nvarchar(max) NOT NULL,
    [Memo] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_OperateLog] PRIMARY KEY ([Id])
);

CREATE TABLE [PageManagement] (
    [PageId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [ViewCount] int NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_PageManagement] PRIMARY KEY ([PageId])
);

CREATE TABLE [PageManagementDetail] (
    [PageId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_PageManagementDetail] PRIMARY KEY ([PageId], [RowId])
);

CREATE TABLE [Role] (
    [RoleId] nvarchar(450) NOT NULL,
    [RoleName] nvarchar(max) NOT NULL,
    [EndType] tinyint NOT NULL,
    [IsAdmin] bit NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_Role] PRIMARY KEY ([RoleId])
);

CREATE TABLE [SpecResearch] (
    [ResearchId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [Interval] smallint NOT NULL,
    [Speed] smallint NOT NULL,
    [Height] smallint NOT NULL,
    [Width] smallint NOT NULL,
    [Effect] tinyint NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_SpecResearch] PRIMARY KEY ([ResearchId])
);

CREATE TABLE [SpecResearchDetail] (
    [ResearchId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [FontColor] tinyint NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    [URL_Open] tinyint NOT NULL,
    [Sort] int NOT NULL,
    CONSTRAINT [PK_SpecResearchDetail] PRIMARY KEY ([ResearchId])
);

CREATE TABLE [SpecUSR] (
    [USRId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [Interval] smallint NOT NULL,
    [Speed] smallint NOT NULL,
    [Height] smallint NOT NULL,
    [Width] smallint NOT NULL,
    [Effect] tinyint NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_SpecUSR] PRIMARY KEY ([USRId])
);

CREATE TABLE [SpecUSRDetail] (
    [USRId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [FontColor] tinyint NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    [URL_Open] tinyint NOT NULL,
    [Sort] int NOT NULL,
    CONSTRAINT [PK_SpecUSRDetail] PRIMARY KEY ([USRId])
);

CREATE TABLE [TagData] (
    [TagId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_TagData] PRIMARY KEY ([TagId])
);

CREATE TABLE [TagDetail] (
    [TagId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [TagName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_TagDetail] PRIMARY KEY ([TagId], [RowId])
);

CREATE TABLE [User] (
    [UserId] nvarchar(450) NOT NULL,
    [UserName] nvarchar(max) NOT NULL,
    [RoleId] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [AccountStatus] tinyint NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_User] PRIMARY KEY ([UserId])
);

CREATE TABLE [WebResource] (
    [WebResourceId] nvarchar(450) NOT NULL,
    [CategoriesId] nvarchar(max) NOT NULL,
    [TagsId] nvarchar(max) NOT NULL,
    [Status] int NOT NULL,
    [SrcType] tinyint NOT NULL,
    [SrcData] nvarchar(max) NOT NULL,
    [ResUrl] nvarchar(max) NOT NULL,
    [Url_OpenType] nvarchar(max) NOT NULL,
    [Sort] int NOT NULL,
    [CreateTime] datetime2 NULL,
    [CreateUserId] nvarchar(max) NOT NULL,
    [ModifyTime] datetime2 NULL,
    [ModifyUserId] nvarchar(max) NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2 NULL,
    [InvalidUserId] nvarchar(max) NOT NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [FormStatus] tinyint NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2 NOT NULL,
    [Validate_End] datetime2 NOT NULL,
    CONSTRAINT [PK_WebResource] PRIMARY KEY ([WebResourceId])
);

CREATE TABLE [WebResourceInfo] (
    [WebResourceId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_WebResourceInfo] PRIMARY KEY ([WebResourceId], [RowId])
);

CREATE TABLE [DataChangeLogDetail] (
    [DataChangeId] bigint NOT NULL,
    [RowId] bigint NOT NULL,
    [TableIndex] int NOT NULL,
    [ChangeData] varbinary(max) NOT NULL,
    [RowState] tinyint NOT NULL,
    CONSTRAINT [PK_DataChangeLogDetail] PRIMARY KEY ([DataChangeId], [RowId]),
    CONSTRAINT [FK_DataChangeLogDetail_DataChangeLog_DataChangeId] FOREIGN KEY ([DataChangeId]) REFERENCES [DataChangeLog] ([DataChangeId]) ON DELETE NO ACTION
);

CREATE UNIQUE INDEX [IX_Announcement_InternalId] ON [Announcement] ([InternalId]);

CREATE UNIQUE INDEX [IX_Banner_InternalId] ON [Banner] ([InternalId]);

CREATE UNIQUE INDEX [IX_Category_InternalId] ON [Category] ([InternalId]);

CREATE UNIQUE INDEX [IX_FileArchive_InternalId] ON [FileArchive] ([InternalId]);

CREATE UNIQUE INDEX [IX_Gallery_InternalId] ON [Gallery] ([InternalId]);

CREATE UNIQUE INDEX [IX_PageManagement_InternalId] ON [PageManagement] ([InternalId]);

CREATE UNIQUE INDEX [IX_Role_InternalId] ON [Role] ([InternalId]);

CREATE UNIQUE INDEX [IX_SpecResearch_InternalId] ON [SpecResearch] ([InternalId]);

CREATE UNIQUE INDEX [IX_SpecUSR_InternalId] ON [SpecUSR] ([InternalId]);

CREATE UNIQUE INDEX [IX_TagData_InternalId] ON [TagData] ([InternalId]);

CREATE UNIQUE INDEX [IX_User_InternalId] ON [User] ([InternalId]);

CREATE UNIQUE INDEX [IX_WebResource_InternalId] ON [WebResource] ([InternalId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250710023352_AddNewColumnToYourEntity', N'9.0.6');

COMMIT;
GO

