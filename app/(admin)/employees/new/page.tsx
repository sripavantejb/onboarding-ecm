import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Department, Role, User } from "@/models";
import { plain } from "@/lib/utils";
import { CreateEmployeeForm, type DeptWithRoles, type ManagerOption } from "@/components/admin/create-employee-form";

export const metadata = { title: "New employee" };
export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  await requireCapability("employees");
  await dbConnect();

  const [departments, roles, managers] = await Promise.all([
    Department.find({ status: "active" }).sort({ name: 1 }).lean(),
    Role.find({ status: "active" }).select("title department").sort({ title: 1 }).lean(),
    User.find({ status: "active" }).select("name role").sort({ name: 1 }).lean(),
  ]);

  const depts: DeptWithRoles[] = departments.map((d) => ({
    _id: String(d._id),
    name: d.name,
    roles: roles
      .filter((r) => String(r.department) === String(d._id))
      .map((r) => ({ _id: String(r._id), title: r.title })),
  }));

  const managerOptions: ManagerOption[] = managers.map((m) => ({
    _id: String(m._id),
    name: m.name,
    role: m.role,
  }));

  return <CreateEmployeeForm departments={plain(depts)} managers={plain(managerOptions)} />;
}
