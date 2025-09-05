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
CREATE TABLE [AnnouncementDetailFile] (
    [AnnouncementId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [FileId] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_AnnouncementDetailFile] PRIMARY KEY ([AnnouncementId], [ParentRowId], [RowId])
);

CREATE TABLE [BannerDetail] (
    [BannerId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [FontColor] nvarchar(max) NOT NULL,
    [Validate_Start] datetime2(0) NOT NULL,
    [Validate_End] datetime2(0) NOT NULL,
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
    [URL] nvarchar(max) NOT NULL,
    [URL_Open] tinyint NOT NULL,
    CONSTRAINT [PK_BannerDetailInfo] PRIMARY KEY ([BannerId], [ParentRowId], [RowId])
);

CREATE TABLE [SiteMenu_IndexInfo] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NULL,
    [Title] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [SiteHeader] nvarchar(max) NULL,
    [SiteFooter] nvarchar(max) NULL,
    [Keyword] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_SiteMenu_IndexInfo] PRIMARY KEY ([SiteIndex], [RowId])
);

CREATE TABLE [SiteMenu_Item] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [ParentRowId] int NULL,
    [ItemSiteUrl] nvarchar(max) NULL,
    [FullUrl] nvarchar(450) NULL,
    [Level] tinyint NOT NULL,
    [DisplayOrder] tinyint NOT NULL,
    [ItemType] tinyint NOT NULL,
    [WindowTarget] tinyint NOT NULL,
    [IsShowOnMenu] bit NOT NULL,
    CONSTRAINT [PK_SiteMenu_Item] PRIMARY KEY ([SiteIndex], [RowId])
);

CREATE TABLE [SiteMenu_Item_Module] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [ItemRowId] int NOT NULL,
    [BannerId] nvarchar(max) NULL,
    [ModuleProgId] nvarchar(max) NULL,
    [ModuleOptions] nvarchar(max) NULL,
    CONSTRAINT [PK_SiteMenu_Item_Module] PRIMARY KEY ([SiteIndex], [ItemRowId])
);

CREATE TABLE [SiteMenu_Item_Title] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [ItemRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_SiteMenu_Item_Title] PRIMARY KEY ([SiteIndex], [ItemRowId], [RowId])
);

CREATE TABLE [SiteMenu_Item_Url] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [ItemRowId] int NOT NULL,
    [RedirectType] tinyint NOT NULL,
    [RedirectUrl] nvarchar(max) NULL,
    CONSTRAINT [PK_SiteMenu_Item_Url] PRIMARY KEY ([SiteIndex], [ItemRowId])
);

CREATE TABLE [SpecCategoryDetail] (
    [CategoryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [CategoryName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_SpecCategoryDetail] PRIMARY KEY ([CategoryId], [RowId])
);

CREATE TABLE [User] (
    [UserId] nvarchar(450) NOT NULL,
    [UserName] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NULL,
    [PasswordHash] varbinary(max) NOT NULL,
    [PasswordSalt] varbinary(max) NOT NULL,
    [PasswordAlgoVer] int NOT NULL,
    [AccountStatus] tinyint NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_User] PRIMARY KEY ([UserId]),
    CONSTRAINT [FK_User_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_User_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_User_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [Announcement] (
    [AnnouncementId] nvarchar(450) NOT NULL,
    [Categories] nvarchar(max) NULL,
    [Tags] nvarchar(max) NULL,
    [ContentStatus] tinyint NOT NULL,
    [PictureId] nvarchar(max) NULL,
    [PicDescription] nvarchar(max) NULL,
    [ViewCount] int NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Announcement] PRIMARY KEY ([AnnouncementId]),
    CONSTRAINT [FK_Announcement_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Announcement_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Announcement_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [Banner] (
    [BannerId] nvarchar(450) NOT NULL,
    [BannerCategoryName] nvarchar(max) NOT NULL,
    [Interval] smallint NOT NULL,
    [Speed] smallint NOT NULL,
    [Height] smallint NOT NULL,
    [Width] smallint NOT NULL,
    [Effect] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Banner] PRIMARY KEY ([BannerId]),
    CONSTRAINT [FK_Banner_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Banner_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Banner_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [Category] (
    [CategoryId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Category] PRIMARY KEY ([CategoryId]),
    CONSTRAINT [FK_Category_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Category_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Category_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [FileArchive] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [CategoriesId] nvarchar(max) NOT NULL,
    [TagsId] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_FileArchive] PRIMARY KEY ([FileArchiveId]),
    CONSTRAINT [FK_FileArchive_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_FileArchive_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_FileArchive_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [FileManage] (
    [InternalId] nvarchar(450) NOT NULL,
    [Path] nvarchar(max) NOT NULL,
    [FileName] nvarchar(255) NOT NULL,
    [FileExtension] nvarchar(15) NOT NULL,
    [FileDescription] nvarchar(max) NOT NULL,
    [MimeType] nvarchar(max) NOT NULL,
    [FileSHA256] nvarchar(64) NOT NULL,
    [FileSize] bigint NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [ImportLabel] nvarchar(max) NOT NULL,
    [FileStatus] tinyint NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_FileManage] PRIMARY KEY ([InternalId]),
    CONSTRAINT [FK_FileManage_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_FileManage_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [Gallery] (
    [GalleryId] nvarchar(450) NOT NULL,
    [Categories] nvarchar(max) NOT NULL,
    [Tags] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [CoverPicSrcId] nvarchar(max) NOT NULL,
    [Sort] int NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Gallery] PRIMARY KEY ([GalleryId]),
    CONSTRAINT [FK_Gallery_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Gallery_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Gallery_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [OperateLog] (
    [Id] int NOT NULL IDENTITY,
    [APIName] nvarchar(max) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [followingDT] nvarchar(max) NOT NULL,
    [Browser] nvarchar(max) NOT NULL,
    [IP] nvarchar(max) NOT NULL,
    [ExcuteTime] datetime2(0) NOT NULL,
    [ExcStatus] tinyint NOT NULL,
    CONSTRAINT [PK_OperateLog] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OperateLog_User_UserId] FOREIGN KEY ([UserId]) REFERENCES [User] ([UserId]) ON DELETE CASCADE
);

CREATE TABLE [PageManagement] (
    [PageId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NULL,
    [ViewCount] int NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    CONSTRAINT [PK_PageManagement] PRIMARY KEY ([PageId]),
    CONSTRAINT [FK_PageManagement_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PageManagement_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PageManagement_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [Role] (
    [RoleId] nvarchar(450) NOT NULL,
    [RoleName] nvarchar(max) NOT NULL,
    [EndType] tinyint NOT NULL,
    [IsAdmin] bit NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Role] PRIMARY KEY ([RoleId]),
    CONSTRAINT [FK_Role_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Role_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Role_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [SiteMenu_Index] (
    [SiteIndex] nvarchar(450) NOT NULL,
    [GoogleAnalytics] nvarchar(max) NOT NULL,
    [Enable] bit NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SiteMenu_Index] PRIMARY KEY ([SiteIndex]),
    CONSTRAINT [FK_SiteMenu_Index_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SiteMenu_Index_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SiteMenu_Index_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [SpecCategory] (
    [CategoryId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [ShowColumnItems] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SpecCategory] PRIMARY KEY ([CategoryId]),
    CONSTRAINT [FK_SpecCategory_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SpecCategory_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SpecCategory_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [SpecResearch] (
    [ResearchId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [Tags] nvarchar(max) NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SpecResearch] PRIMARY KEY ([ResearchId]),
    CONSTRAINT [FK_SpecResearch_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SpecResearch_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SpecResearch_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [SpecUSR] (
    [USRId] nvarchar(450) NOT NULL,
    [CategoryId] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [Tags] nvarchar(max) NULL,
    [PictureId] nvarchar(max) NULL,
    [PicDescription] nvarchar(max) NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_SpecUSR] PRIMARY KEY ([USRId]),
    CONSTRAINT [FK_SpecUSR_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SpecUSR_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SpecUSR_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [TagData] (
    [TagId] nvarchar(450) NOT NULL,
    [ProgId] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_TagData] PRIMARY KEY ([TagId]),
    CONSTRAINT [FK_TagData_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TagData_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_TagData_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [WebResource] (
    [WebResourceId] nvarchar(450) NOT NULL,
    [Categories] nvarchar(max) NOT NULL,
    [Tags] nvarchar(max) NOT NULL,
    [ContentStatus] tinyint NOT NULL,
    [PicId] nvarchar(max) NOT NULL,
    [PicDescription] nvarchar(max) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_WebResource] PRIMARY KEY ([WebResourceId]),
    CONSTRAINT [FK_WebResource_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_WebResource_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_WebResource_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION
);

CREATE TABLE [AnnouncementDetail] (
    [AnnouncementId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NULL,
    [Title] nvarchar(max) NULL,
    [SubTitle] nvarchar(max) NULL,
    [Content] nvarchar(max) NULL,
    [Url] nvarchar(max) NULL,
    CONSTRAINT [PK_AnnouncementDetail] PRIMARY KEY ([AnnouncementId], [RowId]),
    CONSTRAINT [FK_AnnouncementDetail_Announcement_AnnouncementId] FOREIGN KEY ([AnnouncementId]) REFERENCES [Announcement] ([AnnouncementId]) ON DELETE NO ACTION
);

CREATE TABLE [CategoryDetail] (
    [CategoryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [CategoryName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_CategoryDetail] PRIMARY KEY ([CategoryId], [RowId]),
    CONSTRAINT [FK_CategoryDetail_Category_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Category] ([CategoryId]) ON DELETE NO ACTION
);

CREATE TABLE [FileArchiveDetail] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [FileSrcId] nvarchar(max) NOT NULL,
    [FileName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_FileArchiveDetail] PRIMARY KEY ([FileArchiveId], [ParentRowId], [RowId]),
    CONSTRAINT [FK_FileArchiveDetail_FileArchive_FileArchiveId] FOREIGN KEY ([FileArchiveId]) REFERENCES [FileArchive] ([FileArchiveId]) ON DELETE NO ACTION
);

CREATE TABLE [FileArchiveInfo] (
    [FileArchiveId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_FileArchiveInfo] PRIMARY KEY ([FileArchiveId], [RowId]),
    CONSTRAINT [FK_FileArchiveInfo_FileArchive_FileArchiveId] FOREIGN KEY ([FileArchiveId]) REFERENCES [FileArchive] ([FileArchiveId]) ON DELETE NO ACTION
);

CREATE TABLE [FileManage_DownloadInfo] (
    [InternalId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [DownloadUserIP] nvarchar(max) NOT NULL,
    [UserAgent] nvarchar(max) NOT NULL,
    [RefererURL] nvarchar(max) NOT NULL,
    [DownloadStatus] nvarchar(max) NOT NULL,
    [DownloadTime] datetime2(0) NOT NULL,
    CONSTRAINT [PK_FileManage_DownloadInfo] PRIMARY KEY ([InternalId], [RowId]),
    CONSTRAINT [FK_FileManage_DownloadInfo_FileManage_InternalId] FOREIGN KEY ([InternalId]) REFERENCES [FileManage] ([InternalId]) ON DELETE NO ACTION
);

CREATE TABLE [FileManage_SyncInfo] (
    [InternalId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [FileStatus] tinyint NOT NULL,
    [SrcIP] nvarchar(max) NOT NULL,
    [SrcNode] nvarchar(max) NOT NULL,
    [SrcFullPath] nvarchar(max) NOT NULL,
    [DestIP] nvarchar(max) NOT NULL,
    [DestNode] nvarchar(max) NOT NULL,
    [DestFullPath] nvarchar(max) NOT NULL,
    [ErrorCode] nvarchar(max) NULL,
    [ErrorMessage] nvarchar(max) NULL,
    [ExecuteTime] datetime2(0) NOT NULL,
    CONSTRAINT [PK_FileManage_SyncInfo] PRIMARY KEY ([InternalId], [RowId]),
    CONSTRAINT [FK_FileManage_SyncInfo_FileManage_InternalId] FOREIGN KEY ([InternalId]) REFERENCES [FileManage] ([InternalId]) ON DELETE NO ACTION
);

CREATE TABLE [GalleryInfo] (
    [GalleryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_GalleryInfo] PRIMARY KEY ([GalleryId], [RowId]),
    CONSTRAINT [FK_GalleryInfo_Gallery_GalleryId] FOREIGN KEY ([GalleryId]) REFERENCES [Gallery] ([GalleryId]) ON DELETE NO ACTION
);

CREATE TABLE [GalleryPhotos] (
    [GalleryId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [PicSrcId] nvarchar(max) NOT NULL,
    [Sort] int NOT NULL,
    CONSTRAINT [PK_GalleryPhotos] PRIMARY KEY ([GalleryId], [RowId]),
    CONSTRAINT [FK_GalleryPhotos_Gallery_GalleryId] FOREIGN KEY ([GalleryId]) REFERENCES [Gallery] ([GalleryId]) ON DELETE NO ACTION
);

CREATE TABLE [PageManagementDetail] (
    [PageId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NULL,
    [Title] nvarchar(max) NULL,
    [Content] nvarchar(max) NULL,
    CONSTRAINT [PK_PageManagementDetail] PRIMARY KEY ([PageId], [RowId]),
    CONSTRAINT [FK_PageManagementDetail_PageManagement_PageId] FOREIGN KEY ([PageId]) REFERENCES [PageManagement] ([PageId]) ON DELETE NO ACTION
);

CREATE TABLE [Permission] (
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    [CreateTime] datetime2(0) NULL,
    [CreateUserId] nvarchar(450) NULL,
    [ModifyTime] datetime2(0) NULL,
    [ModifyUserId] nvarchar(450) NULL,
    [FormStatus] tinyint NOT NULL,
    [DataStatus] tinyint NOT NULL,
    [InvalidTime] datetime2(0) NULL,
    [InvalidUserId] nvarchar(450) NULL,
    [InternalId] nvarchar(450) NOT NULL,
    [OrgLvId] nvarchar(max) NOT NULL,
    [IsIniData] bit NOT NULL,
    [DataVersion] rowversion NULL,
    [Validate_Start] datetime2(0) NULL,
    [Validate_End] datetime2(0) NULL,
    CONSTRAINT [PK_Permission] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_Permission_Role_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Role] ([RoleId]) ON DELETE CASCADE,
    CONSTRAINT [FK_Permission_User_CreateUserId] FOREIGN KEY ([CreateUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Permission_User_InvalidUserId] FOREIGN KEY ([InvalidUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Permission_User_ModifyUserId] FOREIGN KEY ([ModifyUserId]) REFERENCES [User] ([UserId]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Permission_User_UserId] FOREIGN KEY ([UserId]) REFERENCES [User] ([UserId]) ON DELETE CASCADE
);

CREATE TABLE [SpecResearchDetail] (
    [ResearchId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(5) NOT NULL,
    [Year] nvarchar(10) NULL,
    [AcademicYear] nvarchar(10) NULL,
    [Semester] nvarchar(10) NULL,
    [DuringExecution] nvarchar(200) NULL,
    [ContractPeriod] nvarchar(200) NULL,
    [ClassTime] nvarchar(200) NULL,
    [ProjectLeader] nvarchar(200) NULL,
    [Name] nvarchar(200) NULL,
    [TeachingStaffOfOurSchool] nvarchar(200) NULL,
    [ApprovalNumber] nvarchar(200) NULL,
    [ApprovedAmount] nvarchar(200) NULL,
    [College] nvarchar(200) NULL,
    [Department] nvarchar(200) NULL,
    [GraduationDegree] nvarchar(200) NULL,
    [CooperatingUnits] nvarchar(200) NULL,
    [CooperationProject] nvarchar(200) NULL,
    [Courses] nvarchar(200) NULL,
    [ProjectName] nvarchar(max) NULL,
    [PaperTitle] nvarchar(200) NULL,
    [Remark] nvarchar(max) NULL,
    [Cohost1] nvarchar(200) NULL,
    [Cohost2] nvarchar(200) NULL,
    [Commissioned] nvarchar(200) NULL,
    [PlanAmount] nvarchar(200) NULL,
    [PlanContent] nvarchar(max) NULL,
    CONSTRAINT [PK_SpecResearchDetail] PRIMARY KEY ([ResearchId], [RowId]),
    CONSTRAINT [FK_SpecResearchDetail_SpecResearch_ResearchId] FOREIGN KEY ([ResearchId]) REFERENCES [SpecResearch] ([ResearchId]) ON DELETE NO ACTION
);

CREATE TABLE [SpecUSRDetail] (
    [USRId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(5) NOT NULL,
    [Year] nvarchar(10) NULL,
    [AcademicYear] nvarchar(10) NULL,
    [Courses] nvarchar(200) NULL,
    [PracticeField] nvarchar(200) NULL,
    [ProjectName] nvarchar(200) NULL,
    [ExternalCooperationUnit] nvarchar(200) NULL,
    [Department] nvarchar(200) NULL,
    [DuringExecution] nvarchar(200) NULL,
    [PlanAmount] nvarchar(200) NULL,
    [ExecutionStrategy] nvarchar(max) NULL,
    [ContentIntroduction] nvarchar(max) NULL,
    [ProjectConcept] nvarchar(max) NULL,
    [ProjectHighlights] nvarchar(max) NULL,
    [ProjectLeader] nvarchar(200) NULL,
    [Cohost1] nvarchar(200) NULL,
    [Cohost2] nvarchar(200) NULL,
    [Commissioned] nvarchar(200) NULL,
    [Remark] nvarchar(max) NULL,
    CONSTRAINT [PK_SpecUSRDetail] PRIMARY KEY ([USRId], [RowId]),
    CONSTRAINT [FK_SpecUSRDetail_SpecUSR_USRId] FOREIGN KEY ([USRId]) REFERENCES [SpecUSR] ([USRId]) ON DELETE NO ACTION
);

CREATE TABLE [TagDetail] (
    [TagId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [TagName] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_TagDetail] PRIMARY KEY ([TagId], [RowId]),
    CONSTRAINT [FK_TagDetail_TagData_TagId] FOREIGN KEY ([TagId]) REFERENCES [TagData] ([TagId]) ON DELETE NO ACTION
);

CREATE TABLE [WebResourceInfo] (
    [WebResourceId] nvarchar(450) NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [ResUrl] nvarchar(max) NOT NULL,
    [Url_OpenType] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_WebResourceInfo] PRIMARY KEY ([WebResourceId], [RowId]),
    CONSTRAINT [FK_WebResourceInfo_WebResource_WebResourceId] FOREIGN KEY ([WebResourceId]) REFERENCES [WebResource] ([WebResourceId]) ON DELETE NO ACTION
);

CREATE TABLE [GalleryPhotosInfo] (
    [GalleryId] nvarchar(450) NOT NULL,
    [ParentRowId] int NOT NULL,
    [RowId] int NOT NULL,
    [Lang] nvarchar(max) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_GalleryPhotosInfo] PRIMARY KEY ([GalleryId], [ParentRowId], [RowId]),
    CONSTRAINT [FK_GalleryPhotosInfo_GalleryPhotos_GalleryId_RowId] FOREIGN KEY ([GalleryId], [RowId]) REFERENCES [GalleryPhotos] ([GalleryId], [RowId]) ON DELETE NO ACTION
);

CREATE INDEX [IX_Announcement_CreateUserId] ON [Announcement] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_Announcement_InternalId] ON [Announcement] ([InternalId]);

CREATE INDEX [IX_Announcement_InvalidUserId] ON [Announcement] ([InvalidUserId]);

CREATE INDEX [IX_Announcement_ModifyUserId] ON [Announcement] ([ModifyUserId]);

CREATE INDEX [IX_Banner_CreateUserId] ON [Banner] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_Banner_InternalId] ON [Banner] ([InternalId]);

CREATE INDEX [IX_Banner_InvalidUserId] ON [Banner] ([InvalidUserId]);

CREATE INDEX [IX_Banner_ModifyUserId] ON [Banner] ([ModifyUserId]);

CREATE INDEX [IX_Category_CreateUserId] ON [Category] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_Category_InternalId] ON [Category] ([InternalId]);

CREATE INDEX [IX_Category_InvalidUserId] ON [Category] ([InvalidUserId]);

CREATE INDEX [IX_Category_ModifyUserId] ON [Category] ([ModifyUserId]);

CREATE INDEX [IX_FileArchive_CreateUserId] ON [FileArchive] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_FileArchive_InternalId] ON [FileArchive] ([InternalId]);

CREATE INDEX [IX_FileArchive_InvalidUserId] ON [FileArchive] ([InvalidUserId]);

CREATE INDEX [IX_FileArchive_ModifyUserId] ON [FileArchive] ([ModifyUserId]);

CREATE INDEX [IX_FileManage_CreateUserId] ON [FileManage] ([CreateUserId]);

CREATE INDEX [IX_FileManage_FileSHA256] ON [FileManage] ([FileSHA256]);

CREATE UNIQUE INDEX [IX_FileManage_InternalId] ON [FileManage] ([InternalId]);

CREATE INDEX [IX_FileManage_ModifyUserId] ON [FileManage] ([ModifyUserId]);

CREATE INDEX [IX_Gallery_CreateUserId] ON [Gallery] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_Gallery_InternalId] ON [Gallery] ([InternalId]);

CREATE INDEX [IX_Gallery_InvalidUserId] ON [Gallery] ([InvalidUserId]);

CREATE INDEX [IX_Gallery_ModifyUserId] ON [Gallery] ([ModifyUserId]);

CREATE INDEX [IX_GalleryPhotosInfo_GalleryId_RowId] ON [GalleryPhotosInfo] ([GalleryId], [RowId]);

CREATE INDEX [IX_OperateLog_UserId] ON [OperateLog] ([UserId]);

CREATE INDEX [IX_PageManagement_CreateUserId] ON [PageManagement] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_PageManagement_InternalId] ON [PageManagement] ([InternalId]);

CREATE INDEX [IX_PageManagement_InvalidUserId] ON [PageManagement] ([InvalidUserId]);

CREATE INDEX [IX_PageManagement_ModifyUserId] ON [PageManagement] ([ModifyUserId]);

CREATE INDEX [IX_Permission_CreateUserId] ON [Permission] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_Permission_InternalId] ON [Permission] ([InternalId]);

CREATE INDEX [IX_Permission_InvalidUserId] ON [Permission] ([InvalidUserId]);

CREATE INDEX [IX_Permission_ModifyUserId] ON [Permission] ([ModifyUserId]);

CREATE INDEX [IX_Permission_RoleId] ON [Permission] ([RoleId]);

CREATE INDEX [IX_Role_CreateUserId] ON [Role] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_Role_InternalId] ON [Role] ([InternalId]);

CREATE INDEX [IX_Role_InvalidUserId] ON [Role] ([InvalidUserId]);

CREATE INDEX [IX_Role_ModifyUserId] ON [Role] ([ModifyUserId]);

CREATE INDEX [IX_SiteMenu_Index_CreateUserId] ON [SiteMenu_Index] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_SiteMenu_Index_InternalId] ON [SiteMenu_Index] ([InternalId]);

CREATE INDEX [IX_SiteMenu_Index_InvalidUserId] ON [SiteMenu_Index] ([InvalidUserId]);

CREATE INDEX [IX_SiteMenu_Index_ModifyUserId] ON [SiteMenu_Index] ([ModifyUserId]);

CREATE UNIQUE INDEX [UX_SiteMenu_Item_NaturalKey] ON [SiteMenu_Item] ([SiteIndex], [FullUrl]) WHERE [FullUrl] IS NOT NULL;

CREATE INDEX [IX_SpecCategory_CreateUserId] ON [SpecCategory] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_SpecCategory_InternalId] ON [SpecCategory] ([InternalId]);

CREATE INDEX [IX_SpecCategory_InvalidUserId] ON [SpecCategory] ([InvalidUserId]);

CREATE INDEX [IX_SpecCategory_ModifyUserId] ON [SpecCategory] ([ModifyUserId]);

CREATE INDEX [IX_SpecResearch_CreateUserId] ON [SpecResearch] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_SpecResearch_InternalId] ON [SpecResearch] ([InternalId]);

CREATE INDEX [IX_SpecResearch_InvalidUserId] ON [SpecResearch] ([InvalidUserId]);

CREATE INDEX [IX_SpecResearch_ModifyUserId] ON [SpecResearch] ([ModifyUserId]);

CREATE INDEX [IX_SpecUSR_CreateUserId] ON [SpecUSR] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_SpecUSR_InternalId] ON [SpecUSR] ([InternalId]);

CREATE INDEX [IX_SpecUSR_InvalidUserId] ON [SpecUSR] ([InvalidUserId]);

CREATE INDEX [IX_SpecUSR_ModifyUserId] ON [SpecUSR] ([ModifyUserId]);

CREATE INDEX [IX_TagData_CreateUserId] ON [TagData] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_TagData_InternalId] ON [TagData] ([InternalId]);

CREATE INDEX [IX_TagData_InvalidUserId] ON [TagData] ([InvalidUserId]);

CREATE INDEX [IX_TagData_ModifyUserId] ON [TagData] ([ModifyUserId]);

CREATE INDEX [IX_User_CreateUserId] ON [User] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_User_InternalId] ON [User] ([InternalId]);

CREATE INDEX [IX_User_InvalidUserId] ON [User] ([InvalidUserId]);

CREATE INDEX [IX_User_ModifyUserId] ON [User] ([ModifyUserId]);

CREATE INDEX [IX_WebResource_CreateUserId] ON [WebResource] ([CreateUserId]);

CREATE UNIQUE INDEX [IX_WebResource_InternalId] ON [WebResource] ([InternalId]);

CREATE INDEX [IX_WebResource_InvalidUserId] ON [WebResource] ([InvalidUserId]);

CREATE INDEX [IX_WebResource_ModifyUserId] ON [WebResource] ([ModifyUserId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250904023311_InitialCreate', N'9.0.8');

COMMIT;
GO

