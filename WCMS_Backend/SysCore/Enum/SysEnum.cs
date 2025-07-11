using WCMS.SysCore.Library;
using System.ComponentModel;

namespace WCMS.SysCore.Enum
{
    public class SysEnum
    {
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc("資料狀態")]
        public enum DataStatus : byte
        {
            /// <summary>
            /// 作廢
            /// </summary>
            [LibDesc("作廢")] Invalid = 0,
            /// <summary>
            /// 生效
            /// </summary>
            [LibDesc("生效")] Valid = 1
        }
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        [Description("帳戶狀態")]
        public enum AccountStatus : byte
        {
            /// <summary>
            /// 停用
            /// </summary>
            [Description("停用")] Unable = 0,
            /// <summary>
            /// 啟用
            /// </summary>
            [Description("啟用")] Enable = 1,
            /// <summary>
            /// 凍結
            /// </summary>
            [Description("凍結")] Freeze = 2,
            /// <summary>
            /// 密碼過期
            /// </summary>
            [Description("密碼過期")] PasuwadoExpired = 3,
            /// <summary>
            /// 主機預設密碼
            /// </summary>
            [Description("主機預設密碼")] HostDefault = 4,
        }
        /// <summary>
        /// 功能權限動作
        /// </summary>
        [Description("功能權限動作"), Flags]
        public enum FuncAction : int
        {
            /// <summary>
            /// 使用
            /// </summary>
            [Description("使用")] Use = 1,
            /// <summary>
            /// 查詢
            /// </summary>
            [Description("查詢")] Query = 2,
            /// <summary>
            /// 新增
            /// </summary>
            [Description("新增")] Create = 4,
            /// <summary>
            /// 修改
            /// </summary>
            [Description("修改")] Update = 8,
            /// <summary>
            /// 刪除
            /// </summary>
            [Description("刪除")] Delete = 16,
            /// <summary>
            /// 作廢
            /// </summary>
            [Description("作廢")] Invalid = 32,
            /// <summary>
            /// 全部
            /// </summary>
            All = 63,
        }
        /// <summary>
        /// 單據狀態
        /// </summary>
        [Description("單據狀態")]
        public enum FormStatus : byte
        {
            /// <summary>
            /// 保存
            /// </summary>
            [Description("保存")] Saved = 0,
            /// <summary>
            /// 審核
            /// </summary>
            [Description("審核")] Approved = 1,
            /// <summary>
            /// 結案
            /// </summary>
            [Description("結案")] EndCase = 2,
            /// <summary>
            /// 作廢
            /// </summary>
            [Description("作廢")] Obsoleted = 3,
        }
        /// <summary>
        /// 過帳狀態
        /// </summary>
        [Description("過帳狀態")]
        public enum TransStatus : byte
        {
            /// <summary>
            /// 無
            /// </summary>
            [Description("無")] None = 0,
            /// <summary>
            /// 正過帳
            /// </summary>
            [Description("正過帳")] Increase = 1,
            /// <summary>
            /// 差異過帳
            /// </summary>
            [Description("差異過帳")] Difference = 2,
            /// <summary>
            /// 反過帳
            /// </summary>
            [Description("反過帳")] Invert = 3,
        }
        /// <summary>
        /// 行狀態
        /// </summary>
        [Description("行狀態")]
        public enum RowState : byte
        {
            /// <summary>
            /// 無異動
            /// </summary>
            [Description("無異動")] None = 0,
            /// <summary>
            /// 新增
            /// </summary>
            [Description("新增")] Insert = 1,
            /// <summary>
            /// 修改
            /// </summary>
            [Description("修改")] Update = 2,
            /// <summary>
            /// 刪除
            /// </summary>
            [Description("刪除")] Delete = 3,
        }
        /// <summary>
        /// 前/後台
        /// </summary>
        [Description("前/後台")]
        public enum EndType : byte
        {
            /// <summary>
            /// 後台
            /// </summary>
            [Description("後台")] Backend = 0,
            /// <summary>
            /// 前台
            /// </summary>
            [Description("前台")] Frontend = 1
        }

        public static class Lang
        {
            // 中文系
            public const string zhTW = "zh-TW"; // 繁體中文（台灣）
            public const string zhCN = "zh-CN"; // 簡體中文（中國）
            public const string zhHK = "zh-HK"; // 繁體中文（香港）

            // 英文系
            public const string enUS = "en-US"; // 英文（美國）
            public const string enGB = "en-GB"; // 英文（英國）

            // 歐洲語系
            public const string deDE = "de-DE"; // 德文（德國）
            public const string frFR = "fr-FR"; // 法文（法國）
            public const string esES = "es-ES"; // 西班牙文（西班牙）
            public const string itIT = "it-IT"; // 義大利文（義大利）

            // 東南亞語系
            public const string thTH = "th-TH"; // 泰文（泰國）
            public const string viVN = "vi-VN"; // 越南文（越南）
            public const string idID = "id-ID"; // 印尼文（印尼）
            public const string msMY = "ms-MY"; // 馬來文（馬來西亞）

            // 東亞語系
            public const string jaJP = "ja-JP"; // 日文（日本）
            public const string koKR = "ko-KR"; // 韓文（韓國）
        }




    }
}
