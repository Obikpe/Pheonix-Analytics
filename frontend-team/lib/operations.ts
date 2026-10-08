import { request } from "./api";

export const organisations = () => request<any>("/operations/organisations");
export const organisationMembers = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/members");
export const memberSummary = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/members/summary");
export const organisationContract = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/contract");
export const organisationCapacity = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/capacity");
export const contractPreparation = (id:string) => request<any>("/operations/organisations/"+encodeURIComponent(id)+"/contract-preparation");
export const contractRules=(id:string)=>request<any>("/operations/organisations/"+encodeURIComponent(id)+"/contract-rules");
export const contractTemplates=()=>request<any>("/operations/contract-templates");
export const contractTemplateClauses=(id:string)=>request<any>("/operations/contract-templates/"+encodeURIComponent(id)+"/clauses");
export const saveContractPreparation=(id:string,payload:any)=>request<any>("/operations/organisations/"+encodeURIComponent(id)+"/contract-preparation",{method:"POST",body:JSON.stringify(payload)});
export const generateContractDraft=(id:string)=>request<any>("/operations/organisations/"+encodeURIComponent(id)+"/contract-draft",{method:"POST"});
export const organisationRequests = () => request<any>("/operations/organisation-requests");
export const creatorApplications = () => request<any>("/operations/creators/applications");
export const creatorPayouts = () => request<any>("/operations/creators/payouts");
export const aiProviders = () => request<any>("/operations/ai/providers");
export const aiLimits = () => request<any>("/operations/ai/limits");
export const createOrganisation=(payload:any)=>request<any>("/operations/organisations",{method:"POST",body:JSON.stringify(payload)});
export const updateOrganisation=(id:string,payload:any)=>request<any>("/operations/organisations/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});

export const reviewCreatorApplication=(id:string,status:"approved"|"declined")=>request<any>("/operations/creators/applications/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({status})});

export const updateOrganisationRequest=(id:string,status:string)=>request<any>("/operations/organisation-requests/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({status})});
