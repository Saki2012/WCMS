using System.ComponentModel.DataAnnotations;
using WCMS.Features.Member.RolePermission;
using WCMS.SysCore.Library;

namespace WCMS.SysCore.I18n.Resx
{
    public static class ModelDisplayName
    {
        #region 共用
        public const string Common_Category = "Common_Category";
        public const string Common_Content = "Common_Content";
        public const string Common_Tag = "Common_Tag";
        public const string Common_ParentRowId = "Common_ParentRowId";
        public const string Common_RowId = "Common_RowId";
        public const string Common_Lang = "Common_Lang";
        public const string Common_Title = "Common_Title";
        public const string Common_SubTitle = "Common_SubTitle";
        public const string Common_CreateTime = "Common_CreateTime";
        public const string Common_CreateUserId = "Common_CreateUserId";
        public const string Common_ModifyTime = "Common_ModifyTime";
        public const string Common_ModifyUserId = "Common_ModifyUserId";
        public const string Common_InternalId = "Common_InternalId";
        public const string Common_Url = "Common_Url";
        public const string Common_UrlDescription = "Common_UrlDescription";
        public const string Common_UrlOpen = "Common_UrlOpen";
        public const string Common_ProgId = "Common_ProgId";
        public const string Common_ContentStatus = "Common_ContentStatus";
        public const string Common_Email = "Common_Email";
        public const string Common_MobilePhone = "Common_MobilePhone";
        public const string Common_HomePhone = "Common_HomePhone";
        public const string Common_None = "Common_None";
        public const string Common_Password = "Common_Password";
        public const string Common_OldPassword = "Common_OldPassword";
        public const string Common_NewPassword = "Common_NewPassword";
        public const string Common_CheckNewPassword = "Common_CheckNewPassword";
        public const string Common_Memo = "Common_Memo";
        public const string Common_SoundSrcId = "Common_SoundSrcId";


        #endregion

        #region Enums
        public const string Enum_Top = "Enum_Top";
        public const string Enum_Hot = "Enum_Hot";
        public const string Enum_Hidden = "Enum_Hidden";
        public const string Enum_Url = "Enum_Url";
        public const string Enum_Module = "Enum_Module";
        public const string Enum_List = "Enum_List";
        public const string Enum_PictureList = "Enum_PictureList";
        public const string Enum_QAList = "Enum_QAList";
        public const string Enum_Waterfall = "Enum_Waterfall";
        public const string Enum_Expand_Category = "Enum_Expand_Category";
        public const string Enum_Expand_Tag = "Enum_Expand_Tag";
        public const string Enum_Youtube = "Enum_Youtube";
        public const string Enum_TimelineSlider = "Enum_TimelineSlider";
        public const string Enum_WindowTarget_Self = "Enum_WindowTarget_Self";
        public const string Enum_WindowTarget_Blank = "Enum_WindowTarget_Blank";
        public const string Enum_TwoColumn = "Enum_TwoColumn";
        public const string Enum_Vertical = "Enum_Vertical";
        public const string Enum_Gender = "Enum_Gender";
        public const string Enum_Gender_NotKnown= "Enum_Gender_NotKnown";
        public const string Enum_Gender_Male="Enum_Gender_Male";
        public const string Enum_Gender_Female = "Enum_Gender_Female";

        public const string Enum_AccountStatus = "Enum_AccountStatus";
        public const string Enum_AccountStatus_Unable = "Enum_AccountStatus_Unable";
        public const string Enum_AccountStatus_Enable = "Enum_AccountStatus_Enable";
        public const string Enum_AccountStatus_Freeze = "Enum_AccountStatus_Freeze";
        public const string Enum_AccountStatus_Expired = "Enum_AccountStatus_Expired";
        public const string Enum_AccountStatus_HostDefault = "Enum_AccountStatus_HostDefault";

        public const string Enum_DefaultLang = "Enum_DefaultLang";
        public const string Enum_SupportLang = "Enum_SupportLang";


        public const string Enum_FuncAction = "Enum_FuncAction";
        public const string Enum_FuncAction_None = "Enum_FuncAction_None";
        public const string Enum_FuncAction_Use = "Enum_FuncAction_Use";
        public const string Enum_FuncAction_Query = "Enum_FuncAction_Query";
        public const string Enum_FuncAction_View = "Enum_FuncAction_View";
        public const string Enum_FuncAction_Create = "Enum_FuncAction_Create";
        public const string Enum_FuncAction_Update = "Enum_FuncAction_Update";
        public const string Enum_FuncAction_Delete = "Enum_FuncAction_Delete";
        public const string Enum_FuncAction_Invalid = "Enum_FuncAction_Invalid";
        public const string Enum_FuncAction_MasterData = "Enum_FuncAction_MasterData";
        public const string Enum_FuncAction_BillData = "Enum_FuncAction_BillData";
        public const string Enum_FuncAction_Report = "Enum_FuncAction_Report";
        public const string Enum_FuncAction_All = "Enum_FuncAction_All";







        #endregion

        #region 網站結構設定
        public const string SiteMenu_SiteIndex = "SiteMenu_SiteIndex";
        public const string SiteMenu_GoogleAnalytics = "SiteMenu_GoogleAnalytics";
        public const string SiteMenu_Enable = "SiteMenu_Enable";
        public const string SiteMenu_SiteTitle = "SiteMenu_SiteTitle";
        public const string SiteMenu_SiteDescription = "SiteMenu_SiteDescription";
        public const string SiteMenu_SiteHeader = "SiteMenu_SiteHeader";
        public const string SiteMenu_SiteFooter = "SiteMenu_SiteFooter";
        public const string SiteMenu_Keyword = "SiteMenu_Keyword";
        public const string SiteMenu_ItemSiteUrl = "SiteMenu_ItemSiteUrl";
        public const string SiteMenu_FullUrl = "SiteMenu_FullUrl";
        public const string SiteMenu_Level = "SiteMenu_Level";
        public const string SiteMenu_DisplayOrder = "SiteMenu_DisplayOrder";
        public const string SiteMenu_ItemType = "SiteMenu_ItemType";
        public const string SiteMenu_WindowTarget = "SiteMenu_WindowTarget";
        public const string SiteMenu_IsShowOnMenu = "SiteMenu_IsShowOnMenu";
        public const string SiteMenu_MenuTitle = "SiteMenu_MenuTitle";
        public const string SiteMenu_RedirectType = "SiteMenu_RedirectType";
        public const string SiteMenu_RedirectUrl = "SiteMenu_RedirectUrl";
        public const string SiteMenu_ModuleProgId = "SiteMenu_ModuleProgId";
        public const string SiteMenu_ModuleOptions = "SiteMenu_ModuleOptions";
        #endregion

        #region 網站管理功能
        #region 公告
        public const string AnnouncementId="AnnouncementId";
        public const string Announcement_SubTitle="Announcement_SubTitle";
        public const string Announcement_CoverPictureId= "Announcement_CoverPictureId";
        public const string Announcement_PicDescription="Announcement_PicDescription";
        public const string Announcement_ViewCount="Announcement_ViewCount";
        public const string Announcement_StartDate="Announcement_StartDate";
        public const string Announcement_EndDate="Announcement_EndDate";
        public const string Announcement_CreationDate="Announcement_CreationDate";
        public const string Announcement_FileId = "Announcement_FileId";
        public const string Announcement_FileName = "Announcement_FileName";

        #endregion 
        #region 廣告輪播
        public const string BannerId="BannerId";
        public const string Banner_CategoryName = "Banner_CategoryName";
        public const string Banner_Interval="Banner_Interval";
        public const string Banner_Speed="Banner_Speed";
        public const string Banner_Height="Banner_Height";
        public const string Banner_Width="Banner_Width";
        public const string Banner_Effect="Banner_Effect";
        public const string Banner_PicSrcId="Banner_PicSrcId";
        public const string Banner_FontColor="Banner_FontColor";
        public const string Banner_StartDate="Banner_StartDate"; 
        public const string Banner_EndDate="Banner_EndDate";
        public const string Banner_CreationDate="Banner_CreationDate";
        public const string Banner_Sort="Banner_Sort";
        public const string Banner_Content="Banner_Content";
        #endregion 
        #region 類別
        public const string CategoryId="CategoryId";
        public const string Category_Module="Category_Module";
        public const string Category_Detail="Category_Breakdown";
        public const string Category_CustomMade = "Category_CustomMade";
        public const string Category_CategoryName = "Category_CategoryName";

        
        #endregion 
        #region 檔案室
        public const string FileArchiveId="FileArchiveId";
        public const string FileArchive_ContentStatus="FileArchive_ContentStatus";
        public const string FileArchive_Categories="FileArchive_Categories";
        public const string FileArchive_Tags="FileArchive_Tags";
        public const string FileArchive_CustomMade="FileArchive_CustomMade";
        public const string FileArchive_FileSrcId="FileArchive_FileSrcId";
        public const string FileArchive_FileName="FileArchive_FileName";
        public const string FileArchive_StartDate="FileArchive_StartDate"; 
        public const string FileArchive_EndDate="FileArchive_EndDate";
        public const string FileArchive_CreationDate="FileArchive_CreationDate";
        public const string FileArchive_Sort="FileArchive_Sort";
        public const string FileArchive_DownloadCount="FileArchive_DownloadCount";
        #endregion
        #region 相簿
        public const string GalleryId="GalleryId";
        public const string Gallery_Categories="Gallery_Categories";
        public const string Gallery_Tags="Gallery_Tags";
        public const string Gallery_ContentStatus="Gallery_ContentStatus";
        public const string Gallery_CoverPicSrcId="Gallery_CoverPicSrcId";
        public const string Gallery_Sort="Gallery_Sort";
        public const string Gallery_GalleryInfo="Gallery_GalleryInfo";
        public const string Gallery_Photos="Gallery_Photos";
        public const string Gallery_PhotosInfo="Gallery_PhotosInfo";
        public const string Gallery_Content="Gallery_Content";
        public const string Gallery_PicSrcId="Gallery_PicSrcId";
        #endregion
        #region 頁面
        public const string PageId="PageId";
        public const string Page_Categories="Page_Categories";
        public const string Page_ViewCount="Page_ViewCount";
        public const string Page_CustomMade="Page_CustomMade";
        public const string Page_Content="Page_Content";
        #endregion
        #region 標籤
        public const string TagId="TagId";
        public const string Tag_Data="Tag_Data";
        public const string Tag_Detail="Tag_Detail";
        public const string Tag_Module="Tag_Module";
        public const string Tag_TagName="Tag_TagName";
        public const string Tag_CustomMade="Tag_CustomMade";
        #endregion
        #region 網路資源
        public const string WebResourceId="WebResourceId";
        public const string WebResource_WebResourceInfo="WebResource_WebResourceInfo";
        public const string WebResource_Categories="WebResource_Categories";
        public const string WebResource_Tags="WebResource_Tags";
        public const string WebResource_ContentStatus="WebResource_ContentStatus";             
        public const string WebResource_PicId="WebResource_PicId";
        public const string WebResource_PicDescription="WebResource_PicDescription";
        public const string WebResource_Content="WebResource_Content";
        #endregion
        
        #endregion

        #region 人員管理

        #region 帳號
        public const string Account_AccountId = "Account_AccountId";
        public const string Account_AccountName = "Account_AccountName";
        public const string Account_PasswordChangeDate = "Account_PasswordChangeDate";
        #endregion

        #region 人員基本資料
        public const string Person_PersonSet = "Person_PersonSet"; //人員基本資料表
        public const string Person_PersonModel = "Person_PersonModel"; //人員基本資料
        public const string Person_PersonId = "Person_PersonId";
        public const string Person_PersonName = "Person_PersonName";
        public const string Person_PersonImgId = "Person_PersonImgId";
        #endregion

        #region 角色權限
        public const string RolePermission = "RolePermission";
        public const string RolePermission_RoleId = "RolePermission_RoleId";
        public const string RolePermission_RoleName = "RolePermission_RoleName";
        public const string RolePermission_IsAdmin = "RolePermission_IsAdmin";
        public const string RolePermission_PermissionKey = "RolePermission_PermissionKey";
        public const string RolePermission_GrantMask = "RolePermission_GrantMask";
        #endregion

        #region 登入用戶資訊
        public const string User_UserID = "User_UserID";
        public const string User_UserName = "User_UserName";
        public const string User_AccountStatus = "User_AccountStatus";
        #endregion

        #endregion

        #region 1810調整的東西
        /// <summary>
        /// 組別
        /// </summary>
        public const string Spec1810_Tag = "Spec1810_Tag";
        #endregion
    }
}
