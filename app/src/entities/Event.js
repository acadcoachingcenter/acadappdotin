// Real module replacing the apiClient vite-plugin's virtual "@/entities/Event" import.
import { apiClient } from "@/api/apiClient";
export const Event = apiClient.entities.Event;
