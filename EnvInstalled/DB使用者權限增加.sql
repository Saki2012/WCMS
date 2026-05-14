/* ============================================================
   WCMS - 建立後端資料庫連線帳號
   用途：
   1. 建立 SQL Server Login
   2. 建立指定 Database User
   3. 授予後端基本讀寫權限
   4. 授予啟動時註冊/更新 UDF 所需權限
   ============================================================ */

DECLARE @DatabaseName sysname = N'WCMS1819';
DECLARE @LoginName sysname = N'WebDevloper';
DECLARE @Password nvarchar(256) = N'WebDevloper';

DECLARE @Sql nvarchar(max);
DECLARE @LoginNameText nvarchar(300) = REPLACE(@LoginName, '''', '''''');
DECLARE @PasswordText nvarchar(600) = REPLACE(@Password, '''', '''''');

IF DB_ID(@DatabaseName) IS NULL
BEGIN
    THROW 50001, N'指定的資料庫不存在，請確認 @DatabaseName。', 1;
END;


/* ============================================================
   建立 / 更新 SQL Server Login
   ============================================================ */

USE [master];

IF NOT EXISTS (
    SELECT 1
    FROM sys.sql_logins
    WHERE [name] = @LoginName
)
BEGIN
    SET @Sql = N'
        CREATE LOGIN ' + QUOTENAME(@LoginName) + N'
        WITH PASSWORD = N''' + @PasswordText + N''',
             DEFAULT_DATABASE = ' + QUOTENAME(@DatabaseName) + N',
             CHECK_POLICY = OFF,
             CHECK_EXPIRATION = OFF;
    ';

    EXEC sys.sp_executesql @Sql;
END;

SET @Sql = N'ALTER LOGIN ' + QUOTENAME(@LoginName) + N' ENABLE;';
EXEC sys.sp_executesql @Sql;

SET @Sql = N'ALTER LOGIN ' + QUOTENAME(@LoginName) + N' WITH DEFAULT_DATABASE = ' + QUOTENAME(@DatabaseName) + N';';
EXEC sys.sp_executesql @Sql;


/* ============================================================
   建立 / 修復 Database User
   ============================================================ */

SET @Sql = N'
USE ' + QUOTENAME(@DatabaseName) + N';

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE [name] = N''' + @LoginNameText + N'''
)
BEGIN
    CREATE USER ' + QUOTENAME(@LoginName) + N' FOR LOGIN ' + QUOTENAME(@LoginName) + N';
END
ELSE
BEGIN
    ALTER USER ' + QUOTENAME(@LoginName) + N' WITH LOGIN = ' + QUOTENAME(@LoginName) + N';
END;
';

EXEC sys.sp_executesql @Sql;


/* ============================================================
   授予基本讀寫與 UDF 權限
   ============================================================ */

SET @Sql = N'
USE ' + QUOTENAME(@DatabaseName) + N';

/* 基本資料讀取權限 */
IF ISNULL(IS_ROLEMEMBER(N''db_datareader'', N''' + @LoginNameText + N'''), 0) <> 1
BEGIN
    ALTER ROLE [db_datareader] ADD MEMBER ' + QUOTENAME(@LoginName) + N';
END;

/* 基本資料寫入權限 */
IF ISNULL(IS_ROLEMEMBER(N''db_datawriter'', N''' + @LoginNameText + N'''), 0) <> 1
BEGIN
    ALTER ROLE [db_datawriter] ADD MEMBER ' + QUOTENAME(@LoginName) + N';
END;

/* 允許執行 Stored Procedure / Function */
GRANT EXECUTE TO ' + QUOTENAME(@LoginName) + N';

/* 允許建立 Function，例如 dbo.SplitToStringTable */
GRANT CREATE FUNCTION TO ' + QUOTENAME(@LoginName) + N';

/* 允許修改 dbo Schema 下的 Function / Procedure */
GRANT ALTER ON SCHEMA::[dbo] TO ' + QUOTENAME(@LoginName) + N';
';

EXEC sys.sp_executesql @Sql;


/* ============================================================
   確認帳號與權限
   ============================================================ */

SET @Sql = N'
USE ' + QUOTENAME(@DatabaseName) + N';

SELECT 
    DB_NAME() AS DatabaseName,
    dp.[name] AS DatabaseUser,
    dp.[type_desc] AS UserType,
    sp.[name] AS LoginName
FROM sys.database_principals dp
LEFT JOIN sys.server_principals sp ON dp.[sid] = sp.[sid]
WHERE dp.[name] = N''' + @LoginNameText + N''';

SELECT 
    roles.[name] AS RoleName,
    members.[name] AS MemberName
FROM sys.database_role_members drm
INNER JOIN sys.database_principals roles ON drm.role_principal_id = roles.principal_id
INNER JOIN sys.database_principals members ON drm.member_principal_id = members.principal_id
WHERE members.[name] = N''' + @LoginNameText + N''';

SELECT 
    perm.[permission_name],
    perm.[state_desc],
    USER_NAME(perm.[grantee_principal_id]) AS GranteeName
FROM sys.database_permissions perm
WHERE USER_NAME(perm.[grantee_principal_id]) = N''' + @LoginNameText + N''';
';

EXEC sys.sp_executesql @Sql;