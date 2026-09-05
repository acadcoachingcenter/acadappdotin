// Real module replacing the base44 vite-plugin's virtual "@/entities/User" import.
import { apiClient } from "@/api/apiClient";

// base44's generated SDK provided User.me() and User.updateMyUserData() as
// convenience methods for the logged-in user's own record, without needing
// their id. The custom apiClient replacement only implemented generic entity
// CRUD (list/filter/get/create/update/delete, all needing an explicit id) -
// neither convenience method actually existed here, so every call site using
// them (Onboarding.jsx, Profile.jsx) was calling undefined functions. That's
// why "Complete Your Profile", profile edits, and photo upload all silently
// or visibly failed for every user, not just new ones.
export const User = {
  ...apiClient.entities.User,
  me: () => apiClient.auth.me(),
  updateMyUserData: (data) => apiClient.auth.updateMe(data),
};
