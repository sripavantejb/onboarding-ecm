import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Role, Department, Employee } from "@/models";
import { plain } from "@/lib/utils";
import { RolesView, type RoleDTO, type DeptOption } from "@/components/admin/roles-view";

export const metadata = { title: "Roles" };
export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requireCapability("roles");
  await dbConnect();

  const [roles, departments, empCounts] = await Promise.all([
    Role.find().populate<{ department: { _id: string; name: string } }>("department", "name").sort({ title: 1 }).lean(),
    Department.find({ status: "active" }).sort({ name: 1 }).lean(),
    Employee.aggregate<{ _id: string; count: number }>([
      { $match: { status: "active" } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
  ]);
  const empMap = new Map(empCounts.map((r) => [String(r._id), r.count]));

  const data: RoleDTO[] = roles.map((r) => ({
    _id: String(r._id),
    title: r.title,
    description: r.description ?? "",
    status: r.status,
    departmentId: String((r.department as { _id: string })?._id ?? ""),
    departmentName: (r.department as { name?: string })?.name ?? "—",
    employeeCount: empMap.get(String(r._id)) ?? 0,
  }));

  const deptOptions: DeptOption[] = departments.map((d) => ({ _id: String(d._id), name: d.name }));

  return <RolesView roles={plain(data)} departments={plain(deptOptions)} />;
}
