import { request } from "./client";

export const publicTutors = () => request<{success:boolean;tutors:any[]}>("/public/tutors");
export const publicOrganisations = () => request<{success:boolean;organisations:any[]}>("/public/organisations");
export const submitOrganisationRequest = (payload:Record<string,unknown>) =>
  request<{success:boolean;request:any}>("/commercial/organisation-requests", {
    method:"POST",
    body:JSON.stringify(payload),
  });
