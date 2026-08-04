// Real module replacing the apiClient vite-plugin's virtual "@/entities/Assignment" import.
import { apiClient } from "@/api/apiClient";
export const Assignment = apiClient.entities.Assignment;
