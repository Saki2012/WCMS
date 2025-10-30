using WCMS.SysCore.Library;
using System.ComponentModel;
using WCMS.SysCore.Resx;

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
            Green = 0,
            /// <summary>
            /// 訊息
            /// </summary>
            Info = 1,
            /// <summary>
            /// 警告
            /// </summary>
            Warning = 2,
            /// <summary>
            /// 錯誤
            /// </summary>
            Error = 3,
        }
        /// <summary>
        /// 檔案狀態
        /// </summary>
        public enum FileStatus : byte
        {
            None = 0,       // 尚未處理（理論上不應出現，或是刪除失敗(找不到檔案時）)
            Pending = 1,    // 預上傳完成，尚未正式儲存
            Success = 2,    // 已完成儲存與轉移（正式檔案）
            Deleted = 3,    // 標記已刪除（保留資料庫紀錄，可後續追溯）
            InProgress = 4,   // 傳輸中
            Failed = 5,     // 傳輸失敗
            Skipped = 6,    // 來源目的地相同、已存在可跳過
            Canceled = 7,   // 取消上傳
        }
        /// <summary>
        /// 檔案格式
        /// </summary>
        public static class FileExtensions
        {
            #region 文字檔案
            public const string PDF = "pdf";
            public const string DOCX = "docx";
            public const string ODT = "odt";
            public const string XLSX = "xlsx";
            public const string PPTX = "pptx";
            public const string TXT = "txt";
            public const string CSV = "csv";
            #endregion
            #region 圖片
            public const string JPG = "jpg";
            public const string JPEG = "jpeg";
            public const string PNG = "png";
            public const string GIF = "gif";
            public const string BMP = "bmp";
            public const string WEBP = "webp";
            public const string SVG = "svg";
            #endregion
            #region 壓縮檔案
            public const string ZIP = "zip";
            public const string RAR = "rar";
            public const string _7Z = "7z";
            #endregion
            #region 影音
            public const string MP3 = "mp3";
            public const string WAV = "wav";
            public const string MP4 = "mp4";
            public const string MOV = "mov";
            public const string MKV = "mkv";
            #endregion
        }
        /// <summary>
        /// 網際網路媒體類型
        /// </summary>
        public static class MimeTypes
        {
            #region 文字檔案
            public const string APPLICATION_PDF = "application/pdf";
            public const string APPLICATION_MSWORD = "application/msword";
            public const string APPLICATION_VND_OPENXML_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            public const string APPLICATION_VND_EXCEL = "application/vnd.ms-excel";
            public const string APPLICATION_VND_OPENXML_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            public const string APPLICATION_VND_POWERPOINT = "application/vnd.ms-powerpoint";
            public const string APPLICATION_VND_OPENXML_POWERPOINT = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            public const string TEXT_PLAIN = "text/plain";
            public const string TEXT_CSV = "text/csv";
            #endregion
            #region 圖片
            public const string IMAGE_JPEG = "image/jpeg";
            public const string IMAGE_PNG = "image/png";
            public const string IMAGE_GIF = "image/gif";
            public const string IMAGE_BMP = "image/bmp";
            public const string IMAGE_WEBP = "image/webp";
            public const string IMAGE_SVG_XML = "image/svg+xml";
            #endregion
            #region 壓縮檔案
            public const string APPLICATION_ZIP = "application/zip";
            public const string APPLICATION_VND_RAR = "application/vnd.rar";
            public const string APPLICATION_X_7Z_COMPRESSED = "application/x-7z-compressed";
            #endregion
            #region 影音
            public const string AUDIO_MPEG = "audio/mpeg";
            public const string AUDIO_WAV = "audio/wav";
            public const string VIDEO_MP4 = "video/mp4";
            public const string VIDEO_QUICKTIME = "video/quicktime";
            #endregion
        }
        /// 內文項目狀態
        /// 目前提供至 公告/檔案室/網路資源/相簿 功能用到
        /// </summary>
        [Flags]
        public enum ContentStatus : byte
        {
            /// <summary>
            /// 無
            /// </summary>
            None = 0,
            /// <summary>
            /// 置頂
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Top)]Top = 1 << 0,
            /// <summary>
            /// 熱門
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Hot)] Hot = 1 << 1,
            /// <summary>
            /// 隱藏
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Hidden)] Hidden = 1 << 2
        }
        /// <summary>
        /// 連結方式
        /// </summary>
        public enum MenuUrlType : byte
        {
            /// <summary>
            /// 外部連結
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Url)] Url = 1,
            /// <summary>
            /// 內部連結
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Module)] Module = 2,
        }
        /// <summary>
        /// 
        /// </summary>
        public enum WindowTarget : byte
        {
            [LibDesc(ModelDisplayName.Enum_WindowTarget_Self)] Self = 0,   // _self (當前頁面)
            [LibDesc(ModelDisplayName.Enum_WindowTarget_Blank)] Blank = 1,  // _blank (新開分頁/視窗)

            //Parent = 2, // _parent (父層框架)
            //Top = 3,    // _top (最上層框架)
            //Named = 4   // 自訂視窗名稱
        }

        /// <summary>
        /// 模型頁面樣式
        /// </summary>
        public enum ModulePageType : byte
        {
            /// <summary>
            /// 雙欄式
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_TwoColumn)]TwoColumn=0,
            /// <summary>
            /// 直瀑式
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Vertical)]Vertical=1,
        }
        /// <summary>
        /// 模型功能顯示方式
        /// </summary>
        public enum ModuleDisplayStyle : byte
        {
            /// <summary>
            /// 清單列表式
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_List)] List =1,
            /// <summary>
            /// 圖文式
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_PictureList)] PictureList =2,
            /// <summary>
            /// QA列表式
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_QAList)] QAList =3,
            /// <summary>
            /// 瀑布式
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Waterfall)] Waterfall =4,
            /// <summary>
            /// 展開式(類別)
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Expand_Category)] Expand_Category =5,
            /// <summary>
            /// 展開式(標籤)
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Expand_Tag)] Expand_Tag =6,
            /// <summary>
            /// Youtube
            /// </summary>
            [LibDesc(ModelDisplayName.Enum_Youtube)] Youtube =7
        }


    }
}
