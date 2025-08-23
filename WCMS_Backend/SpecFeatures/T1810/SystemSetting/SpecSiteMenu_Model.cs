using WCMS.Features.SystemSetting.SiteMenuSetting;

namespace WCMS.SpecFeatures.T1810.SystemSetting
{
    public class SpecModuleOptions: ModuleOptions
    {
        /// <summary>
        /// 研究計畫參數 (給Site Menu的動態參數使用)
        /// </summary>
        public class SpecResearchOptions
        {
            /// <summary>
            /// 類別
            /// </summary>
            public string Category { get; set; }
            /// <summary>
            /// 標籤
            /// </summary>
            public string Tag { get; set; }
        }
    }
}
