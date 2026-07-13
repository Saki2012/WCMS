/*
    WCMS 既有 Case 交易記錄檔一次性修復腳本

    用途：
    1. 將指定資料庫 Recovery Model 調整為 SIMPLE。
    2. 執行 CHECKPOINT。
    3. 將主要 LDF 一次性縮小至指定容量。
    4. 將 LDF Autogrowth 設為固定 MB。
    5. 輸出執行前後結果。

    執行原則：
    - 僅用於既有 Case 的 LDF 異常膨脹修復。
    - 請勿加入每日、每週或其他固定排程。
    - 執行前應先完成完整 BAK，並確認目前沒有 Migration、
      大量匯入、批次更新或長時間交易正在執行。
    - 本腳本只處理主要交易記錄檔。
*/

USE [master];
GO

-- #region Property

/** 指定要修復的 WCMS 資料庫名稱。 */
DECLARE @DatabaseName sysname = N'WCMS1817';

/** 指定 LDF 修復後的目標容量，單位為 MB。 */
DECLARE @TargetLogSizeMB int = 500;

/** 指定 LDF 後續固定自動成長量，單位為 MB。 */
DECLARE @LogFileGrowthMB int = 128;

/** 是否將 Recovery Model 調整為 SIMPLE。 */
DECLARE @SetRecoverySimple bit = 1;

-- #endregion

-- #region Validation

/** 驗證資料庫是否存在。 */
IF DB_ID(@DatabaseName) IS NULL
BEGIN
    THROW 50001, N'指定的資料庫不存在，請確認 @DatabaseName。', 1;
END;

/** 驗證容量參數是否合理。 */
IF @TargetLogSizeMB <= 0 OR @LogFileGrowthMB <= 0
BEGIN
    THROW 50002, N'LDF 目標容量與自動成長量必須大於 0 MB。', 1;
END;

/** 驗證資料庫目前是否為 ONLINE。 */
IF EXISTS
(
    SELECT 1
    FROM sys.databases
    WHERE [name] = @DatabaseName
        AND state_desc <> N'ONLINE'
)
BEGIN
    THROW 50003, N'指定的資料庫目前不是 ONLINE，停止執行。', 1;
END;

/** 取得主要交易記錄檔的 Logical File Name。 */
DECLARE @LogLogicalName sysname;

SELECT TOP (1)
    @LogLogicalName = [name]
FROM sys.master_files
WHERE database_id = DB_ID(@DatabaseName)
    AND [type] = 1
ORDER BY file_id;

IF @LogLogicalName IS NULL
BEGIN
    THROW 50004, N'無法取得資料庫的主要交易記錄檔。', 1;
END;

-- #endregion

-- #region Before State

/** 輸出修復前的資料庫與 LDF 狀態。 */
SELECT
    [name] AS DatabaseName,
    recovery_model_desc AS RecoveryModel,
    log_reuse_wait_desc AS LogReuseWait
FROM sys.databases
WHERE [name] = @DatabaseName;

SELECT
    [name] AS LogicalFileName,
    type_desc AS FileType,
    physical_name AS PhysicalPath,
    CAST([size] * 8.0 / 1024 AS decimal(18, 2)) AS SizeMB,
    CASE
        WHEN is_percent_growth = 1
            THEN CAST(growth AS nvarchar(20)) + N'%'
        ELSE CAST(growth * 8.0 / 1024 AS nvarchar(20)) + N' MB'
    END AS FileGrowth
FROM sys.master_files
WHERE database_id = DB_ID(@DatabaseName)
    AND [type] = 1;

-- #endregion

-- #region Repair

DECLARE @Sql nvarchar(max);

/** 依參數將資料庫 Recovery Model 調整為 SIMPLE。 */
IF @SetRecoverySimple = 1
BEGIN
    SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
        + N' SET RECOVERY SIMPLE;';
    EXEC sys.sp_executesql @Sql;
END;

/** 執行 Checkpoint 並一次性縮小主要交易記錄檔。 */
SET @Sql = N'USE ' + QUOTENAME(@DatabaseName) + N';
CHECKPOINT;
DBCC SHRINKFILE
(
    ' + QUOTENAME(@LogLogicalName, '''') + N',
    ' + CAST(@TargetLogSizeMB AS nvarchar(20)) + N'
)
WITH NO_INFOMSGS;';
EXEC sys.sp_executesql @Sql;

/** 將 LDF 自動成長調整為固定 MB。 */
SET @Sql = N'ALTER DATABASE ' + QUOTENAME(@DatabaseName)
    + N' MODIFY FILE
(
    NAME = ' + QUOTENAME(@LogLogicalName, '''') + N',
    FILEGROWTH = ' + CAST(@LogFileGrowthMB AS nvarchar(20)) + N'MB
);';
EXEC sys.sp_executesql @Sql;

-- #endregion

-- #region Result

/** 輸出修復後的資料庫與 LDF 狀態。 */
SELECT
    [name] AS DatabaseName,
    recovery_model_desc AS RecoveryModel,
    log_reuse_wait_desc AS LogReuseWait
FROM sys.databases
WHERE [name] = @DatabaseName;

SELECT
    [name] AS LogicalFileName,
    type_desc AS FileType,
    physical_name AS PhysicalPath,
    CAST([size] * 8.0 / 1024 AS decimal(18, 2)) AS SizeMB,
    CASE
        WHEN is_percent_growth = 1
            THEN CAST(growth AS nvarchar(20)) + N'%'
        ELSE CAST(growth * 8.0 / 1024 AS nvarchar(20)) + N' MB'
    END AS FileGrowth
FROM sys.master_files
WHERE database_id = DB_ID(@DatabaseName)
    AND [type] = 1;

DBCC SQLPERF(LOGSPACE);

-- #endregion