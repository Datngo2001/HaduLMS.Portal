BEGIN TRY

BEGIN TRAN;

-- DropIndex
ALTER TABLE [dbo].[attendances] DROP CONSTRAINT [attendances_userId_sessionId_key];

-- AlterTable
ALTER TABLE [dbo].[users] ADD [faceRegisteredAt] DATETIME2,
[hasFaceRegistered] BIT NOT NULL CONSTRAINT [users_hasFaceRegistered_df] DEFAULT 0;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
