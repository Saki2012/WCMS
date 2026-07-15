using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.Features._Resx;

[LibDesc(DisplayName.Module)]
public enum ModuleCodeEnum
{
    /// <summary>
    /// 共用基礎資料模塊
    /// </summary>
    [LibDesc(DisplayName.Module_COMM)] COMM,
    /// <summary>
    /// 帳號管理模塊
    /// </summary>
    [LibDesc(DisplayName.Module_IAM)] IAM,
    /// <summary>
    /// 商品物品管理模塊
    /// </summary>
    [LibDesc(DisplayName.Module_MAT)] MAT,
    /// <summary>
    /// 系統管理模塊
    /// </summary>
    [LibDesc(DisplayName.Module_SYS)] SYS,
    /// <summary>
    /// 前台網站管理模塊
    /// </summary>
    [LibDesc(DisplayName.Module_WEB)] WEB,
    /// <summary>
    /// 客製模塊
    /// </summary>
    [LibDesc(DisplayName.Module_SPEC)] SPEC
}

/// <summary>
/// 程式功能鍵定義入口
/// </summary>
public static partial class ProgKeys
{
    /// <summary>
    /// 共用基礎資料模塊
    /// </summary>
    public static class COMM
    {
        /// <summary>
        /// 模塊代碼
        /// </summary>
        public const ModuleCodeEnum Code = ModuleCodeEnum.COMM;
        /// <summary>
        /// 行事曆
        /// </summary>
        [LibDesc(DisplayName.Prog_Calendar)]
        public const string Calendar = nameof(Calendar);
        /// <summary>
        /// 類別
        /// </summary>
        [LibDesc(DisplayName.Prog_Category)]
        public const string Category = nameof(Category);
        /// <summary>
        /// 人員基礎資料
        /// </summary>
        [LibDesc(DisplayName.Prog_Person)]
        public const string Person = nameof(Person);
        /// <summary>
        /// 標籤
        /// </summary>
        [LibDesc(DisplayName.Prog_Tag)]
        public const string Tag = nameof(Tag);
    }

    /// <summary>
    /// 帳號管理模塊
    /// </summary>
    public static class IAM
    {
        /// <summary>
        /// 模塊代碼
        /// </summary>
        public const ModuleCodeEnum Code = ModuleCodeEnum.IAM;
        /// <summary>
        /// 帳號管理
        /// </summary>
        [LibDesc(DisplayName.Prog_Account)]
        public const string Account = nameof(Account);
        /// <summary>
        /// 登入授權
        /// </summary>
        [LibDesc(DisplayName.Prog_Auth)]
        public const string Auth = nameof(Auth);
        /// <summary>
        /// 角色權限
        /// </summary>
        [LibDesc(DisplayName.Prog_RolePermission)]
        public const string RolePermission = nameof(RolePermission);
    }

    /// <summary>
    /// 商品物品管理模塊
    /// </summary>
    public static class MAT
    {
        /// <summary>
        /// 模塊代碼
        /// </summary>
        public const ModuleCodeEnum Code = ModuleCodeEnum.MAT;
        /// <summary>
        /// 物件管理
        /// </summary>
        [LibDesc(DisplayName.Prog_Material)] public const string Material = nameof(Material);
        /// <summary>
        /// 物件類別
        /// </summary>
        [LibDesc(DisplayName.Prog_MatCategory)] public const string MatCategory = nameof(MatCategory);
    }
    /// <summary>
    /// 系統管理模塊
    /// </summary>
    public static class SYS
    {
        /// <summary>
        /// 模塊代碼
        /// </summary>
        public const ModuleCodeEnum Code = ModuleCodeEnum.SYS;
        /// <summary>
        /// 儀表版
        /// </summary>
        [LibDesc(DisplayName.Prog_Dashboard)]
        public const string Dashboard = nameof(Dashboard);
    }
    /// <summary>
    /// 前台網站管理模塊
    /// </summary>
    public static class WEB
    {
        /// <summary>
        /// 模塊代碼
        /// </summary>
        public const ModuleCodeEnum Code = ModuleCodeEnum.WEB;
        /// <summary>
        /// 首頁設定
        /// </summary>
        [LibDesc(DisplayName.Prog_HomePageSetting)]
        public const string HomePageSetting = nameof(HomePageSetting);
        /// <summary>
        /// 公告管理
        /// </summary>
        [LibDesc(DisplayName.Prog_Announcement)]
        public const string Announcement = nameof(Announcement);
        /// <summary>
        /// 橫幅管理
        /// </summary>
        [LibDesc(DisplayName.Prog_Banner)]
        public const string Banner = nameof(Banner);
        /// <summary>
        /// 檔案典藏
        /// </summary>
        [LibDesc(DisplayName.Prog_FileArchive)]
        public const string FileArchive = nameof(FileArchive);
        /// <summary>
        /// 相簿管理
        /// </summary>
        [LibDesc(DisplayName.Prog_Gallery)]
        public const string Gallery = nameof(Gallery);
        /// <summary>
        /// 頁面管理
        /// </summary>
        [LibDesc(DisplayName.Prog_PageManagement)]
        public const string PageManagement = nameof(PageManagement);
        /// <summary>
        /// 網站選單設定
        /// </summary>
        [LibDesc(DisplayName.Prog_SiteMenu)]
        public const string SiteMenu = nameof(SiteMenu);
        /// <summary>
        /// 網站瀏覽統計
        /// </summary>
        [LibDesc(DisplayName.Prog_SiteViewCount)]
        public const string SiteViewCount = nameof(SiteViewCount);
        /// <summary>
        /// 網站資源管理
        /// </summary>
        [LibDesc(DisplayName.Prog_WebResource)]
        public const string WebResource = nameof(WebResource);
        /// <summary>
        /// 紀事表
        /// </summary>
        [LibDesc(DisplayName.Prog_Timeline)]
        public const string Timeline = nameof(Timeline);
        /// <summary>
        /// 問卷設計
        /// </summary>
        [LibDesc(DisplayName.Prog_Survey)]
        public const string Survey = nameof(Survey);
        /// <summary>
        /// 問卷回覆
        /// </summary>
        [LibDesc(DisplayName.Prog_SurveySubmission)]
        public const string SurveySubmission = nameof(SurveySubmission);
    }
    /// <summary>
    /// 客製功能模塊
    /// </summary>
    public static partial class Spec
    {
        /// <summary>
        /// 模塊代碼
        /// </summary>
        public const ModuleCodeEnum Code = ModuleCodeEnum.SPEC;
    }
}
