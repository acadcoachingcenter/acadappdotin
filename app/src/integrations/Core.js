// Real module replacing the apiClient vite-plugin's virtual "@/integrations/Core" import.
import { apiClient } from "@/api/apiClient";
export const UploadFile = apiClient.integrations.Core.UploadFile;
export const SendEmail = apiClient.integrations.Core.SendEmail;
export const InvokeLLM = apiClient.integrations.Core.InvokeLLM;
