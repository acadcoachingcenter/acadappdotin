// Real module replacing the apiClient vite-plugin's virtual "@/entities/Course" import.
import { apiClient } from "@/api/apiClient";
export const Course = apiClient.entities.Course;
