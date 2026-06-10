"use server";
import { getSession } from "@/auth/index.js";
import { contractorProfileSchema } from "@bina/core";
import { auditLogs, contractorProfiles, withUserContext } from "@bina/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProfileFormState = { error?: string; success?: boolean } | null;

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session || session.role !== "contractor" || !session.contractorId) {
    return { error: "Non autorisé." };
  }
  const contractorId = session.contractorId;

  const num = (field: string) => {
    const v = formData.get(field);
    return v === null || v === "" ? undefined : Number(v);
  };
  const str = (field: string) => {
    const v = formData.get(field);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  const maxContractValueMAD = num("maxContractValueMAD");

  const parsed = contractorProfileSchema.safeParse({
    companyName: str("companyName"),
    ice: str("ice"),
    rc: str("rc"),
    specialties: formData.getAll("specialties"),
    regions: formData.getAll("regions"),
    companySize: formData.get("companySize"),
    employeeCount: num("employeeCount"),
    // form input is in MAD — stored as integer centimes
    maxContractValueMAD:
      maxContractValueMAD === undefined ? undefined : Math.round(maxContractValueMAD * 100),
    fnbtpCategory: str("fnbtpCategory"),
    fnbtpNumber: str("fnbtpNumber"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  await withUserContext(session.userId, session.role, async (tx) => {
    const before = await tx.query.contractorProfiles.findFirst({
      where: eq(contractorProfiles.id, contractorId),
      columns: {
        companyName: true,
        ice: true,
        rc: true,
        specialties: true,
        regions: true,
        companySize: true,
        employeeCount: true,
        maxContractValueCentimes: true,
        fnbtpCategory: true,
        fnbtpNumber: true,
      },
    });

    await tx
      .update(contractorProfiles)
      .set({
        companyName: data.companyName,
        ice: data.ice ?? null,
        rc: data.rc ?? null,
        specialties: data.specialties,
        regions: data.regions,
        companySize: data.companySize,
        employeeCount: data.employeeCount ?? null,
        maxContractValueCentimes: data.maxContractValueMAD ?? null,
        fnbtpCategory: data.fnbtpCategory ?? null,
        fnbtpNumber: data.fnbtpNumber ?? null,
        updatedAt: new Date(),
      })
      .where(eq(contractorProfiles.id, contractorId));

    await tx.insert(auditLogs).values({
      actorUserId: session.userId,
      entity: "contractor_profile",
      entityId: contractorId,
      action: "update",
      before,
      after: data,
    });
  });

  revalidatePath("/", "layout");
  return { success: true };
}
