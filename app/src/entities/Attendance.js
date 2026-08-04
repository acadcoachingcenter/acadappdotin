// Real module replacing the apiClient vite-plugin's virtual "@/entities/Attendance" import.
import { apiClient } from "@/api/apiClient";
export const Attendance = apiClient.entities.Attendance;
