// Real module replacing the base44 vite-plugin's virtual "@/integrations/Core" import.
import { base44 } from "@/api/base44Client";
export const UploadFile = base44.integrations.Core.UploadFile;
export const SendEmail = base44.integrations.Core.SendEmail;
export const InvokeLLM = base44.integrations.Core.InvokeLLM;
