import { PrismaMssql } from "@prisma/adapter-mssql";
import bcrypt from "bcryptjs";
import { UserRole } from "../presentation/middleware/auth";
import { PrismaClient } from "./generated/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaMssql(connectionString);

const createPrismaClient = () => new PrismaClient({ adapter });

const prisma = createPrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@hadu.edu" },
    update: {},
    create: {
      email: "admin@hadu.edu",
      firstName: "Admin",
      lastName: "User",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  // Create teacher user
  const teacherPassword = await bcrypt.hash("teacher123", 10);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@hadu.edu" },
    update: {},
    create: {
      email: "teacher@hadu.edu",
      firstName: "John",
      lastName: "Teacher",
      password: teacherPassword,
      role: UserRole.TEACHER,
    },
  });

  // Create student user
  const studentPassword = await bcrypt.hash("student123", 10);
  const student = await prisma.user.upsert({
    where: { email: "student@hadu.edu" },
    update: {},
    create: {
      email: "student@hadu.edu",
      firstName: "Jane",
      lastName: "Student",
      password: studentPassword,
      role: UserRole.STUDENT,
    },
  });

  // Create sample courses
  const course1 = await prisma.course.upsert({
    where: { id: "sample-course-1" },
    update: {},
    create: {
      id: "sample-course-1",
      title: "Introduction to TypeScript",
      description: "Learn the fundamentals of TypeScript programming language.",
      isPublished: true,
      price: 0,
      creatorId: teacher.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: "sample-course-2" },
    update: {},
    create: {
      id: "sample-course-2",
      title: "React for Beginners",
      description:
        "A comprehensive guide to building web applications with React.",
      isPublished: true,
      price: 29.99,
      creatorId: teacher.id,
    },
  });

  // Create sample lessons
  await prisma.lesson.createMany({
    data: [
      {
        title: "What is TypeScript?",
        content:
          "TypeScript is a programming language developed by Microsoft...",
        courseId: course1.id,
        creatorId: teacher.id,
        order: 1,
        isPublished: true,
        duration: 15,
      },
      {
        title: "Setting up TypeScript",
        content: "In this lesson, we will learn how to set up TypeScript...",
        courseId: course1.id,
        creatorId: teacher.id,
        order: 2,
        isPublished: true,
        duration: 20,
      },
      {
        title: "Introduction to React",
        content:
          "React is a JavaScript library for building user interfaces...",
        courseId: course2.id,
        creatorId: teacher.id,
        order: 1,
        isPublished: true,
        duration: 25,
      },
      {
        title: "Components and JSX",
        content: "Learn about React components and JSX syntax...",
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

  // Create additional students for attendance demo
  const student2Password = await bcrypt.hash("student123", 10);
  const student2 = await prisma.user.upsert({
    where: { email: "alice@hadu.edu" },
    update: {},
    create: {
      email: "alice@hadu.edu",
      firstName: "Alice",
      lastName: "Johnson",
      password: student2Password,
      role: UserRole.STUDENT,
    },
  });

  const student3Password = await bcrypt.hash("student123", 10);
  const student3 = await prisma.user.upsert({
    where: { email: "bob@hadu.edu" },
    update: {},
    create: {
      email: "bob@hadu.edu",
      firstName: "Bob",
      lastName: "Wilson",
      password: student3Password,
      role: UserRole.STUDENT,
    },
  });

  // Create sample classrooms
  const classroom1 = await prisma.classroom.upsert({
    where: { id: "classroom-a101" },
    update: {},
    create: {
      id: "classroom-a101",
      name: "Room A101",
      location: "Building A, First Floor",
      capacity: 30,
      isActive: true,
    },
  });

  const classroom2 = await prisma.classroom.upsert({
    where: { id: "classroom-b205" },
    update: {},
    create: {
      id: "classroom-b205",
      name: "Lab B205",
      location: "Building B, Second Floor",
      capacity: 25,
      isActive: true,
    },
  });

  const classroom3 = await prisma.classroom.upsert({
    where: { id: "classroom-c301" },
    update: {},
    create: {
      id: "classroom-c301",
      name: "Lecture Hall C301",
      location: "Building C, Third Floor",
      capacity: 100,
      isActive: true,
    },
  });

  // Create sample classroom sessions
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Session 1: Active session happening now
  const session1StartTime = new Date(today.getTime() + 9 * 60 * 60 * 1000); // 9 AM today
  const session1EndTime = new Date(today.getTime() + 10.5 * 60 * 60 * 1000); // 10:30 AM today

  const session1 = await prisma.classroomSession.upsert({
    where: { id: "session-ts-intro-1" },
    update: {},
    create: {
      id: "session-ts-intro-1",
      title: "TypeScript Fundamentals - Session 1",
      startTime: session1StartTime,
      endTime: session1EndTime,
      isActive: true,
      checkinCode: "TS101A",
      classroomId: classroom1.id,
      courseId: course1.id,
      teacherId: teacher.id,
    },
  });

  // Session 2: Future session
  const session2StartTime = new Date(
    today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000,
  ); // 2 PM tomorrow
  const session2EndTime = new Date(
    today.getTime() + 24 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000,
  ); // 3:30 PM tomorrow

  const session2 = await prisma.classroomSession.upsert({
    where: { id: "session-react-basics-1" },
    update: {},
    create: {
      id: "session-react-basics-1",
      title: "React Components Workshop",
      startTime: session2StartTime,
      endTime: session2EndTime,
      isActive: false, // Will be activated by teacher
      checkinCode: "REACT1",
      classroomId: classroom2.id,
      courseId: course2.id,
      teacherId: teacher.id,
    },
  });

  // Session 3: Past session with attendance
  const session3StartTime = new Date(
    today.getTime() - 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
  ); // 10 AM yesterday
  const session3EndTime = new Date(
    today.getTime() - 24 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000,
  ); // 11:30 AM yesterday

  const session3 = await prisma.classroomSession.upsert({
    where: { id: "session-past-demo" },
    update: {},
    create: {
      id: "session-past-demo",
      title: "Programming Concepts Review",
      startTime: session3StartTime,
      endTime: session3EndTime,
      isActive: false,
      checkinCode: "PROG01",
      classroomId: classroom3.id,
      courseId: course1.id,
      teacherId: teacher.id,
    },
  });

  // Create sample attendance records for the past session
  await prisma.attendance.createMany({
    data: [
      {
        userId: student.id,
        sessionId: session3.id,
        status: "PRESENT",
        checkinTime: new Date(session3StartTime.getTime() + 5 * 60 * 1000), // 5 minutes after start
        checkinMethod: "FACE_RECOGNITION",
        confidence: 0.92,
      },
      {
        userId: student2.id,
        sessionId: session3.id,
        status: "LATE",
        checkinTime: new Date(session3StartTime.getTime() + 20 * 60 * 1000), // 20 minutes after start
        checkinMethod: "QR_CODE",
        confidence: null,
      },
      {
        userId: student3.id,
        sessionId: session3.id,
        status: "PRESENT",
        checkinTime: new Date(session3StartTime.getTime() + 2 * 60 * 1000), // 2 minutes after start
        checkinMethod: "FACE_RECOGNITION",
        confidence: 0.88,
      },
    ],
  });

  // Enroll additional students in courses
  await prisma.enrollment.createMany({
    data: [
      {
        userId: student2.id,
        courseId: course1.id,
        progress: 25,
      },
      {
        userId: student3.id,
        courseId: course1.id,
        progress: 75,
      },
      {
        userId: student.id,
        courseId: course2.id,
        progress: 10,
      },
      {
        userId: student2.id,
        courseId: course2.id,
        progress: 0,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("👤 Users created:");
  console.log("   Admin: admin@hadu.edu / admin123");
  console.log("   Teacher: teacher@hadu.edu / teacher123");
  console.log("   Students:");
  console.log("     - student@hadu.edu / student123 (Jane Student)");
  console.log("     - alice@hadu.edu / student123 (Alice Johnson)");
  console.log("     - bob@hadu.edu / student123 (Bob Wilson)");
  console.log("");
  console.log("🏫 Classrooms created:");
  console.log("   - Room A101 (Building A, Capacity: 30)");
  console.log("   - Lab B205 (Building B, Capacity: 25)");
  console.log("   - Lecture Hall C301 (Building C, Capacity: 100)");
  console.log("");
  console.log("📚 Classroom Sessions:");
  console.log(
    '   - Active session: "TypeScript Fundamentals" (Check-in code: TS101A)',
  );
  console.log(
    '   - Future session: "React Components Workshop" (Check-in code: REACT1)',
  );
  console.log("   - Past session with sample attendance data");
  console.log("");
  console.log("🎯 Face Recognition Setup:");
  console.log("   1. Configure Azure Face API in .env file");
  console.log("   2. Students can register faces at /face-registration");
  console.log("   3. Use session check-in at /checkin/{sessionId}");
  console.log("   4. Active session ID for testing: session-ts-intro-1");
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
