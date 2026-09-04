import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Department, Role, Employee } from "@/models";
import { plain } from "@/lib/utils";
import { DepartmentsView, type DepartmentDTO } from "@/components/admin/departments-view";

export const metadata = { title: "Departments" };
export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  await requireCapability("departments");
  await dbConnect();

  const departments = await Department.find().sort({ name: 1 }).lean();
  const [roleCounts, empCounts] = await Promise.all([
    Role.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
    Employee.aggregate<{ _id: string; count: number }>([
      { $match: { status: "active" } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
  ]);
  const roleMap = new Map(roleCounts.map((r) => [String(r._id), r.count]));
  const empMap = new Map(empCounts.map((r) => [String(r._id), r.count]));

  const data: DepartmentDTO[] = departments.map((d) => ({
    _id: String(d._id),
    name: d.name,
    description: d.description ?? "",
    status: d.status,
    roleCount: roleMap.get(String(d._id)) ?? 0,
    employeeCount: empMap.get(String(d._id)) ?? 0,
  }));

  return <DepartmentsView departments={plain(data)} />;
}
