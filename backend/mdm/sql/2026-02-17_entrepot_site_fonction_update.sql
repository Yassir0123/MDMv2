/*
  MDMWEB schema update (SQL Server) – 2026-02-17

  Notes:
  - The project uses Hibernate `ddl-auto=update`, which will CREATE new tables/columns,
    but it will NOT reliably DROP removed columns (ex: departement.agence_id).
  - Run this script manually against the `MDMWEB` database to enforce the full schema,
    especially the column drop and uniqueness constraints.
*/

/* 1) NEW TABLES */
IF OBJECT_ID('dbo.site', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.site (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    libeller NVARCHAR(255) NULL
  );
END

IF OBJECT_ID('dbo.fonction', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.fonction (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    nom NVARCHAR(255) NULL
  );
END

IF OBJECT_ID('dbo.entrepot', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.entrepot (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    site_id INT NULL,
    telephone NVARCHAR(255) NULL,
    email NVARCHAR(255) NULL,
    fax NVARCHAR(255) NULL,
    chef_entrepot_user_id INT NULL
  );
END

/* 2) ADD COLUMNS */
IF COL_LENGTH('dbo.Agence', 'site_id') IS NULL
  ALTER TABLE dbo.Agence ADD site_id INT NULL;

IF COL_LENGTH('dbo.Users', 'fonction_id') IS NULL
  ALTER TABLE dbo.Users ADD fonction_id INT NULL;

IF COL_LENGTH('dbo.Users', 'id_entrepot') IS NULL
  ALTER TABLE dbo.Users ADD id_entrepot INT NULL;

/* Resources */
IF COL_LENGTH('dbo.CarteSim', 'id_entrepot') IS NULL
  ALTER TABLE dbo.CarteSim ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.CarteSim', 'departement_id') IS NULL
  ALTER TABLE dbo.CarteSim ADD departement_id INT NULL;

IF COL_LENGTH('dbo.Mobile', 'id_entrepot') IS NULL
  ALTER TABLE dbo.Mobile ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.LigneInternet', 'id_entrepot') IS NULL
  ALTER TABLE dbo.LigneInternet ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.materiels', 'id_entrepot') IS NULL
  ALTER TABLE dbo.materiels ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.Materiel', 'id_entrepot') IS NULL
  ALTER TABLE dbo.Materiel ADD id_entrepot INT NULL;

/* Historiques */
IF COL_LENGTH('dbo.HistoriqueCartesim', 'id_entrepot') IS NULL
  ALTER TABLE dbo.HistoriqueCartesim ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.HistoriqueMobile', 'id_entrepot') IS NULL
  ALTER TABLE dbo.HistoriqueMobile ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.HistoriqueLigneinternet', 'id_entrepot') IS NULL
  ALTER TABLE dbo.HistoriqueLigneinternet ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.historique_materiels', 'id_entrepot') IS NULL
  ALTER TABLE dbo.historique_materiels ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.HistoriqueMateriel', 'id_entrepot') IS NULL
  ALTER TABLE dbo.HistoriqueMateriel ADD id_entrepot INT NULL;

IF COL_LENGTH('dbo.HistoriqueAffectation', 'id_entrepot') IS NULL
  ALTER TABLE dbo.HistoriqueAffectation ADD id_entrepot INT NULL;

/* 3) FOREIGN KEYS + UNIQUENESS */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Agence_site')
  ALTER TABLE dbo.Agence WITH CHECK ADD CONSTRAINT FK_Agence_site FOREIGN KEY(site_id) REFERENCES dbo.site(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Entrepot_site')
  ALTER TABLE dbo.entrepot WITH CHECK ADD CONSTRAINT FK_Entrepot_site FOREIGN KEY(site_id) REFERENCES dbo.site(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Entrepot_chef')
  ALTER TABLE dbo.entrepot WITH CHECK ADD CONSTRAINT FK_Entrepot_chef FOREIGN KEY(chef_entrepot_user_id) REFERENCES dbo.Users(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Users_fonction')
  ALTER TABLE dbo.Users WITH CHECK ADD CONSTRAINT FK_Users_fonction FOREIGN KEY(fonction_id) REFERENCES dbo.fonction(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Users_entrepot')
  ALTER TABLE dbo.Users WITH CHECK ADD CONSTRAINT FK_Users_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CarteSim_entrepot')
  ALTER TABLE dbo.CarteSim WITH CHECK ADD CONSTRAINT FK_CarteSim_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CarteSim_departement')
  ALTER TABLE dbo.CarteSim WITH CHECK ADD CONSTRAINT FK_CarteSim_departement FOREIGN KEY(departement_id) REFERENCES dbo.Departement(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Mobile_entrepot')
  ALTER TABLE dbo.Mobile WITH CHECK ADD CONSTRAINT FK_Mobile_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_LigneInternet_entrepot')
  ALTER TABLE dbo.LigneInternet WITH CHECK ADD CONSTRAINT FK_LigneInternet_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Materiels_entrepot')
  ALTER TABLE dbo.materiels WITH CHECK ADD CONSTRAINT FK_Materiels_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Materiel_entrepot')
  ALTER TABLE dbo.Materiel WITH CHECK ADD CONSTRAINT FK_Materiel_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HCartesim_entrepot')
  ALTER TABLE dbo.HistoriqueCartesim WITH CHECK ADD CONSTRAINT FK_HCartesim_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HMobile_entrepot')
  ALTER TABLE dbo.HistoriqueMobile WITH CHECK ADD CONSTRAINT FK_HMobile_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HLigne_entrepot')
  ALTER TABLE dbo.HistoriqueLigneinternet WITH CHECK ADD CONSTRAINT FK_HLigne_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HMateriels_entrepot')
  ALTER TABLE dbo.historique_materiels WITH CHECK ADD CONSTRAINT FK_HMateriels_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HMateriel_entrepot')
  ALTER TABLE dbo.HistoriqueMateriel WITH CHECK ADD CONSTRAINT FK_HMateriel_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HAffectation_entrepot')
  ALTER TABLE dbo.HistoriqueAffectation WITH CHECK ADD CONSTRAINT FK_HAffectation_entrepot FOREIGN KEY(id_entrepot) REFERENCES dbo.entrepot(id);

/* Uniqueness (one agence + one entrepot per site) */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Agence_site_id' AND object_id = OBJECT_ID('dbo.Agence'))
  CREATE UNIQUE INDEX UQ_Agence_site_id ON dbo.Agence(site_id) WHERE site_id IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Entrepot_site_id' AND object_id = OBJECT_ID('dbo.entrepot'))
  CREATE UNIQUE INDEX UQ_Entrepot_site_id ON dbo.entrepot(site_id) WHERE site_id IS NOT NULL;

/* 4) DROP Departement.agence_id (since relation no longer exists) */
IF COL_LENGTH('dbo.Departement', 'agence_id') IS NOT NULL
BEGIN
  DECLARE @fkName NVARCHAR(255);
  SELECT TOP 1 @fkName = fk.name
  FROM sys.foreign_keys fk
  JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
  JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
  WHERE fk.parent_object_id = OBJECT_ID('dbo.Departement') AND c.name = 'agence_id';

  IF @fkName IS NOT NULL
    EXEC('ALTER TABLE dbo.Departement DROP CONSTRAINT ' + @fkName);

  ALTER TABLE dbo.Departement DROP COLUMN agence_id;
END

