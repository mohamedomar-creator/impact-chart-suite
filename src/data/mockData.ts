export const kpiData = {
  totalTrainingHours: 1248,
  sessionsDelivered: 86,
  employeesTrained: 342,
  productivityScore: 87,
  learningCompletionRate: 78,
  trainingImpactScore: 82,
};

export const monthlyTrend = [
  { month: "Jan", hours: 180, sessions: 12, employees: 45, productivity: 80 },
  { month: "Feb", hours: 195, sessions: 14, employees: 52, productivity: 82 },
  { month: "Mar", hours: 210, sessions: 15, employees: 58, productivity: 85 },
  { month: "Apr", hours: 165, sessions: 11, employees: 40, productivity: 78 },
  { month: "May", hours: 230, sessions: 16, employees: 65, productivity: 88 },
  { month: "Jun", hours: 268, sessions: 18, employees: 82, productivity: 91 },
];

export const activityCategories = [
  { name: "Training Sessions", value: 35, color: "hsl(200, 60%, 30%)" },
  { name: "Content Development", value: 20, color: "hsl(175, 55%, 45%)" },
  { name: "LMS Management", value: 15, color: "hsl(190, 40%, 55%)" },
  { name: "Coaching", value: 12, color: "hsl(38, 92%, 50%)" },
  { name: "Meetings", value: 10, color: "hsl(160, 60%, 40%)" },
  { name: "Reporting", value: 8, color: "hsl(210, 50%, 40%)" },
];

export const recentActivities = [
  { id: 1, type: "Training Session", title: "Leadership Fundamentals - Cohort 5", user: "Sarah Ahmed", duration: 3, date: "2026-04-08", status: "completed" },
  { id: 2, type: "Content Development", title: "New Hire Onboarding Module v3", user: "Omar Hassan", duration: 4, date: "2026-04-08", status: "in-progress" },
  { id: 3, type: "Coaching", title: "1:1 with Marketing Team Lead", user: "Layla Mahmoud", duration: 1, date: "2026-04-07", status: "completed" },
  { id: 4, type: "LMS Management", title: "Q2 Course Catalog Update", user: "Ahmed Youssef", duration: 2, date: "2026-04-07", status: "in-progress" },
  { id: 5, type: "Training Session", title: "Data Analytics Workshop", user: "Sarah Ahmed", duration: 6, date: "2026-04-06", status: "completed" },
  { id: 6, type: "Meeting", title: "L&D Strategy Review - Q2", user: "Layla Mahmoud", duration: 1.5, date: "2026-04-06", status: "completed" },
];

export const trainingPrograms = [
  { id: 1, name: "Leadership Fundamentals", trainer: "Sarah Ahmed", audience: "Mid-level Managers", duration: "4 weeks", enrolled: 25, completed: 18, status: "active", completionRate: 72 },
  { id: 2, name: "Data Analytics Bootcamp", trainer: "Ahmed Youssef", audience: "All Departments", duration: "6 weeks", enrolled: 40, completed: 32, status: "active", completionRate: 80 },
  { id: 3, name: "New Hire Onboarding", trainer: "Omar Hassan", audience: "New Employees", duration: "2 weeks", enrolled: 15, completed: 15, status: "completed", completionRate: 100 },
  { id: 4, name: "Communication Skills", trainer: "Layla Mahmoud", audience: "Customer Service", duration: "3 weeks", enrolled: 30, completed: 12, status: "active", completionRate: 40 },
  { id: 5, name: "Project Management Pro", trainer: "Sarah Ahmed", audience: "Team Leads", duration: "5 weeks", enrolled: 20, completed: 0, status: "planned", completionRate: 0 },
];

export const teamMembers = [
  { id: 1, name: "Sarah Ahmed", role: "L&D Specialist", avatar: "SA", sessionsDelivered: 28, hoursLogged: 340, productivity: 92, tasksCompleted: 45 },
  { id: 2, name: "Omar Hassan", role: "Content Developer", avatar: "OH", sessionsDelivered: 12, hoursLogged: 290, productivity: 85, tasksCompleted: 38 },
  { id: 3, name: "Layla Mahmoud", role: "Trainer", avatar: "LM", sessionsDelivered: 22, hoursLogged: 310, productivity: 88, tasksCompleted: 42 },
  { id: 4, name: "Ahmed Youssef", role: "LMS Admin", avatar: "AY", sessionsDelivered: 18, hoursLogged: 280, productivity: 83, tasksCompleted: 35 },
  { id: 5, name: "Nour Ibrahim", role: "HR Partner", avatar: "NI", sessionsDelivered: 6, hoursLogged: 220, productivity: 79, tasksCompleted: 28 },
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
  { id: 1, name: "Sarah Ahmed", role: "L&D Specialist", avatar: "SA", date: "2026-04-08", checkIn: "08:00", checkOut: "16:30", hoursWorked: 8.5, status: "present" },
  { id: 2, name: "Omar Hassan", role: "Content Developer", avatar: "OH", date: "2026-04-08", checkIn: "08:45", checkOut: "17:00", hoursWorked: 8.25, status: "late" },
  { id: 3, name: "Layla Mahmoud", role: "Trainer", avatar: "LM", date: "2026-04-08", checkIn: "07:55", checkOut: "16:00", hoursWorked: 8, status: "present" },
  { id: 4, name: "Ahmed Youssef", role: "LMS Admin", avatar: "AY", date: "2026-04-08", checkIn: null, checkOut: null, hoursWorked: null, status: "absent" },
  { id: 5, name: "Nour Ibrahim", role: "HR Partner", avatar: "NI", date: "2026-04-08", checkIn: null, checkOut: null, hoursWorked: null, status: "leave" },
];

export const monthlyPlan = [
  { id: 1, program: "Leadership Fundamentals - Cohort 6", planned: "Apr 2026", status: "on-track", trainer: "Sarah Ahmed" },
  { id: 2, program: "Q2 Compliance Training", planned: "Apr 2026", status: "at-risk", trainer: "Omar Hassan" },
  { id: 3, program: "Innovation Workshop", planned: "May 2026", status: "on-track", trainer: "Layla Mahmoud" },
  { id: 4, program: "Data Literacy Program", planned: "May 2026", status: "delayed", trainer: "Ahmed Youssef" },
  { id: 5, program: "Executive Coaching Series", planned: "Jun 2026", status: "planned", trainer: "Sarah Ahmed" },
];

export const smartInsights = [
  { id: 1, type: "trend", title: "Training hours up 18% vs last quarter", description: "Team has delivered 18% more training hours compared to Q1, driven primarily by the Data Analytics Bootcamp program.", impact: "positive" },
  { id: 2, type: "alert", title: "Q2 Compliance Training at risk", description: "Only 2 weeks remain before the deadline, but content development is 40% behind schedule. Consider reassigning resources.", impact: "negative" },
  { id: 3, type: "recommendation", title: "Sarah Ahmed has highest impact score", description: "Her sessions have the highest completion rates (92%) and learner satisfaction (4.8/5). Consider having her mentor newer trainers.", impact: "positive" },
  { id: 4, type: "trend", title: "LMS engagement dropping on Fridays", description: "Course completion rates drop 35% on Fridays. Consider scheduling mandatory modules earlier in the week.", impact: "neutral" },
];
