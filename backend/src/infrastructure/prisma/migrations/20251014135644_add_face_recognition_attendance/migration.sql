BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[users] ADD [faceId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[classrooms] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000),
    [capacity] INT,
    [isActive] BIT NOT NULL CONSTRAINT [classrooms_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [classrooms_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [classrooms_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[classroom_sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [startTime] DATETIME2 NOT NULL,
    [endTime] DATETIME2 NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [classroom_sessions_isActive_df] DEFAULT 0,
    [checkinCode] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [classroom_sessions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [classroomId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000),
    [teacherId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [classroom_sessions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[attendances] (
    [id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [attendances_status_df] DEFAULT 'PRESENT',
    [checkinTime] DATETIME2,
    [checkinMethod] NVARCHAR(1000),
    [confidence] FLOAT(53),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [attendances_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [sessionId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [attendances_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [attendances_userId_sessionId_key] UNIQUE NONCLUSTERED ([userId],[sessionId])
);

-- AddForeignKey
ALTER TABLE [dbo].[classroom_sessions] ADD CONSTRAINT [classroom_sessions_classroomId_fkey] FOREIGN KEY ([classroomId]) REFERENCES [dbo].[classrooms]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[classroom_sessions] ADD CONSTRAINT [classroom_sessions_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[classroom_sessions] ADD CONSTRAINT [classroom_sessions_teacherId_fkey] FOREIGN KEY ([teacherId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendances] ADD CONSTRAINT [attendances_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attendances] ADD CONSTRAINT [attendances_sessionId_fkey] FOREIGN KEY ([sessionId]) REFERENCES [dbo].[classroom_sessions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
