"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@hadu.edu' },
        update: {},
        create: {
            email: 'admin@hadu.edu',
            firstName: 'Admin',
            lastName: 'User',
            password: adminPassword,
            role: client_1.UserRole.ADMIN,
        },
    });
    const teacherPassword = await bcryptjs_1.default.hash('teacher123', 10);
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@hadu.edu' },
        update: {},
        create: {
            email: 'teacher@hadu.edu',
            firstName: 'John',
            lastName: 'Teacher',
            password: teacherPassword,
            role: client_1.UserRole.TEACHER,
        },
    });
    const studentPassword = await bcryptjs_1.default.hash('student123', 10);
    const student = await prisma.user.upsert({
        where: { email: 'student@hadu.edu' },
        update: {},
        create: {
            email: 'student@hadu.edu',
            firstName: 'Jane',
            lastName: 'Student',
            password: studentPassword,
            role: client_1.UserRole.STUDENT,
        },
    });
    const course1 = await prisma.course.upsert({
        where: { id: 'sample-course-1' },
        update: {},
        create: {
            id: 'sample-course-1',
            title: 'Introduction to TypeScript',
            description: 'Learn the fundamentals of TypeScript programming language.',
            isPublished: true,
            price: 0,
            creatorId: teacher.id,
        },
    });
    const course2 = await prisma.course.upsert({
        where: { id: 'sample-course-2' },
        update: {},
        create: {
            id: 'sample-course-2',
            title: 'React for Beginners',
            description: 'A comprehensive guide to building web applications with React.',
            isPublished: true,
            price: 29.99,
            creatorId: teacher.id,
        },
    });
    await prisma.lesson.createMany({
        data: [
            {
                title: 'What is TypeScript?',
                content: 'TypeScript is a programming language developed by Microsoft...',
                courseId: course1.id,
                creatorId: teacher.id,
                order: 1,
                isPublished: true,
                duration: 15,
            },
            {
                title: 'Setting up TypeScript',
                content: 'In this lesson, we will learn how to set up TypeScript...',
                courseId: course1.id,
                creatorId: teacher.id,
                order: 2,
                isPublished: true,
                duration: 20,
            },
            {
                title: 'Introduction to React',
                content: 'React is a JavaScript library for building user interfaces...',
                courseId: course2.id,
                creatorId: teacher.id,
                order: 1,
                isPublished: true,
                duration: 25,
            },
            {
                title: 'Components and JSX',
                content: 'Learn about React components and JSX syntax...',
                courseId: course2.id,
                creatorId: teacher.id,
                order: 2,
                isPublished: true,
                duration: 30,
            },
        ],
    });
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: student.id,
                courseId: course1.id,
            },
        },
        update: {},
        create: {
            userId: student.id,
            courseId: course1.id,
            progress: 50,
        },
    });
    console.log('✅ Database seeded successfully!');
    console.log('👤 Admin: admin@hadu.edu / admin123');
    console.log('👨‍🏫 Teacher: teacher@hadu.edu / teacher123');
    console.log('👩‍🎓 Student: student@hadu.edu / student123');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map