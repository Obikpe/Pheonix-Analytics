import { request } from "./api";

export const organisations = () => request<any>("/operations/organisations");
export const organisationMembers = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/members");
export const memberSummary = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/members/summary");
export const organisationContract = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/contract");
export const organisationCapacity = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/capacity");
export const organisationRequests = () => request<any>("/commercial/organisation-requests");
export const creatorApplications = () => request<any>("/operations/creators/applications");
export const creatorPayouts = () => request<any>("/operations/creators/payouts");
export const aiProviders = () => request<any>("/operations/ai/providers");
export const aiLimits = () => request<any>("/operations/ai/limits");
export const createOrganisation=(payload:any)=>request<any>("/operations/organisations",{method:"POST",body:JSON.stringify(payload)});
export const updateOrganisation=(id:string,payload:any)=>request<any>("/operations/organisations/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
