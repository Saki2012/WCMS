/*
    WCMS 全新 Case 資料庫初始化設定

    執行時機：
    1. 先建立空白資料庫。
    2. 修改下方參數。
    3. 執行本腳本。
    4. 再執行 EF Migration / Update-Database。

    注意：
    - 僅用於全新 Case。
    - 不執行 DBCC SHRINKFILE。
    - 可重複執行，不會將已成長的 MDF／LDF 強制縮小。
*/

USE [master];
GO

-- #region Property

DECLARE @DatabaseName sysname = N'WCMS1817';
DECLARE @DataInitialSizeMB int = 256;
DECLARE @DataFileGrowthMB int = 128;
DECLARE @LogInitialSizeMB int = 500;
DECLARE @LogFileGrowthMB int = 128;



-- #endregion

-- #region Initialization

/** 驗證指定資料庫是否已建立。 */
IF DB_ID(@DatabaseName) IS NULL
BEGIN
    THROW 50001, N'指定的 WCMS 資料庫不存在，請先建立空白資料庫。', 1;
END;

/** 取得資料庫主要 MDF 與 LDF 的 Logical File Name。 */
DECLARE @DataLogicalName sysname;
DECLARE @LogLogicalName sysname;
DECLARE @CurrentDataSizeMB decimal(18, 2);
DECLARE @CurrentLogSizeMB decimal(18, 2);

SELECT TOP (1)
    @DataLogicalName = [name],
    @CurrentDataSizeMB = [size] * 8.0 / 1024
FROM sys.master_files
WHERE database_id = DB_ID(@DatabaseName)
    AND [type] = 0
ORDER BY file_id;

SELECT TOP (1)
    @LogLogicalName = [name],
    @CurrentLogSizeMB = [size] * 8.0 / 1024
FROM sys.master_files
WHERE database_id = DB_ID(@DatabaseName)
    AND [type] = 1
ORDER BY file_id;

/** 驗證資料庫具備主要資料檔與交易記錄檔。 */
IF @DataLogicalName IS NULL OR @LogLogicalName IS NULL
BEGIN
    THROW 50002, N'無法取得資料庫的 MDF 或 LDF Logical File Name。', 1;
END;

-- #endregion

-- #region Database Setting

DECLARE @Sql nvarchar(max);

/** 設定 WCMS 採用 SIMPLE Recovery Model。 */
SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
    + N' SET RECOVERY SIMPLE;';
EXEC sys.sp_executesql @Sql;

/** 關閉自動壓縮，避免資料庫反覆 Shrink 與成長。 */
SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
    + N' SET AUTO_SHRINK OFF;';
EXEC sys.sp_executesql @Sql;

/** 關閉自動關閉，避免正式站資料庫頻繁關閉與重新開啟。 */
SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
    + N' SET AUTO_CLOSE OFF;';
EXEC sys.sp_executesql @Sql;

/** 啟用 Page Checksum，協助偵測資料頁損毀。 */
SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
    + N' SET PAGE_VERIFY CHECKSUM;';
EXEC sys.sp_executesql @Sql;

-- #endregion

-- #region File Setting

/** 設定 MDF 固定 Autogrowth，僅在目前小於目標時增加初始容量。 */
SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
    + N' MODIFY FILE (NAME = ' + QUOTENAME(@DataLogicalName, '''')
    + CASE
        WHEN @CurrentDataSizeMB < @DataInitialSizeMB
            THEN N', SIZE = ' + CAST(@DataInitialSizeMB AS nvarchar(20)) + N'MB'
        ELSE N''
      END
    + N', FILEGROWTH = ' + CAST(@DataFileGrowthMB AS nvarchar(20)) + N'MB);';
EXEC sys.sp_executesql @Sql;

/** 設定 LDF 固定 Autogrowth，僅在目前小於目標時增加初始容量。 */
SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
    + N' MODIFY FILE (NAME = ' + QUOTENAME(@LogLogicalName, '''')
    + CASE
        WHEN @CurrentLogSizeMB < @LogInitialSizeMB
            THEN N', SIZE = ' + CAST(@LogInitialSizeMB AS nvarchar(20)) + N'MB'
        ELSE N''
      END
    + N', FILEGROWTH = ' + CAST(@LogFileGrowthMB AS nvarchar(20)) + N'MB);';
EXEC sys.sp_executesql @Sql;

-- #endregion

-- #region Validation

/** 輸出資料庫層級設定結果。 */
SELECT
    [name] AS DatabaseName,
    recovery_model_desc AS RecoveryModel,
    log_reuse_wait_desc AS LogReuseWait,
    is_auto_shrink_on AS IsAutoShrink,
    is_auto_close_on AS IsAutoClose,
    page_verify_option_desc AS PageVerify
FROM sys.databases
WHERE [name] = @DatabaseName;

/** 輸出 MDF／LDF 路徑、大小與成長設定。 */
SELECT
    [name] AS LogicalFileName,
    type_desc AS FileType,
    physical_name AS PhysicalPath,
    CAST([size] * 8.0 / 1024 AS decimal(18, 2)) AS SizeMB,
    CASE
        WHEN is_percent_growth = 1
            THEN CAST(growth AS nvarchar(20)) + N'%'
        ELSE CAST(growth * 8.0 / 1024 AS nvarchar(20)) + N' MB'
    END AS FileGrowth,
    CASE
        WHEN max_size = -1 THEN N'Unlimited'
        ELSE CAST(max_size * 8.0 / 1024 AS nvarchar(20)) + N' MB'
    END AS MaxSize
FROM sys.master_files
WHERE database_id = DB_ID(@DatabaseName)
ORDER BY [type], file_id;

-- #endregion