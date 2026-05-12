using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features._Resx;

[LibDesc(ModelDisplayName.Module)]
public enum ModuleCodeEnum
{
    /// <summary>
    /// 共用基礎資料模塊
    /// </summary>
    [LibDesc(ModelDisplayName.Module_COMM)] COMM,
    /// <summary>
    /// 帳號管理模塊
    /// </summary>
    [LibDesc(ModelDisplayName.Module_IAM)] IAM,
    /// <summary>
    /// 商品物品管理模塊
    /// </summary>
    [LibDesc(ModelDisplayName.Module_MAT)] MAT,
    /// <summary>
    /// 系統管理模塊
    /// </summary>
    [LibDesc(ModelDisplayName.Module_SYS)] SYS,
    /// <summary>
    /// 前台網站管理模塊
    /// </summary>
    [LibDesc(ModelDisplayName.Module_WEB)] WEB,
    /// <summary>
    /// 客製模塊
    /// </summary>
    [LibDesc(ModelDisplayName.Module_SPEC)] SPEC
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
        [LibDesc(ModelDisplayName.Prog_Calendar)]
        public const string Calendar = nameof(Calendar);
        /// <summary>
        /// 類別
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Category)]
        public const string Category = nameof(Category);
        /// <summary>
        /// 人員基礎資料
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Person)]
        public const string Person = nameof(Person);
        /// <summary>
        /// 標籤
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Tag)]
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
        [LibDesc(ModelDisplayName.Prog_Account)]
        public const string Account = nameof(Account);
        /// <summary>
        /// 登入授權
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Auth)]
        public const string Auth = nameof(Auth);
        /// <summary>
        /// 角色權限
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_RolePermission)]
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
        [LibDesc(ModelDisplayName.Prog_Material)] public const string Material = nameof(Material);
        /// <summary>
        /// 物件類別
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_MatCategory)] public const string MatCategory = nameof(MatCategory);
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
        [LibDesc(ModelDisplayName.Prog_Dashboard)]
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
        [LibDesc(ModelDisplayName.Prog_HomePageSetting)]
        public const string HomePageSetting = nameof(HomePageSetting);
        /// <summary>
        /// 公告管理
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Announcement)]
        public const string Announcement = nameof(Announcement);
        /// <summary>
        /// 橫幅管理
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Banner)]
        public const string Banner = nameof(Banner);
        /// <summary>
        /// 檔案典藏
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_FileArchive)]
        public const string FileArchive = nameof(FileArchive);
        /// <summary>
        /// 相簿管理
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Gallery)]
        public const string Gallery = nameof(Gallery);
        /// <summary>
        /// 頁面管理
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_PageManagement)]
        public const string PageManagement = nameof(PageManagement);
        /// <summary>
        /// 網站選單設定
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_SiteMenu)]
        public const string SiteMenu = nameof(SiteMenu);
        /// <summary>
        /// 網站瀏覽統計
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_SiteViewCount)]
        public const string SiteViewCount = nameof(SiteViewCount);
        /// <summary>
        /// 網站資源管理
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_WebResource)]
        public const string WebResource = nameof(WebResource);
        /// <summary>
        /// 紀事表
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Timeline)]
        public const string Timeline = nameof(Timeline);
        /// <summary>
        /// 問卷設計
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_Survey)]
        public const string Survey = nameof(Survey);
        /// <summary>
        /// 問卷回覆
        /// </summary>
        [LibDesc(ModelDisplayName.Prog_SurveySubmission)]
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
