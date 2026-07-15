using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Text;
using System.Text.RegularExpressions;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.Persistence.Models;
using WCMS.SysCore.Constants;

namespace WCMS.SysCore.Persistence
{
    /// <summary>
    /// 提供資料庫環境檢查與基礎資料庫物件初始化。
    /// </summary>
    public static class PersistenceInitializer
    {
        #region Property
        /// <summary>
        /// 資料庫環境識別使用的 SpecCode 設定鍵。
        /// </summary>
        private const string SpecCodeKey = nameof(SpecSettings.SpecCode);
        /// <summary>
        /// SysCore 預設資料夾名稱。
        /// </summary>
        private const string SysCoreFolderName = "SysCore";
        /// <summary>
        /// Persistence 預設資料夾名稱。
        /// </summary>
        private const string PersistenceFolderName = "Persistence";
        /// <summary>
        /// UDF 預設資料夾名稱。
        /// </summary>
        private const string UdfFolderName = "Udf";
        /// <summary>
        /// UDF SQL 檔案搜尋條件。
        /// </summary>
        private const string SqlFilePattern = "*.sql";
        /// <summary>
        /// SQL Server 批次分隔語法。
        /// </summary>
        private const string SqlBatchPattern = @"^\s*GO\s*(?:--.*)?$\r?$";
        #endregion

        #region Public
        /// <summary>
        /// 確保資料庫 SpecCode 與目前執行中的系統 SpecCode 一致。
        /// </summary>
        public static async Task EnsureDbSpecCodeAsync(ApplicationDbContext db)
        {
            string appSpecCode = SpecSettings.SpecCode?.Trim() ?? string.Empty;
            SysDbProfile? profile = await db.SysDbProfile.FirstOrDefaultAsync(p => p.ProfileKey == SpecCodeKey);
            if (profile == null)
            {
                await CreateDbProfileAsync(db, appSpecCode);
                return;
            }
            ValidateSpecCode(profile.ProfileValue, appSpecCode);
        }

        /// <summary>
        /// 讀取並註冊 Persistence/Udf 內的所有 SQL 函式。
        /// </summary>
        public static async Task RegistUDFAsync(IConfiguration cfg, IWebHostEnvironment env, ApplicationDbContext db)
        {
            string udfPath = ResolveUdfPath(cfg, env);
            string[] files = GetSqlFiles(udfPath);
            if (files.Length == 0) return;
            var connection = (SqlConnection)db.Database.GetDbConnection();
            await connection.OpenAsync();
            try
            {
                await ExecuteUdfFilesAsync(connection, files);
            }
            finally
            {
                await connection.CloseAsync();
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 建立資料庫初次使用的 SpecCode 環境識別資料。
        /// </summary>
        private static async Task CreateDbProfileAsync(ApplicationDbContext db, string appSpecCode)
        {
            DateTime now = DateTime.Now;
            db.SysDbProfile.Add(new SysDbProfile { ProfileKey = SpecCodeKey, ProfileValue = appSpecCode, CreateTime = now, ModifyTime = now });
            await db.SaveChangesAsync();
        }

        /// <summary>
        /// 驗證資料庫與目前系統使用相同的 SpecCode。
        /// </summary>
        private static void ValidateSpecCode(string? profileValue, string appSpecCode)
        {
            string dbSpecCode = profileValue?.Trim() ?? string.Empty;
            if (string.Equals(dbSpecCode, appSpecCode, StringComparison.Ordinal)) return;
            throw new InvalidOperationException($@"
DB SpecCode 檢查未通過。App SpecCode = '{FormatSpecCode(appSpecCode)}'，DB SpecCode = '{FormatSpecCode(dbSpecCode)}'。
目前程式與資料庫不屬於同一個 Spec，請確認升級目標 DB、連線字串、SpecCode 設定是否正確。");
        }
        /// <summary>
        /// 格式化 SpecCode，讓空字串可在錯誤訊息中清楚辨識。
        /// </summary>
        private static string FormatSpecCode(string specCode)
        {
            return string.IsNullOrWhiteSpace(specCode) ? "(empty)" : specCode;
        }
        /// <summary>
        /// 取得自訂或系統預設的 UDF SQL 目錄。
        /// </summary>
        private static string ResolveUdfPath(IConfiguration cfg, IWebHostEnvironment env)
        {
            string? configuredPath = cfg[SysParam.Configuration.DbInit.UdfPathPath];
            if (!string.IsNullOrWhiteSpace(configuredPath)) return configuredPath;
            return Path.Combine(env.ContentRootPath, SysCoreFolderName, PersistenceFolderName, UdfFolderName);
        }
        /// <summary>
        /// 取得 UDF 目錄內依路徑排序的所有 SQL 檔案。
        /// </summary>
        private static string[] GetSqlFiles(string udfPath)
        {
            if (!Directory.Exists(udfPath)) return [];
            return [.. Directory.EnumerateFiles(udfPath, SqlFilePattern, SearchOption.AllDirectories).OrderBy(path => path, StringComparer.OrdinalIgnoreCase)];
        }
        /// <summary>
        /// 依序執行所有 UDF SQL 檔案。
        /// </summary>
        private static async Task ExecuteUdfFilesAsync(SqlConnection connection, IEnumerable<string> files)
        {
            foreach (string file in files) await ExecuteUdfFileAsync(connection, file);
        }
        /// <summary>
        /// 以獨立交易執行單一 UDF SQL 檔案。
        /// </summary>
        private static async Task ExecuteUdfFileAsync(SqlConnection connection, string file)
        {
            string[] batches = await ReadSqlBatchesAsync(file);
            using SqlTransaction transaction = connection.BeginTransaction();
            try
            {
                await ExecuteSqlBatchesAsync(connection, transaction, batches);
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// 讀取 SQL 檔案並依 GO 語法拆分可執行批次。
        /// </summary>
        private static async Task<string[]> ReadSqlBatchesAsync(string file)
        {
            string sqlText = await File.ReadAllTextAsync(file, Encoding.UTF8);
            return [.. Regex.Split(sqlText, SqlBatchPattern, RegexOptions.Multiline | RegexOptions.IgnoreCase).Select(batch => batch.Trim()).Where(batch => !string.IsNullOrWhiteSpace(batch))];
        }
        /// <summary>
        /// 在指定交易中依序執行 SQL 批次。
        /// </summary>
        private static async Task ExecuteSqlBatchesAsync(SqlConnection connection, SqlTransaction transaction, IEnumerable<string> batches)
        {
            foreach (string batch in batches)
            {
                using var command = new SqlCommand(batch, connection, transaction)
                {
                    CommandType = CommandType.Text
                };
                await command.ExecuteNonQueryAsync();
            }
        }
        #endregion
    }
}