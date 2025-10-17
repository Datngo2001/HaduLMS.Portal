BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[classrooms] ADD [description] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[users] ADD [classroomId] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_classroomId_fkey] FOREIGN KEY ([classroomId]) REFERENCES [dbo].[classrooms]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
