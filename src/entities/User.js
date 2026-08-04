// Real module replacing the base44 vite-plugin's virtual "@/entities/User" import.
import { base44 } from "@/api/base44Client";
export const User = base44.entities.User;
