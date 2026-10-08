import {request} from "./api";

export const contentCourses = () => request<any>("/content/courses");
export const contentModules = (courseId:string) => request<any>("/content/courses/"+encodeURIComponent(courseId)+"/modules");
export const contentLessons = (moduleId:string) => request<any>("/content/modules/"+encodeURIComponent(moduleId)+"/lessons");
export const contentLesson = (lessonId:string) => request<any>("/content/lessons/"+encodeURIComponent(lessonId));
export const contentLessonMedia = (lessonId:string) => request<any>("/content/lessons/"+encodeURIComponent(lessonId)+"/media");
export const createModule=(courseId:string,payload:any)=>request<any>("/content/courses/"+encodeURIComponent(courseId)+"/modules",{method:"POST",body:JSON.stringify(payload)});
export const updateModule=(id:string,payload:any)=>request<any>("/content/modules/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
export const createLesson=(moduleId:string,payload:any)=>request<any>("/content/modules/"+encodeURIComponent(moduleId)+"/lessons",{method:"POST",body:JSON.stringify(payload)});
export const updateLesson=(id:string,payload:any)=>request<any>("/content/lessons/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
export const archiveModule=(id:string)=>request<any>("/content/modules/"+encodeURIComponent(id)+"/archive",{method:"POST"});
export const archiveLesson=(id:string)=>request<any>("/content/lessons/"+encodeURIComponent(id)+"/archive",{method:"POST"});
