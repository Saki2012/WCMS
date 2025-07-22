using WCMS.SysCore.Library;
using System.ComponentModel;

namespace WCMS.SysCore.Enum
{
    public class SysEnum
    {
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc]
        public enum DataStatus : byte
        {
            /// <summary>
            /// 作廢
            /// </summary>
            [LibDesc] Invalid = 0,
            /// <summary>
            /// 生效
            /// </summary>
            [LibDesc] Valid = 1
        }
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        [LibDesc]
        public enum AccountStatus : byte
        {
            /// <summary>
            /// 停用
            /// </summary>
            [LibDesc] Unable = 0,
            /// <summary>
            /// 啟用
            /// </summary>
            [LibDesc] Enable = 1,
            /// <summary>
            /// 凍結
            /// </summary>
            [LibDesc] Freeze = 2,
            /// <summary>
            /// 密碼過期
            /// </summary>
            [LibDesc] PasuwadoExpired = 3,
            /// <summary>
            /// 主機預設密碼
            /// </summary>
            [LibDesc] HostDefault = 4,
        }
        /// <summary>
        /// 功能權限動作
        /// </summary>
        [LibDesc, Flags]
        public enum FuncAction : int
        {
            /// <summary>
            /// 使用
            /// </summary>
            [LibDesc] Use = 1,
            /// <summary>
            /// 查詢
            /// </summary>
            [LibDesc] Query = 2,
            /// <summary>
            /// 新增
            /// </summary>
            [LibDesc] Create = 4,
            /// <summary>
            /// 修改
            /// </summary>
            [LibDesc] Update = 8,
            /// <summary>
            /// 刪除
            /// </summary>
            [LibDesc] Delete = 16,
            /// <summary>
            /// 作廢
            /// </summary>
            [LibDesc] Invalid = 32,
            /// <summary>
            /// 全部
            /// </summary>
            All = 63,
        }
        /// <summary>
        /// 單據狀態
        /// </summary>
        [LibDesc]
        public enum FormStatus : byte
        {
            /// <summary>
            /// 保存
            /// </summary>
            [LibDesc] Saved = 0,
            /// <summary>
            /// 審核
            /// </summary>
            [LibDesc] Approved = 1,
            /// <summary>
            /// 結案
            /// </summary>
            [LibDesc] EndCase = 2,
            /// <summary>
            /// 作廢
            /// </summary>
            [LibDesc] Obsoleted = 3,
        }
        /// <summary>
        /// 過帳狀態
        /// </summary>
        [LibDesc]
        public enum TransStatus : byte
        {
            /// <summary>
            /// 無
            /// </summary>
            [LibDesc] None = 0,
            /// <summary>
            /// 正過帳
            /// </summary>
            [LibDesc] Increase = 1,
            /// <summary>
            /// 差異過帳
            /// </summary>
            [LibDesc] Difference = 2,
            /// <summary>
            /// 反過帳
            /// </summary>
            [LibDesc] Invert = 3,
        }
        /// <summary>
        /// 行狀態
        /// </summary>
        [LibDesc]
        public enum RowState : byte
        {
            /// <summary>
            /// 無異動
            /// </summary>
            [LibDesc] None = 0,
            /// <summary>
            /// 新增
            /// </summary>
            [LibDesc] Insert = 1,
            /// <summary>
            /// 修改
            /// </summary>
            [LibDesc] Update = 2,
            /// <summary>
            /// 刪除
            /// </summary>
            [LibDesc] Delete = 3,
        }
        /// <summary>
        /// 前/後台
        /// </summary>
        [LibDesc]
        public enum EndType : byte
        {
            /// <summary>
            /// 後台
            /// </summary>
            [LibDesc] Backend = 0,
            /// <summary>
            /// 前台
            /// </summary>
            [LibDesc] Frontend = 1
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
        /// <summary>
        /// 訊息狀態
        /// </summary>
        public enum MessageStatus : byte
        {
            /// <summary>
            /// 執行成功
            /// </summary>
            Green,
            /// <summary>
            /// 訊息
            /// </summary>
            Info,
            /// <summary>
            /// 警告
            /// </summary>
            Warning,
            /// <summary>
            /// 錯誤
            /// </summary>
            Error,
        }


    }
}
