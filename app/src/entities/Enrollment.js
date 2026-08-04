// Real module replacing the apiClient vite-plugin's virtual "@/entities/Enrollment" import.
import { apiClient } from "@/api/apiClient";
export const Enrollment = apiClient.entities.Enrollment;
