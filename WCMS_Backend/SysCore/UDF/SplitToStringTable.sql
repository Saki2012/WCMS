/* =========================================================
Function : dbo.SplitToStringTable
用途     : 把以逗號分隔的字串 (CSV) 轉成資料表，每個值一列(Id)
情境範例 : 
  - 欄位 Categories 存 "id01,id02,id05"
  - 查詢條件是 hasAny(id01,id03,id05) → 轉成和此函式交集判斷

特性：
  1) 去除每個值的前後空白。
  2) 濾掉空值（連續逗號、首尾逗號）。
  3) 回傳型別為 NVARCHAR(100)；若你的實際 Id 較長可自行調整。
  4) 使用 Inline TVF（單一 RETURN），效能優於多語句 TVF。

注意：
  - 需 SQL Server 2016 SP1 以上才能使用 CREATE OR ALTER。
  - 建議僅作為「CSV 欄位的過渡期查詢」；長期仍建議正規化成多對多關聯表 + 索引。
========================================================= */
USE [WCMS];
GO
CREATE OR ALTER FUNCTION dbo.SplitToStringTable (@csv NVARCHAR(MAX))
RETURNS TABLE
AS
RETURN
(
    SELECT Id = LTRIM(RTRIM(value))
    FROM STRING_SPLIT(@csv, ',')
    WHERE LTRIM(RTRIM(value)) <> ''
);
GO

/* =============== 使用範例（查詢端） ======================
-- 1) 直接查看切割結果
SELECT * FROM dbo.SplitToStringTable(N'id01, id02 , , id05');
-- 結果：
-- Id
-- ----
-- id01
-- id02
-- id05

-- 2) 與資料表做「任一命中」判斷（EXISTS）
--   Galleries.Categories = 'id01,id02,id05'
SELECT g.*
FROM dbo.Galleries AS g
WHERE EXISTS
(
    SELECT 1
    FROM dbo.SplitToStringTable(g.Categories) AS s
    WHERE s.Id IN (N'id01', N'id03', N'id05')
);
-- 命中規則：只要交集非空（有一個對得上）就會被選出
========================================================= */