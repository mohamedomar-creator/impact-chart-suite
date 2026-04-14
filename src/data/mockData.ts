export const kpiData = {
  totalActivities: 248,
  activitiesPlanned: 186,
  activitiesUnplanned: 62,
  productivityScore: 87,
  attendanceRate: 94,
  avgDailyHours: 7.5,
};

export const monthlyTrend = [
  { month: "Jan", activities: 38, hours: 180, attendance: 92 },
  { month: "Feb", activities: 42, hours: 195, attendance: 93 },
  { month: "Mar", activities: 45, hours: 210, attendance: 95 },
  { month: "Apr", activities: 35, hours: 165, attendance: 90 },
  { month: "May", activities: 48, hours: 230, attendance: 96 },
  { month: "Jun", activities: 40, hours: 268, attendance: 94 },
];

export const activityCategories = [
  { name: "مهام مخططة", value: 45, color: "hsl(200, 60%, 30%)" },
  { name: "مهام مفاجئة", value: 25, color: "hsl(38, 92%, 50%)" },
  { name: "اجتماعات", value: 15, color: "hsl(175, 55%, 45%)" },
  { name: "تقارير", value: 10, color: "hsl(210, 50%, 40%)" },
  { name: "أخرى", value: 5, color: "hsl(160, 60%, 40%)" },
];

export const recentActivities = [
  { id: 1, type: "Task", title: "مراجعة تقارير الأداء الشهرية", user: "Sarah Ahmed", duration: 3, date: "2026-04-08", status: "completed" },
  { id: 2, type: "Meeting", title: "اجتماع تنسيق مع فريق التسويق", user: "Omar Hassan", duration: 1.5, date: "2026-04-08", status: "in-progress" },
  { id: 3, type: "Task", title: "إعداد خطة العمل للربع القادم", user: "Layla Mahmoud", duration: 4, date: "2026-04-07", status: "completed" },
  { id: 4, type: "Task", title: "تحديث قاعدة بيانات الموظفين", user: "Ahmed Youssef", duration: 2, date: "2026-04-07", status: "in-progress" },
  { id: 5, type: "Report", title: "تقرير حضور الأسبوع", user: "Sarah Ahmed", duration: 1, date: "2026-04-06", status: "completed" },
];

export const teamMembers = [
  { id: 1, name: "Sarah Ahmed", role: "Team Lead", avatar: "SA", hoursLogged: 340, productivity: 92, tasksCompleted: 45 },
  { id: 2, name: "Omar Hassan", role: "Analyst", avatar: "OH", hoursLogged: 290, productivity: 85, tasksCompleted: 38 },
  { id: 3, name: "Layla Mahmoud", role: "Coordinator", avatar: "LM", hoursLogged: 310, productivity: 88, tasksCompleted: 42 },
  { id: 4, name: "Ahmed Youssef", role: "Admin", avatar: "AY", hoursLogged: 280, productivity: 83, tasksCompleted: 35 },
  { id: 5, name: "Nour Ibrahim", role: "HR Partner", avatar: "NI", hoursLogged: 220, productivity: 79, tasksCompleted: 28 },
];

export interface AttendanceRecord {
  id: number;
  name: string;
  role: string;
  avatar: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number | null;
  status: "present" | "late" | "absent" | "leave";
}

export const attendanceRecords: AttendanceRecord[] = [
  { id: 1, name: "Sarah Ahmed", role: "Team Lead", avatar: "SA", date: "2026-04-08", checkIn: "08:00", checkOut: "16:30", hoursWorked: 8.5, status: "present" },
  { id: 2, name: "Omar Hassan", role: "Analyst", avatar: "OH", date: "2026-04-08", checkIn: "08:45", checkOut: "17:00", hoursWorked: 8.25, status: "late" },
  { id: 3, name: "Layla Mahmoud", role: "Coordinator", avatar: "LM", date: "2026-04-08", checkIn: "07:55", checkOut: "16:00", hoursWorked: 8, status: "present" },
  { id: 4, name: "Ahmed Youssef", role: "Admin", avatar: "AY", date: "2026-04-08", checkIn: null, checkOut: null, hoursWorked: null, status: "absent" },
  { id: 5, name: "Nour Ibrahim", role: "HR Partner", avatar: "NI", date: "2026-04-08", checkIn: null, checkOut: null, hoursWorked: null, status: "leave" },
];

export const monthlyPlan = [
  { id: 1, program: "خطة تحسين الأداء - الفريق الأول", planned: "Apr 2026", status: "on-track", trainer: "Sarah Ahmed" },
  { id: 2, program: "مراجعة سياسات الحضور", planned: "Apr 2026", status: "at-risk", trainer: "Omar Hassan" },
  { id: 3, program: "ورشة عمل تطوير المهارات", planned: "May 2026", status: "on-track", trainer: "Layla Mahmoud" },
  { id: 4, program: "تحديث نظام التقييم", planned: "May 2026", status: "delayed", trainer: "Ahmed Youssef" },
  { id: 5, program: "برنامج تأهيل الموظفين الجدد", planned: "Jun 2026", status: "planned", trainer: "Sarah Ahmed" },
];

export const smartInsights = [
  { id: 1, type: "trend", title: "ساعات العمل ارتفعت 18% مقارنة بالربع الماضي", description: "الفريق يعمل ساعات أكثر هذا الربع، مما يشير لزيادة في حجم العمل.", impact: "positive" },
  { id: 2, type: "alert", title: "مراجعة سياسات الحضور متأخرة", description: "باقي أسبوعان على الموعد النهائي لكن التقدم 40% فقط.", impact: "negative" },
  { id: 3, type: "recommendation", title: "Sarah Ahmed الأعلى إنتاجية", description: "نسبة إنجاز مهامها 92%. يمكن الاستفادة من خبرتها لتوجيه الفريق.", impact: "positive" },
  { id: 4, type: "trend", title: "انخفاض الحضور يوم الخميس", description: "نسبة الحضور تنخفض 20% يوم الخميس. يفضل جدولة المهام المهمة مبكراً في الأسبوع.", impact: "neutral" },
];
