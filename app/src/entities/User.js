// Real module replacing the base44 vite-plugin's virtual "@/entities/User" import.
import { apiClient } from "@/api/apiClient";

export const User = apiClient.entities.User;
