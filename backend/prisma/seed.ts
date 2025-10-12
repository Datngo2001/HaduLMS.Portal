import bcrypt from 'bcryptjs';
import { PrismaClient } from '../prisma-generated/client';
import { UserRole } from '../src/middleware/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hadu.edu' },
    update: {},
    create: {
      email: 'admin@hadu.edu',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  // Create teacher user
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@hadu.edu' },
    update: {},
    create: {
      email: 'teacher@hadu.edu',
      firstName: 'John',
      lastName: 'Teacher',
      password: teacherPassword,
      role: UserRole.TEACHER,
    },
  });

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@hadu.edu' },
    update: {},
    create: {
      email: 'student@hadu.edu',
      firstName: 'Jane',
      lastName: 'Student',
      password: studentPassword,
      role: UserRole.STUDENT,
    },
  });

  // Create sample courses
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

  // Create sample lessons
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

  // Create sample enrollment
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