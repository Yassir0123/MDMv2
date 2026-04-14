DECLARE @TableName NVARCHAR(256);
DECLARE @ColumnName NVARCHAR(256);
DECLARE @ConstraintName NVARCHAR(256);
DECLARE @SQL NVARCHAR(MAX);

-- Cursor to find all unique constraints on specific tables and columns
DECLARE cur CURSOR FOR
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    kc.name AS ConstraintName
FROM sys.key_constraints kc
JOIN sys.tables t ON kc.parent_object_id = t.object_id
JOIN sys.index_columns ic ON kc.unique_index_id = ic.index_id AND kc.parent_object_id = ic.object_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE kc.type = 'UQ'
AND (
    (t.name = 'mobile' AND c.name IN ('user_id', 'sn', 'imei')) OR
    (t.name = 'carte_sim' AND c.name IN ('user_id', 'sn')) OR
    (t.name = 'ligne_internet' AND c.name IN ('sn'))
);

OPEN cur;
FETCH NEXT FROM cur INTO @TableName, @ColumnName, @ConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL = 'ALTER TABLE [' + @TableName + '] DROP CONSTRAINT [' + @ConstraintName + '];';
    PRINT 'Executing: ' + @SQL;
    EXEC sp_executesql @SQL;
    
    FETCH NEXT FROM cur INTO @TableName, @ColumnName, @ConstraintName;
END

CLOSE cur;
DEALLOCATE cur;

-- Also need to check sys.indexes because sometimes unique constraints are just unique indexes
DECLARE index_cur CURSOR FOR
SELECT 
    t.name AS TableName,
    i.name AS IndexName
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.index_columns ic ON i.index_id = ic.index_id AND i.object_id = ic.object_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.is_unique = 1 AND i.is_primary_key = 0 AND i.is_unique_constraint = 0
AND (
    (t.name = 'mobile' AND c.name IN ('user_id', 'sn', 'imei')) OR
    (t.name = 'carte_sim' AND c.name IN ('user_id', 'sn')) OR
    (t.name = 'ligne_internet' AND c.name IN ('sn'))
);

OPEN index_cur;
FETCH NEXT FROM index_cur INTO @TableName, @ConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL = 'DROP INDEX [' + @ConstraintName + '] ON [' + @TableName + '];';
    PRINT 'Executing: ' + @SQL;
    EXEC sp_executesql @SQL;
    
    FETCH NEXT FROM index_cur INTO @TableName, @ConstraintName;
END

CLOSE index_cur;
DEALLOCATE index_cur;
