import { request } from "./api";

export const organisations = () => request<any>("/organisations");
export const organisationMembers = (id:string) => request<any>("/organisations/"+encodeURIComponent(id)+"/members");
export const memberSummary = (id:string) => request<any>("/organisations/"+encodeURIComponent(id)+"/members/summary");
export const organisationContract = (id:string) => request<any>("/commercial/organisations/"+encodeURIComponent(id)+"/contract");
export const organisationCapacity = (id:string) => request<any>("/commercial/organisations/"+encodeURIComponent(id)+"/capacity");
export const organisationRequests = () => request<any>("/commercial/organisation-requests");
export const creatorApplications = () => request<any>("/creator/admin/applications");
export const creatorPayouts = () => request<any>("/creator-finance/admin/payouts");
export const aiProviders = () => request<any>("/ai/admin/providers");
export const aiLimits = () => request<any>("/ai/admin/limits");