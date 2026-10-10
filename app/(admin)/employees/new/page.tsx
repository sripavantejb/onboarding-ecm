import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Department, HireDraft, Role, User } from "@/models";
import { plain } from "@/lib/utils";
import { CreateEmployeeForm, type DeptWithRoles, type HireDraftValues, type ManagerOption } from "@/components/admin/create-employee-form";
import type { EmploymentType, WorkMode } from "@/types";

export const metadata = { title: "New employee" };
export const dynamic = "force-dynamic";

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  await requireCapability("employees");
  await dbConnect();
  const { draft: draftId } = await searchParams;

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

  let draft: HireDraftValues | null = null;
  if (draftId && /^[a-f\d]{24}$/i.test(draftId)) {
    const saved = await HireDraft.findById(draftId).lean();
    if (saved) {
      draft = {
        id: String(saved._id),
        fullName: saved.fullName ?? "",
        email: saved.email ?? "",
        phone: saved.phone ?? "",
        department: saved.department ? String(saved.department) : "",
        role: saved.role ? String(saved.role) : "",
        reportingManager: saved.reportingManager ? String(saved.reportingManager) : "",
        reportingManagerName: saved.reportingManagerName ?? "",
        joiningDate: saved.joiningDate ?? "",
        employmentType: (saved.employmentType ?? "Full-time") as EmploymentType,
        workMode: (saved.workMode ?? "On-site") as WorkMode,
      };
    }
  }

  return <CreateEmployeeForm departments={plain(depts)} managers={plain(managerOptions)} draft={draft} />;
}
