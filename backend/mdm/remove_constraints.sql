-- This script dynamically finds and drops the foreign key constraints 
-- on the Historique tables that reference the Ressource tables.

DECLARE @sql NVARCHAR(MAX) = N'';

-- For HistoriqueCartesim referencing CarteSim
SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) 
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) 
    + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('historique_cartesim')
AND referenced_object_id = OBJECT_ID('carte_sim');

-- For HistoriqueMobile referencing Mobile
SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) 
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) 
    + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('historique_mobile')
AND referenced_object_id = OBJECT_ID('mobile');

-- For HistoriqueLigneinternet referencing LigneInternet
SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) 
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) 
    + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('historique_ligneinternet')
AND referenced_object_id = OBJECT_ID('ligne_internet');

-- For HistoriqueMateriels referencing Materiels
SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) 
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) 
    + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13) + CHAR(10)
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('historique_materiels')
AND referenced_object_id = OBJECT_ID('materiels');

-- Execute the generated DROP statements
PRINT 'Executing the following SQL statements:';
PRINT @sql;

EXEC sp_executesql @sql;
