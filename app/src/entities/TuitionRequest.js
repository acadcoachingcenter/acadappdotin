// Real module replacing the apiClient vite-plugin's virtual "@/entities/TuitionRequest" import.
import { apiClient } from "@/api/apiClient";
export const TuitionRequest = apiClient.entities.TuitionRequest;
