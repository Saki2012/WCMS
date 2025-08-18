using WCMS.Features.SystemSetting.SiteMenuSetting;

namespace WCMS.SpecFeatures.T1810.SystemSetting
{
    public class SpecModuleOptions: ModuleOptions
    {
        /// <summary>
        /// 研究計畫參數
        /// </summary>
        public class SpecResearch
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
