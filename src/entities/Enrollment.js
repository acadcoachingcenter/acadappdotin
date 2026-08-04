// Real module replacing the base44 vite-plugin's virtual "@/entities/Enrollment" import.
import { base44 } from "@/api/base44Client";
export const Enrollment = base44.entities.Enrollment;
