// Real module replacing the apiClient vite-plugin's virtual "@/entities/StudyMaterial" import.
import { apiClient } from "@/api/apiClient";
export const StudyMaterial = apiClient.entities.StudyMaterial;
