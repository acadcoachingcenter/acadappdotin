// Real module replacing the base44 vite-plugin's virtual "@/entities/Event" import.
import { base44 } from "@/api/base44Client";
export const Event = base44.entities.Event;
