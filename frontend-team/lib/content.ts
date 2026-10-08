import {request} from "./api";

export const contentCourses = () => request<any>("/content/courses");
export const createCourse=(payload:any)=>request<any>("/content/courses",{method:"POST",body:JSON.stringify(payload)});
export const contentCourse=(courseId:string)=>request<any>("/content/courses/"+encodeURIComponent(courseId));
export const updateCourse=(id:string,payload:any)=>request<any>("/content/courses/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
export const archiveCourse=(id:string)=>request<any>("/content/courses/"+encodeURIComponent(id)+"/archive",{method:"POST"});
export const contentModules = (courseId:string) => request<any>("/content/courses/"+encodeURIComponent(courseId)+"/modules");
export const contentLessons = (moduleId:string) => request<any>("/content/modules/"+encodeURIComponent(moduleId)+"/lessons");
export const contentLesson = (lessonId:string) => request<any>("/content/lessons/"+encodeURIComponent(lessonId));
export const contentLessonMedia = (lessonId:string) => request<any>("/content/lessons/"+encodeURIComponent(lessonId)+"/media");
export const courseStructure = (courseId:string) => request<any>("/content/courses/"+encodeURIComponent(courseId)+"/structure");
export const createModule=(courseId:string,payload:any)=>request<any>("/content/courses/"+encodeURIComponent(courseId)+"/modules",{method:"POST",body:JSON.stringify(payload)});
export const updateModule=(id:string,payload:any)=>request<any>("/content/modules/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
export const createLesson=(moduleId:string,payload:any)=>request<any>("/content/modules/"+encodeURIComponent(moduleId)+"/lessons",{method:"POST",body:JSON.stringify(payload)});
export const updateLesson=(id:string,payload:any)=>request<any>("/content/lessons/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
export const archiveModule=(id:string)=>request<any>("/content/modules/"+encodeURIComponent(id)+"/archive",{method:"POST"});
export const archiveLesson=(id:string)=>request<any>("/content/lessons/"+encodeURIComponent(id)+"/archive",{method:"POST"});

export const reorderModules=(courseId:string,items:{id:string;order_index:number}[])=>request<any>("/content/courses/"+encodeURIComponent(courseId)+"/modules/reorder",{method:"PATCH",body:JSON.stringify(items)});
export const reorderLessons=(moduleId:string,items:{id:string;order_index:number}[])=>request<any>("/content/modules/"+encodeURIComponent(moduleId)+"/lessons/reorder",{method:"PATCH",body:JSON.stringify(items)});
export const createVideoUpload=(lessonId:string,payload:any)=>request<any>("/content/lessons/"+encodeURIComponent(lessonId)+"/video-upload",{method:"POST",body:JSON.stringify(payload)});
export const createVideo=(lessonId:string,payload:any)=>request<any>("/content/lessons/"+encodeURIComponent(lessonId)+"/videos",{method:"POST",body:JSON.stringify(payload)});
export const updateVideo=(id:string,payload:any)=>request<any>("/content/videos/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)});
export const createResource=(lessonId:string,payload:any)=>request<any>("/content/lessons/"+encodeURIComponent(lessonId)+"/resources",{method:"POST",body:JSON.stringify(payload)});
