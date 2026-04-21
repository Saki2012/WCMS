namespace WCMS.Features._Resx;

public enum ModuleCodeEnum
{
    /// <summary>
    /// 共用基礎資料模塊
    /// </summary>
    COMM,
    /// <summary>
    /// 帳號管理模塊
    /// </summary>
    IAM,
    /// <summary>
    /// 商品物品管理模塊
    /// </summary>
    MAT,
    /// <summary>
    /// 系統管理模塊
    /// </summary>
    SYS,
    /// <summary>
    /// 前台網站管理模塊
    /// </summary>
    WEB,
    /// <summary>
    /// 客製模塊
    /// </summary>
    Spec
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
        /// 共用行事曆
        /// </summary>
        public const  string Calendar = nameof(Calendar);
        /// <summary>
        /// 共用類別
        /// </summary>
        public const  string Category = nameof(Category);
        /// <summary>
        /// 人物主檔
        /// </summary>
        public const  string Person = nameof(Person);
        /// <summary>
        /// 共用標籤
        /// </summary>
        public const  string Tag = nameof(Tag);
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
        public const  string Account = nameof(Account);
        /// <summary>
        /// 登入授權
        /// </summary>
        public const  string Auth = nameof(Auth);
        /// <summary>
        /// 角色權限
        /// </summary>
        public const  string RolePermission = nameof(RolePermission);
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
        /// 商品物品管理
        /// </summary>
        public const  string Material = nameof(Material);
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
        /// 系統首頁
        /// </summary>
        public const  string Dashboard = nameof(Dashboard);
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
        public const string HomePageSetting = nameof(HomePageSetting);
        /// <summary>
        /// 公告管理
        /// </summary>
        public const  string Announcement = nameof(Announcement);
        /// <summary>
        /// 橫幅管理
        /// </summary>
        public const  string Banner = nameof(Banner);
        /// <summary>
        /// 檔案典藏
        /// </summary>
        public const  string FileArchive = nameof(FileArchive);
        /// <summary>
        /// 相簿管理
        /// </summary>
        public const  string Gallery = nameof(Gallery);
        /// <summary>
        /// 頁面管理
        /// </summary>
        public const  string PageManagement = nameof(PageManagement);
        /// <summary>
        /// 網站選單設定
        /// </summary>
        public const  string SiteMenu = nameof(SiteMenu);
        /// <summary>
        /// 網站瀏覽統計
        /// </summary>
        public const  string SiteViewCount = nameof(SiteViewCount);
        /// <summary>
        /// 網站資源管理
        /// </summary>
        public const  string WebResource = nameof(WebResource);
    }
    /// <summary>
    /// 客製功能模塊
    /// </summary>
    public static partial class Spec
    {
        /// <summary>
        /// 模塊代碼
        /// </summary>
        public const ModuleCodeEnum Code = ModuleCodeEnum.Spec;
    }
}