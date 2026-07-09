using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library.LibAttribute;

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
        [LibDesc(DisplayName.Enum_AccountStatus)]
        public enum AccountStatus : byte
        {
            /// <summary>
            /// 停用
            /// </summary>
            [LibDesc(DisplayName.Enum_AccountStatus_Unable)] Unable = 0,
            /// <summary>
            /// 啟用
            /// </summary>
            [LibDesc(DisplayName.Enum_AccountStatus_Enable)] Enable = 1,
        }
        /// <summary>
        /// 功能權限動作
        /// 注1:不允許修改規則邏輯，僅能往下擴充
        /// 注2:若大小不夠，就改其他型別
        /// byte:8個
        /// short:16個
        /// int:32個
        /// long:64個
        /// </summary>
        [LibDesc, Flags]
        public enum FuncAction : int
        {
            #region Basic Actions
            [LibDesc(DisplayName.Enum_FuncAction_None)] None = 0,
            /// <summary>
            /// 使用
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Use)] Use = 1,
            /// <summary>
            /// 查詢清單
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Query)] Query = 2,
            /// <summary>
            /// 查看資料
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_View)] View = 4,
            /// <summary>
            /// 新增
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Create)] Create = 8,
            /// <summary>
            /// 修改
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Update)] Update = 16,
            /// <summary>
            /// 刪除
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Delete)] Delete = 32,
            /// <summary>
            /// 作廢
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Invalid)] Invalid = 64,
            #endregion

            #region Composite Actions
            /// <summary>
            /// 基礎資料權限
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_MasterData)] MasterData = Use | Query | View | Create | Update | Delete,
            /// <summary>
            /// 流水單權限
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_BillData)] BillData = Use | Query | View | Create | Update | Delete | Invalid,
            /// <summary>
            /// 報表權限
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Report)] Report = Use | Query | View,
            /// <summary>
            /// 功能權限
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_Report)] Function = Use | Query | View,
            /// <summary>
            /// 全部權限
            /// </summary>
            [LibDesc(DisplayName.Enum_FuncAction_All)] All = Use | Query | View | Create | Update | Delete | Invalid,
            #endregion
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

        /// <summary>
        /// 依賴類型
        /// </summary>
        public enum MonitorDependencyType : byte
        {
            /// <summary>
            /// 資料庫
            /// </summary>
            Database = 1,
            /// <summary>
            /// Redis
            /// </summary>
            Redis = 2,
            /// <summary>
            /// 第三方服務
            /// </summary>
            ExternalApp = 3,
        }

        /// <summary>
        /// 監控健康狀態
        /// </summary>
        public enum MonitorHealthStatus : byte
        {
            /// <summary>
            /// 正常
            /// </summary>
            Normal = 0,

            /// <summary>
            /// 警告
            /// </summary>
            Warning = 1,

            /// <summary>
            /// 異常
            /// </summary>
            Critical = 2,
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
            public const string DOC = "doc";
            public const string ODT = "odt";
            public const string XLSX = "xlsx";
            public const string XLS = "xls";
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
            public const string M4A = "m4a";
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
            public const string APPLICATION_ODT = "application/vnd.oasis.opendocument.text";
            public const string APPLICATION_VND_OPENXML_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            public const string APPLICATION_VND_EXCEL = "application/vnd.ms-excel";
            public const string APPLICATION_VND_OPENXML_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            public const string APPLICATION_VND_POWERPOINT = "application/vnd.ms-powerpoint";
            public const string APPLICATION_VND_OPENXML_POWERPOINT = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            public const string TEXT_PLAIN = "text/plain";
            public const string TEXT_CSV = "text/csv";
            public const string APPLICATION_EXCEL = "application/excel";
            public const string APPLICATION_X_EXCEL = "application/x-excel";
            public const string APPLICATION_X_MSEXCEL = "application/x-msexcel";
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
            public const string AUDIO_MP4 = "audio/mp4";
            public const string VIDEO_QUICKTIME = "video/quicktime";
            public const string VIDEO_MP4 = "video/mp4";
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
            [LibDesc(DisplayName.Enum_Top)]Top = 1 << 0,
            /// <summary>
            /// 熱門
            /// </summary>
            [LibDesc(DisplayName.Enum_Hot)] Hot = 1 << 1,
            /// <summary>
            /// 隱藏
            /// </summary>
            [LibDesc(DisplayName.Enum_Hidden)] Hidden = 1 << 2
        }
        /// <summary>
        /// 連結方式
        /// </summary>
        public enum MenuUrlType : byte
        {
            /// <summary>
            /// 外部連結
            /// </summary>
            [LibDesc(DisplayName.Enum_Url)] Url = 1,
            /// <summary>
            /// 內部連結
            /// </summary>
            [LibDesc(DisplayName.Enum_Module)] Module = 2,
        }
        /// <summary>
        /// 
        /// </summary>
        public enum WindowTarget : byte
        {
            [LibDesc(DisplayName.Enum_WindowTarget_Self)] Self = 0,   // _self (當前頁面)
            [LibDesc(DisplayName.Enum_WindowTarget_Blank)] Blank = 1,  // _blank (新開分頁/視窗)
            //Parent = 2, // _parent (父層框架)
            //Top = 3,    // _top (最上層框架)
            //Named = 4   // 自訂視窗名稱
        }
        /// <summary>
        /// 性別
        /// </summary>
        [LibDesc(DisplayName.Enum_Gender)] public enum Gender : byte
        {
            /// <summary>
            /// 未知
            /// </summary>
            [LibDesc(DisplayName.Enum_Gender_NotKnown)] NotKnown = 0,
            /// <summary>
            /// 男性
            /// </summary>
            [LibDesc(DisplayName.Enum_Gender_Male)] Male = 1,
            /// <summary>
            /// 女性
            /// </summary>
            [LibDesc(DisplayName.Enum_Gender_Female)] Female = 2,
        }

        /// <summary>
        /// 模型頁面樣式
        /// </summary>
        public enum ModulePageType : byte
        {
            /// <summary>
            /// 側欄選單版型
            /// </summary>
            [LibDesc(DisplayName.Enum_SidebarMenu)] SidebarMenu = 0,
            /// <summary>
            /// 滿版內容版型
            /// </summary>
            [LibDesc(DisplayName.Enum_FullContent)] FullContent = 1,
        }
        /// <summary>
        /// 模型功能顯示方式
        /// </summary>
        public enum ModuleDisplayStyle : byte
        {
            /// <summary>
            /// 清單列表式
            /// </summary>
            [LibDesc(DisplayName.Enum_List)] List = 1,
            /// <summary>
            /// 圖文式
            /// </summary>
            [LibDesc(DisplayName.Enum_PictureList)] PictureList = 2,
            /// <summary>
            /// QA列表式
            /// </summary>
            [LibDesc(DisplayName.Enum_QAList)] QAList = 3,
            /// <summary>
            /// 瀑布式
            /// </summary>
            [Obsolete, LibDesc(DisplayName.Enum_Waterfall)] Waterfall = 4,
            /// <summary>
            /// 展開式(類別)
            /// </summary>
            [Obsolete, LibDesc(DisplayName.Enum_Expand_Category)] Expand_Category = 5,
            /// <summary>
            /// 展開式(標籤)
            /// </summary>
            [Obsolete, LibDesc(DisplayName.Enum_Expand_Tag)] Expand_Tag = 6,
            /// <summary>
            /// Youtube
            /// </summary>
            [Obsolete, LibDesc(DisplayName.Enum_Youtube)] Youtube = 7,
            /// <summary>
            /// 歷史時間軸
            /// </summary>
            [LibDesc(DisplayName.Enum_TimelineSlider)] TimelineSlider = 8,
        }
        /// <summary>
        /// 前台瀏覽次數統計的行為類型
        /// </summary>
        [LibDesc(DisplayName.Enum_ViewCountActionType)]
        public enum ViewCountActionType
        {
            /// <summary>
            /// 頁面瀏覽
            /// </summary>
            [LibDesc(DisplayName.Enum_ViewCountActionType_PageView)] PageView = 1,
            /// <summary>
            /// 檔案預覽 (如PDF、圖片等，直接在瀏覽器開啟的檔案)
            /// </summary>
            [LibDesc(DisplayName.Enum_ViewCountActionType_FilePreview)] FilePreview = 2,
            /// <summary>
            /// 檔案下載
            /// </summary>
            [LibDesc(DisplayName.Enum_ViewCountActionType_FileDownload)] FileDownload = 3,
            /// <summary>
            /// 點擊連結
            /// </summary>
            [LibDesc(DisplayName.Enum_ViewCountActionType_LinkClick)] LinkClick = 4,
        }
        /// <summary>
        /// 欄位輸入類型
        /// </summary>
        [LibDesc(DisplayName.Enum_LibInputType)]
        public enum LibInputType:byte
        {
            /// <summary>
            /// 單行文字
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Text)] Text = 1,
            /// <summary>
            /// 多行文字
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_TextArea)] TextArea = 2,
            /// <summary>
            /// Email
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Email)] Email = 3,
            /// <summary>
            /// 電話
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Phone)] Phone = 4,
            /// <summary>
            /// 數字
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Number)] Number = 5,
            /// <summary>
            /// 日期
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Date)] Date = 6,
            /// <summary>
            /// 單選
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Radio)] Radio = 10,
            /// <summary>
            /// 下拉單選
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Select)] Select = 11,
            /// <summary>
            /// 多選
            /// </summary>
            [LibDesc(DisplayName.Enum_LibInputType_Checkbox)] Checkbox = 20
        }
    }
}
