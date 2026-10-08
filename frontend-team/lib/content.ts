import {request} from "./api";

export const contentCourses = () => request<any>("/content/courses");
export const contentModules = (courseId:string) => request<any>("/content/courses/"+encodeURIComponent(courseId)+"/modules");
export const contentLessons = (moduleId:string) => request<any>("/content/modules/"+encodeURIComponent(moduleId)+"/lessons");
export const contentLesson = (lessonId:string) => request<any>("/content/lessons/"+encodeURIComponent(lessonId));
export const contentLessonMedia = (lessonId:string) => request<any>("/content/lessons/"+encodeURIComponent(lessonId)+"/media");
