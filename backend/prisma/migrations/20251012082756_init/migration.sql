BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'STUDENT',
    [avatar] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[courses] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [thumbnail] NVARCHAR(1000),
    [isPublished] BIT NOT NULL CONSTRAINT [courses_isPublished_df] DEFAULT 0,
    [price] FLOAT(53) NOT NULL CONSTRAINT [courses_price_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [courses_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [creatorId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [courses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[lessons] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000),
    [videoUrl] NVARCHAR(1000),
    [duration] INT,
    [order] INT NOT NULL CONSTRAINT [lessons_order_df] DEFAULT 0,
    [isPublished] BIT NOT NULL CONSTRAINT [lessons_isPublished_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [lessons_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [creatorId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [lessons_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[enrollments] (
    [id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [enrollments_status_df] DEFAULT 'ACTIVE',
    [progress] FLOAT(53) NOT NULL CONSTRAINT [enrollments_progress_df] DEFAULT 0,
    [enrolledAt] DATETIME2 NOT NULL CONSTRAINT [enrollments_enrolledAt_df] DEFAULT CURRENT_TIMESTAMP,
    [completedAt] DATETIME2,
    [userId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [enrollments_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [enrollments_userId_courseId_key] UNIQUE NONCLUSTERED ([userId],[courseId])
);

-- AddForeignKey
ALTER TABLE [dbo].[courses] ADD CONSTRAINT [courses_creatorId_fkey] FOREIGN KEY ([creatorId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[lessons] ADD CONSTRAINT [lessons_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[lessons] ADD CONSTRAINT [lessons_creatorId_fkey] FOREIGN KEY ([creatorId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[enrollments] ADD CONSTRAINT [enrollments_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[enrollments] ADD CONSTRAINT [enrollments_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
