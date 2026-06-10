import { z } from "zod";

const tradeSpecialtyEnum = z.enum([
  "genie_civil",
  "batiment",
  "second_oeuvre",
  "plomberie",
  "electricite",
  "courants_faibles",
  "hvac",
  "charpente",
  "peinture",
  "architecture",
  "bureau_etudes",
  "routes",
  "hydraulique",
  "equipment_supplier",
  "other",
]);

export const createGroupementSchema = z.object({
  tenderId: z.string().uuid(),
  lotId: z.string().uuid().optional(),
  title: z.string().min(5).max(300),
  targetBudget: z.number().int().positive().optional(), // centimes
  neededSpecialties: z
    .array(tradeSpecialtyEnum)
    .min(1, "Must specify at least one needed specialty"),
  workspaceNotes: z.string().max(2000).optional(),
});

export const inviteMemberSchema = z.object({
  groupementId: z.string().uuid(),
  contractorId: z.string().uuid(),
  specialty: tradeSpecialtyEnum,
  estimatedShare: z.number().int().positive().optional(), // centimes
  // Role is always cotraitant on invite; mandataire is the initiator only
});

export const updateGroupementStatusSchema = z.object({
  groupementId: z.string().uuid(),
  status: z.enum(["forming", "formed", "submitting", "submitted", "won", "lost", "withdrawn"]),
});

export type CreateGroupementInput = z.infer<typeof createGroupementSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateGroupementStatusInput = z.infer<typeof updateGroupementStatusSchema>;
