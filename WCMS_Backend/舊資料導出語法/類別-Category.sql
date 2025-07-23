SELECT
    JSON_QUERY((
        SELECT '' AS CategoryId,
            c.Module AS ProgId,
            GETDATE() AS CreateTime,
            '' AS CreateUserId,
            GETDATE() AS ModifyTime,
            '' AS ModifyUserId,
            0 AS FormStatus,
            0 AS DataStatus,
            NULL AS InvalidTime,
            '' AS InvalidUserId,
            '' As InternalId,
            NULL AS OrgLvId,
            GETDATE() AS Validate_Start,
            DATEADD(MONTH, 6, GETDATE()) AS Validate_End,
            1 As IsIniData
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    )) AS Category,
    (
        SELECT 
            0 AS RowState,
            '' AS CategoryId,
            ROW_NUMBER() OVER (PARTITION BY cl.Sn ORDER BY cl.Lang) AS RowId,
            cl.Lang,
            cl.CategoryName
        FROM Category_Lang cl
        WHERE cl.Sn = c.Sn
        FOR JSON PATH
    ) AS CategoryDetail

FROM Category c
FOR JSON PATH