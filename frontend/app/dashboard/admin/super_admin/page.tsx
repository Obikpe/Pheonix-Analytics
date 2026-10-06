'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'https://learnora-backend.vercel.app';

export const dynamic = 'force-dynamic';

type Tab =
  | 'overview'
  | 'analytics'
  | 'activity'
  | 'courses'
  | 'content'
  | 'media'
  | 'users'
  | 'normal'
  | 'witstart'
  | 'admins'
  | 'billing'
  | 'security'
  | 'settings';

type AdminRole =
  | 'super_admin'
  | 'staff_admin'
  | 'witstart_admin';

type LearnerRole =
  | 'normal'
  | 'witstart';

type CourseStatus =
  | 'published'
  | 'draft'
  | 'archived';

type Course = {
  id?: number | string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  track?: string | null;
  level?: string | null;
  status?: CourseStatus | string | null;
  is_published?: boolean | null;
  published?: boolean | null;
  instructor?: string | null;
  instructor_name?: string | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  lessons_count?: number | null;
  lesson_count?: number | null;

  videos_count?: number | null;
  video_count?: number | null;

  enrolments_count?: number | null;
  enrollments_count?: number | null;

  completion_rate?: number | null;
  duration_minutes?: number | null;
};

type Lesson = {
  id?: number | string;
  course_id?: number | string | null;

  title?: string | null;
  description?: string | null;

  order?: number | null;
  position?: number | null;

  duration_minutes?: number | null;

  video_url?: string | null;
  video?: string | null;
  video_id?: string | null;

  thumbnail_url?: string | null;
  notes?: string | null;
  resource_url?: string | null;

  status?: string | null;
  is_published?: boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type Media = {
  id?: number | string;

  name?: string | null;
  title?: string | null;

  type?: string | null;
  mime_type?: string | null;

  url?: string | null;
  file_url?: string | null;

  size_bytes?: number | null;
  duration_seconds?: number | null;

  course_id?: number | string | null;
  lesson_id?: number | string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type UserRecord = {
  id?: number | string;

  name?: string | null;
  email: string;

  role?: LearnerRole | string | null;
  account_type?: string | null;

  sub_status?: string | null;
  subscription_tier?: string | null;

  is_paid?: boolean | null;
  is_active?: boolean | null;

  expires_at?: string | null;
  trial_ends_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
};

type AdminRecord = {
  id?: number | string;

  name?: string | null;
  email: string;

  role?: AdminRole | string | null;
  is_active?: boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
};

type ActivityRecord = Record<string, unknown> & {
  action?: string | null;
  event?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  ip?: string | null;

  timestamp?: string | null;
  created_at?: string | null;

  metadata?: unknown;
};

type SecurityLog = ActivityRecord;

type Stats = Record<string, unknown>;
type Traffic = Record<string, unknown>;
type SecuritySummary = Record<string, unknown>;

type CourseForm = {
  title: string;
  description: string;
  category: string;
  track: string;
  level: string;
  instructor: string;
  status: string;
};

type LessonForm = {
  id?: number | string;
  title: string;
  description: string;
  order: string;
  duration_minutes: string;
  video_url: string;
  notes: string;
  resource_url: string;
  is_published: boolean;
};

type VideoForm = {
  lessonId?: number | string;
  video_url: string;
  title: string;
  duration_minutes: string;
};

type LearnerForm = {
  name: string;
  email: string;
  password: string;
  role: LearnerRole;
};

type AdminForm = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
};

const EMPTY_COURSE: CourseForm = {
  title: '',
  description: '',
  category: '',
  track: '',
  level: 'Beginner',
  instructor: '',
  status: 'draft',
};

const EMPTY_LESSON: LessonForm = {
  id: undefined,
  title: '',
  description: '',
  order: '1',
  duration_minutes: '',
  video_url: '',
  notes: '',
  resource_url: '',
  is_published: false,
};

const EMPTY_VIDEO: VideoForm = {
  lessonId: undefined,
  video_url: '',
  title: '',
  duration_minutes: '',
};

const EMPTY_LEARNER: LearnerForm = {
  name: '',
  email: '',
  password: '',
  role: 'normal',
};

const EMPTY_ADMIN: AdminForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff_admin',
};

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') {
    return {
      'Content-Type': 'application/json',
    };
  }

  const token = localStorage.getItem('phx_token');

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('__AUTH_ERROR__');
  }

  if (!response.ok) {
    const body =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : null;

    const detail =
      body && typeof body.detail !== 'undefined'
        ? body.detail
        : body && typeof body.error !== 'undefined'
          ? body.error
          : null;

    throw new Error(
      detail
        ? String(detail)
        : `Request failed with status ${response.status}`,
    );
  }

  return payload as T;
}

/**
 * Used only for genuinely optional endpoints.
 * It does not hide authentication failures.
 */
async function optionalFetch<T = unknown>(
  path: string,
): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === '__AUTH_ERROR__'
    ) {
      throw error;
    }

    return null;
  }
}

function unwrapArray<T>(
  payload: unknown,
  keys: string[] = [],
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const object = payload as Record<string, unknown>;

  for (const key of keys) {
    if (Array.isArray(object[key])) {
      return object[key] as T[];
    }
  }

  for (const value of Object.values(object)) {
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

function unwrapObject<T>(
  payload: unknown,
  keys: string[] = [],
): T | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return null;
  }

  const object = payload as Record<string, unknown>;

  for (const key of keys) {
    if (
      object[key] &&
      typeof object[key] === 'object' &&
      !Array.isArray(object[key])
    ) {
      return object[key] as T;
    }
  }

  return payload as T;
}

function valueOf(
  object: unknown,
  keys: string[],
  fallback = 0,
): number {
  if (!object || typeof object !== 'object') {
    return fallback;
  }

  const record = object as Record<string, unknown>;

  for (const key of keys) {
    const value = Number(record[key]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
}

function courseName(course: Course) {
  return course.title || course.name || 'Untitled course';
}

function lessonVideo(lesson: Lesson) {
  return lesson.video_url || lesson.video || '';
}

function lessonPosition(lesson: Lesson) {
  return Number(
    lesson.order ??
      lesson.position ??
      0,
  );
}

function timestamp(
  item: ActivityRecord | SecurityLog,
) {
  return item.timestamp || item.created_at || '';
}

function fmtDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleString();
}

function fmtBytes(value?: number | null) {
  if (!value || value <= 0) {
    return '—';
  }

  const units = ['B', 'KB', 'MB', 'GB'];

  let n = value;
  let i = 0;

  while (
    n >= 1024 &&
    i < units.length - 1
  ) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(
    n >= 10 || i === 0 ? 0 : 1,
  )} ${units[i]}`;
}

function roleLabel(role?: string | null) {
  return (
    String(role || '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, x => x.toUpperCase()) ||
    'Unknown'
  );
}

function statusLabel(status?: string | null) {
  return String(status || 'draft')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, x => x.toUpperCase());
}

function normaliseCourseStatus(
  course: Course,
): string {
  const raw = String(
    course.status ||
      (course.is_published || course.published
        ? 'published'
        : 'draft'),
  ).toLowerCase();

  return raw;
}

function courseLessonCount(course: Course) {
  return Number(
    course.lessons_count ??
      course.lesson_count ??
      0,
  );
}

function courseVideoCount(course: Course) {
  return Number(
    course.videos_count ??
      course.video_count ??
      0,
  );
}

function courseEnrollmentCount(course: Course) {
  return Number(
    course.enrolments_count ??
      course.enrollments_count ??
      0,
  );
}

function courseHealth(course: Course) {
  const lessons = courseLessonCount(course);
  const videos = courseVideoCount(course);

  if (lessons === 0) {
    return 'empty';
  }

  if (videos < lessons) {
    return 'missing-video';
  }

  return 'healthy';
}

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<Tab>('overview');

  const [adminName, setAdminName] =
    useState('Super Admin');

  const [adminEmail, setAdminEmail] =
    useState('');

  const [users, setUsers] =
    useState<UserRecord[]>([]);

  const [admins, setAdmins] =
    useState<AdminRecord[]>([]);

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [activity, setActivity] =
    useState<ActivityRecord[]>([]);

  const [securityLogs, setSecurityLogs] =
    useState<SecurityLog[]>([]);

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [traffic, setTraffic] =
    useState<Traffic | null>(null);

  const [securitySummary, setSecuritySummary] =
    useState<SecuritySummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [liveLoading, setLiveLoading] =
    useState(false);

  const [courseLoading, setCourseLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  const [userSearch, setUserSearch] =
    useState('');

  const [courseSearch, setCourseSearch] =
    useState('');

  const [courseFilter, setCourseFilter] =
    useState('all');

  const [adminSearch, setAdminSearch] =
    useState('');

  const [userFilter, setUserFilter] =
    useState<'all' | 'normal' | 'witstart'>(
      'all',
    );

  const [selectedCourse, setSelectedCourse] =
    useState<Course | null>(null);

  const [selectedLearner, setSelectedLearner] =
    useState<UserRecord | null>(null);

  const [selectedAdmin, setSelectedAdmin] =
    useState<AdminRecord | null>(null);

  const [lessons, setLessons] =
    useState<Lesson[]>([]);

  /**
   * Course media is kept separate from
   * the global media library.
   */
  const [courseMedia, setCourseMedia] =
    useState<Media[]>([]);

  const [media, setMedia] =
    useState<Media[]>([]);

  const [courseDetailLoading, setCourseDetailLoading] =
    useState(false);

  const [courseDetailError, setCourseDetailError] =
    useState('');

  const [mediaError, setMediaError] =
    useState('');

  const [coursesError, setCoursesError] =
    useState('');

  const [showCourse, setShowCourse] =
    useState(false);

  const [showLesson, setShowLesson] =
    useState(false);

  const [showVideo, setShowVideo] =
    useState(false);

  const [showCreateLearner, setShowCreateLearner] =
    useState(false);

  const [showCreateAdmin, setShowCreateAdmin] =
    useState(false);

  const [showLearner, setShowLearner] =
    useState(false);

  const [showAdmin, setShowAdmin] =
    useState(false);

  const [courseForm, setCourseForm] =
    useState<CourseForm>(EMPTY_COURSE);

  const [lessonForm, setLessonForm] =
    useState<LessonForm>(EMPTY_LESSON);

  const [videoForm, setVideoForm] =
    useState<VideoForm>(EMPTY_VIDEO);

  const [learnerForm, setLearnerForm] =
    useState<LearnerForm>(EMPTY_LEARNER);

  const [adminForm, setAdminForm] =
    useState<AdminForm>(EMPTY_ADMIN);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const handleAuthError = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phx_token');
      localStorage.removeItem('phx_admin_user');
    }

    router.push('/login');
  }, [router]);

  const loadCurrentAdmin = useCallback(async () => {
    try {
      const response =
        await apiFetch<unknown>('/auth/me');

      const me = unwrapObject<Record<string, unknown>>(
        response,
        ['user', 'admin', 'data'],
      );

      if (me) {
        setAdminName(
          textOf(
            me,
            ['name', 'full_name', 'display_name'],
            'Super Admin',
          ),
        );

        setAdminEmail(
          textOf(me, ['email'], ''),
        );
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      /**
       * Fallback only.
       * This does not create fake identity data.
       */
      if (typeof window !== 'undefined') {
        const raw =
          localStorage.getItem('phx_admin_user');

        if (raw) {
          try {
            const me = JSON.parse(raw);

            if (me?.name) {
              setAdminName(String(me.name));
            }

            if (me?.email) {
              setAdminEmail(String(me.email));
            }
          } catch {
            // Ignore malformed local cache.
          }
        }
      }
    }
  }, [handleAuthError]);

  const fetchLiveData = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLiveLoading(true);
      }

      try {
        const [
          statsResponse,
          trafficResponse,
          activityResponse,
          securityResponse,
          securitySummaryResponse,
        ] = await Promise.all([
          apiFetch<unknown>('/api/admin/stats'),
          apiFetch<unknown>('/api/admin/traffic'),
          apiFetch<unknown>('/api/admin/activity'),
          apiFetch<unknown>('/api/admin/security-logs'),
          apiFetch<unknown>('/api/admin/security-summary'),
        ]);

        setStats(
          unwrapObject<Stats>(
            statsResponse,
            ['stats'],
          ),
        );

        setTraffic(
          unwrapObject<Traffic>(
            trafficResponse,
            ['traffic'],
          ),
        );

        setActivity(
          unwrapArray<ActivityRecord>(
            activityResponse,
            [
              'activity',
              'logs',
              'events',
            ],
          ),
        );

        setSecurityLogs(
          unwrapArray<SecurityLog>(
            securityResponse,
            [
              'logs',
              'security_logs',
              'events',
            ],
          ),
        );

        setSecuritySummary(
          unwrapObject<SecuritySummary>(
            securitySummaryResponse,
            ['summary'],
          ),
        );

        setLastUpdated(new Date());
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
          return;
        }

        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard data.',
          );
        }
      } finally {
        if (!silent) {
          setLiveLoading(false);
        }
      }
    },
    [handleAuthError],
  );

  const fetchDirectoryData =
    useCallback(
      async (silent = false) => {
        try {
          const [
            usersResponse,
            adminsResponse,
          ] = await Promise.all([
            apiFetch<unknown>(
              '/api/admin/users',
            ),
            apiFetch<unknown>(
              '/api/admin/admins',
            ),
          ]);

          setUsers(
            unwrapArray<UserRecord>(
              usersResponse,
              ['users', 'learners'],
            ),
          );

          setAdmins(
            unwrapArray<AdminRecord>(
              adminsResponse,
              ['admins'],
            ),
          );
        } catch (err) {
          if (
            err instanceof Error &&
            err.message === '__AUTH_ERROR__'
          ) {
            handleAuthError();
            return;
          }

          if (!silent) {
            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load users and administrators.',
            );
          }
        }
      },
      [handleAuthError],
    );

  const fetchMedia = useCallback(
    async () => {
      setMediaError('');

      try {
        const response =
          await apiFetch<unknown>(
            '/api/admin/media',
          );

        setMedia(
          unwrapArray<Media>(
            response,
            [
              'media',
              'items',
              'data',
            ],
          ),
        );
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
          return;
        }

        setMedia([]);

        setMediaError(
          err instanceof Error
            ? err.message
            : 'Unable to load media library.',
        );
      }
    },
    [handleAuthError],
  );

  const fetchCourses = useCallback(
    async (silent = false) => {
      if (!silent) {
        setCourseLoading(true);
      }

      setCoursesError('');

      try {
        const response =
          await apiFetch<unknown>(
            '/api/admin/courses',
          );

        setCourses(
          unwrapArray<Course>(
            response,
            [
              'courses',
              'items',
              'data',
            ],
          ),
        );
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
          return;
        }

        setCoursesError(
          err instanceof Error
            ? err.message
            : 'Unable to load courses.',
        );
      } finally {
        if (!silent) {
          setCourseLoading(false);
        }
      }
    },
    [handleAuthError],
  );

  const fetchAll = useCallback(
    async () => {
      setLoading(true);
      clearMessages();

      await Promise.all([
        fetchLiveData(true),
        fetchDirectoryData(true),
        fetchCourses(true),
        fetchMedia(),
        loadCurrentAdmin(),
      ]);

      setLoading(false);
    },
    [
      clearMessages,
      fetchCourses,
      fetchDirectoryData,
      fetchLiveData,
      fetchMedia,
      loadCurrentAdmin,
    ],
  );

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const id = window.setInterval(
      () => {
        void fetchLiveData(true);
      },
      60000,
    );

    return () => {
      window.clearInterval(id);
    };
  }, [fetchLiveData]);

  const openCourse = useCallback(
    async (course: Course) => {
      setSelectedCourse(course);

      setLessons([]);
      setCourseMedia([]);

      setCourseDetailError('');
      setCourseDetailLoading(true);

      if (!course.id) {
        setCourseDetailError(
          'This course does not have a usable ID.',
        );
        setCourseDetailLoading(false);
        return;
      }

      try {
        const id = encodeURIComponent(
          String(course.id),
        );

        const [
          lessonsResponse,
          mediaResponse,
        ] = await Promise.all([
          apiFetch<unknown>(
            `/api/admin/courses/${id}/lessons`,
          ),
          optionalFetch<unknown>(
            `/api/admin/courses/${id}/media`,
          ),
        ]);

        setLessons(
          unwrapArray<Lesson>(
            lessonsResponse,
            [
              'lessons',
              'items',
              'data',
            ],
          ).sort(
            (a, b) =>
              lessonPosition(a) -
              lessonPosition(b),
          ),
        );

        setCourseMedia(
          unwrapArray<Media>(
            mediaResponse,
            [
              'media',
              'items',
              'data',
            ],
          ),
        );
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === '__AUTH_ERROR__'
        ) {
          handleAuthError();
          return;
        }

        setCourseDetailError(
          err instanceof Error
            ? err.message
            : 'Unable to load course content.',
        );
      } finally {
        setCourseDetailLoading(false);
      }
    },
    [handleAuthError],
  );

  const saveCourse = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    clearMessages();

    try {
      const isEdit =
        Boolean(selectedCourse?.id);

      const path = isEdit
        ? `/api/admin/courses/${encodeURIComponent(
            String(selectedCourse!.id),
          )}`
        : '/api/admin/courses';

      await apiFetch(path, {
        method: isEdit
          ? 'PATCH'
          : 'POST',
        body: JSON.stringify({
          ...courseForm,
          status:
            courseForm.status.toLowerCase(),
        }),
      });

      setSuccess(
        isEdit
          ? 'Course updated successfully.'
          : 'Course created successfully.',
      );

      setShowCourse(false);
      setSelectedCourse(null);
      setCourseForm(EMPTY_COURSE);

      await fetchCourses(true);
      await fetchLiveData(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save course.',
      );
    }
  };

  const deleteCourse = async (
    course: Course,
  ) => {
    if (!course.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete “${courseName(
          course,
        )}”? This is a permanent content operation. If this course has learners, lessons or other linked records, verify that deletion is safe before continuing.`,
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      await apiFetch(
        `/api/admin/courses/${encodeURIComponent(
          String(course.id),
        )}`,
        {
          method: 'DELETE',
        },
      );

      setSuccess(
        'Course deleted successfully.',
      );

      setSelectedCourse(null);

      await fetchCourses(true);
      await fetchLiveData(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete course.',
      );
    }
  };

  const openCreateLesson = () => {
    const nextOrder =
      lessons.length + 1;

    setLessonForm({
      ...EMPTY_LESSON,
      order: String(nextOrder),
    });

    setShowLesson(true);
  };

  const openEditLesson = (
    lesson: Lesson,
  ) => {
    setLessonForm({
      id: lesson.id,
      title: lesson.title || '',
      description:
        lesson.description || '',
      order: String(
        lessonPosition(lesson) ||
          lessons.length + 1,
      ),
      duration_minutes:
        lesson.duration_minutes != null
          ? String(
              lesson.duration_minutes,
            )
          : '',
      video_url:
        lessonVideo(lesson),
      notes: lesson.notes || '',
      resource_url:
        lesson.resource_url || '',
      is_published:
        Boolean(lesson.is_published),
    });

    setShowLesson(true);
  };

  const saveLesson = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (!selectedCourse?.id) {
      setError(
        'Select a course before saving a lesson.',
      );
      return;
    }

    clearMessages();

    try {
      const isEdit =
        Boolean(lessonForm.id);

      const path = isEdit
        ? `/api/admin/lessons/${encodeURIComponent(
            String(lessonForm.id),
          )}`
        : `/api/admin/courses/${encodeURIComponent(
            String(selectedCourse.id),
          )}/lessons`;

      const body = {
        title: lessonForm.title,
        description:
          lessonForm.description,
        order: Number(
          lessonForm.order || 1,
        ),
        duration_minutes:
          lessonForm.duration_minutes
            ? Number(
                lessonForm.duration_minutes,
              )
            : null,
        video_url:
          lessonForm.video_url || null,
        notes:
          lessonForm.notes || null,
        resource_url:
          lessonForm.resource_url || null,
        is_published:
          lessonForm.is_published,
      };

      await apiFetch(path, {
        method: isEdit
          ? 'PATCH'
          : 'POST',
        body: JSON.stringify(body),
      });

      setSuccess(
        isEdit
          ? 'Lesson updated successfully.'
          : 'Lesson created successfully.',
      );

      setShowLesson(false);
      setLessonForm(EMPTY_LESSON);

      await openCourse(
        selectedCourse,
      );

      await fetchCourses(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save lesson.',
      );
    }
  };

  const deleteLesson = async (
    lesson: Lesson,
  ) => {
    if (!lesson.id) {
      return;
    }

    if (
      !window.confirm(
        `Delete “${
          lesson.title ||
          'this lesson'
        }”?`,
      )
    ) {
      return;
    }

    clearMessages();

    try {
      await apiFetch(
        `/api/admin/lessons/${encodeURIComponent(
          String(lesson.id),
        )}`,
        {
          method: 'DELETE',
        },
      );

      setSuccess(
        'Lesson deleted successfully.',
      );

      if (selectedCourse) {
        await openCourse(
          selectedCourse,
        );
      }

      await fetchCourses(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete lesson.',
      );
    }
  };

  const openVideoModal = (
    lessonId?: number | string,
  ) => {
    setVideoForm({
      ...EMPTY_VIDEO,
      lessonId,
    });

    setShowVideo(true);
  };

  const saveVideo = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    clearMessages();

    try {
      const lessonId =
        videoForm.lessonId;

      if (!lessonId) {
        throw new Error(
          'Select a lesson first.',
        );
      }

      if (
        !videoForm.video_url.trim()
      ) {
        throw new Error(
          'Enter a video URL.',
        );
      }

      await apiFetch(
        `/api/admin/lessons/${encodeURIComponent(
          String(lessonId),
        )}/video`,
        {
          method: 'POST',
          body: JSON.stringify({
            video_url:
              videoForm.video_url.trim(),
            title:
              videoForm.title.trim() ||
              null,
            duration_minutes:
              videoForm.duration_minutes
                ? Number(
                    videoForm.duration_minutes,
                  )
                : null,
          }),
        },
      );

      setSuccess(
        'Video attached to lesson successfully.',
      );

      setShowVideo(false);
      setVideoForm(EMPTY_VIDEO);

      if (selectedCourse) {
        await openCourse(
          selectedCourse,
        );
      }

      await fetchCourses(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to attach video.',
      );
    }
  };

  const createLearner = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    clearMessages();

    try {
      await apiFetch(
        '/api/admin/users',
        {
          method: 'POST',
          body: JSON.stringify(
            learnerForm,
          ),
        },
      );

      setSuccess(
        'Learner created successfully.',
      );

      setShowCreateLearner(false);
      setLearnerForm(
        EMPTY_LEARNER,
      );

      await fetchDirectoryData(true);
      await fetchLiveData(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create learner.',
      );
    }
  };

  const createAdmin = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    clearMessages();

    try {
      await apiFetch(
        '/api/admin/admins',
        {
          method: 'POST',
          body: JSON.stringify(
            adminForm,
          ),
        },
      );

      setSuccess(
        `${roleLabel(
          adminForm.role,
        )} created successfully.`,
      );

      setShowCreateAdmin(false);
      setAdminForm(EMPTY_ADMIN);

      await fetchDirectoryData(true);
      await fetchLiveData(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create administrator.',
      );
    }
  };

  const deleteAdmin = async (
    admin: AdminRecord,
  ) => {
    if (!admin.id) {
      return;
    }

    if (
      admin.email.toLowerCase() ===
      adminEmail.toLowerCase()
    ) {
      setError(
        'You cannot delete the currently signed-in administrator from this screen.',
      );
      return;
    }

    if (
      !window.confirm(
        `Delete administrator ${admin.email}?`,
      )
    ) {
      return;
    }

    clearMessages();

    try {
      await apiFetch(
        `/api/admin/admins/${encodeURIComponent(
          String(admin.id),
        )}`,
        {
          method: 'DELETE',
        },
      );

      setSuccess(
        'Administrator deleted successfully.',
      );

      await fetchDirectoryData(true);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === '__AUTH_ERROR__'
      ) {
        handleAuthError();
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete administrator.',
      );
    }
  };

  const logout = () => {
    if (
      !window.confirm(
        'Sign out of the Super Admin dashboard?',
      )
    ) {
      return;
    }

    localStorage.removeItem(
      'phx_token',
    );

    localStorage.removeItem(
      'phx_admin_user',
    );

    router.push('/login');
  };

  const filteredUsers = useMemo(() => {
    const q =
      userSearch
        .trim()
        .toLowerCase();

    return users.filter(user => {
      const matchesRole =
        userFilter === 'all' ||
        user.role === userFilter;

      const matchesSearch =
        !q ||
        `${user.name || ''} ${
          user.email
        } ${user.role || ''}`
          .toLowerCase()
          .includes(q);

      return (
        matchesRole &&
        matchesSearch
      );
    });
  }, [
    users,
    userFilter,
    userSearch,
  ]);

  const filteredCourses = useMemo(() => {
    const q =
      courseSearch
        .trim()
        .toLowerCase();

    return courses.filter(
      course => {
        const status =
          normaliseCourseStatus(
            course,
          );

        const health =
          courseHealth(course);

        const filterOk =
          courseFilter ===
            'all' ||
          status === courseFilter ||
          health === courseFilter;

        const searchable =
          `${courseName(
            course,
          )} ${
            course.category || ''
          } ${
            course.track || ''
          } ${
            course.instructor ||
            course.instructor_name ||
            ''
          }`.toLowerCase();

        return (
          filterOk &&
          (!q ||
            searchable.includes(q))
        );
      },
    );
  }, [
    courses,
    courseFilter,
    courseSearch,
  ]);

  const recentActivity = useMemo(
    () =>
      [...activity]
        .sort(
          (a, b) =>
            new Date(
              timestamp(b) || 0,
            ).getTime() -
            new Date(
              timestamp(a) || 0,
            ).getTime(),
        )
        .slice(0, 12),
    [activity],
  );

  const recentSecurity = useMemo(
    () =>
      [...securityLogs]
        .sort(
          (a, b) =>
            new Date(
              timestamp(b) || 0,
            ).getTime() -
            new Date(
              timestamp(a) || 0,
            ).getTime(),
        )
        .slice(0, 10),
    [securityLogs],
  );

  const totalCourses =
    courses.length;

  const emptyCourses =
    courses.filter(
      course =>
        courseLessonCount(
          course,
        ) === 0,
    ).length;

  const incompleteCourses =
    courses.filter(course => {
      const lessons =
        courseLessonCount(
          course,
        );

      const videos =
        courseVideoCount(
          course,
        );

      return (
        lessons > 0 &&
        videos < lessons
      );
    }).length;

  const publishedCourses =
    courses.filter(
      course =>
        normaliseCourseStatus(
          course,
        ) === 'published',
    ).length;

  const totalLessons =
    courses.reduce(
      (total, course) =>
        total +
        courseLessonCount(
          course,
        ),
      0,
    );

  const totalVideos =
    courses.reduce(
      (total, course) =>
        total +
        courseVideoCount(
          course,
        ),
      0,
    );

  const navigate = (
    tab: Tab,
  ) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#06111d] text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar
          activeTab={activeTab}
          navigate={navigate}
          open={mobileNavOpen}
          close={() =>
            setMobileNavOpen(false)
          }
          adminName={adminName}
          onLogout={logout}
        />

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#06111d]/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setMobileNavOpen(true)
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-2 lg:hidden"
                  aria-label="Open menu"
                >
                  ☰
                </button>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                    Super Admin
                  </p>

                  <h1 className="text-lg font-semibold">
                    Learnora Me Control Centre
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    void fetchAll()
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06]"
                >
                  {liveLoading
                    ? 'Refreshing…'
                    : 'Refresh'}
                </button>

                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold">
                    {adminName}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {adminEmail ||
                      'Super Administrator'}
                  </p>
                </div>

                <div className="grid h-9 w-9 place-items-center rounded-full border border-amber-400/20 bg-amber-400/10 text-sm font-bold text-amber-300">
                  SA
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
            {error && (
              <Notice
                type="error"
                message={error}
                onClose={() =>
                  setError('')
                }
              />
            )}

            {success && (
              <Notice
                type="success"
                message={success}
                onClose={() =>
                  setSuccess('')
                }
              />
            )}

            {loading ? (
              <Loading />
            ) : (
              <>
                {activeTab ===
                  'overview' && (
                  <Overview
                    stats={stats}
                    users={users}
                    admins={admins}
                    courses={courses}
                    totalCourses={
                      totalCourses
                    }
                    emptyCourses={
                      emptyCourses
                    }
                    incompleteCourses={
                      incompleteCourses
                    }
                    publishedCourses={
                      publishedCourses
                    }
                    totalLessons={
                      totalLessons
                    }
                    totalVideos={
                      totalVideos
                    }
                    activity={
                      recentActivity
                    }
                    security={
                      recentSecurity
                    }
                    onNavigate={
                      navigate
                    }
                  />
                )}

                {activeTab ===
                  'analytics' && (
                  <Analytics
                    stats={stats}
                    traffic={
                      traffic
                    }
                    users={users}
                    courses={courses}
                  />
                )}

                {activeTab ===
                  'activity' && (
                  <ActivityPanel
                    activity={activity}
                    security={
                      securityLogs
                    }
                  />
                )}

                {activeTab ===
                  'courses' && (
                  <CoursesPanel
                    courses={
                      filteredCourses
                    }
                    allCourses={
                      courses
                    }
                    search={
                      courseSearch
                    }
                    setSearch={
                      setCourseSearch
                    }
                    filter={
                      courseFilter
                    }
                    setFilter={
                      setCourseFilter
                    }
                    loading={
                      courseLoading
                    }
                    error={
                      coursesError
                    }
                    onCreate={() => {
                      setSelectedCourse(
                        null,
                      );

                      setCourseForm(
                        EMPTY_COURSE,
                      );

                      setShowCourse(
                        true,
                      );
                    }}
                    onOpen={
                      openCourse
                    }
                    onEdit={course => {
                      setSelectedCourse(
                        course,
                      );

                      setCourseForm({
                        title:
                          courseName(
                            course,
                          ),
                        description:
                          course.description ||
                          '',
                        category:
                          course.category ||
                          '',
                        track:
                          course.track ||
                          '',
                        level:
                          course.level ||
                          'Beginner',
                        instructor:
                          course.instructor ||
                          course.instructor_name ||
                          '',
                        status:
                          normaliseCourseStatus(
                            course,
                          ),
                      });

                      setShowCourse(
                        true,
                      );
                    }}
                    onDelete={
                      deleteCourse
                    }
                  />
                )}

                {activeTab ===
                  'content' && (
                  <ContentAudit
                    courses={courses}
                    onCourses={() =>
                      navigate(
                        'courses',
                      )
                    }
                    onOpen={
                      openCourse
                    }
                  />
                )}

                {activeTab ===
                  'media' && (
                  <MediaPanel
                    media={media}
                    courses={courses}
                    error={
                      mediaError
                    }
                  />
                )}

                {activeTab ===
                  'users' && (
                  <UsersPanel
                    users={
                      filteredUsers
                    }
                    search={
                      userSearch
                    }
                    setSearch={
                      setUserSearch
                    }
                    filter={
                      userFilter
                    }
                    setFilter={
                      setUserFilter
                    }
                    onCreate={() => {
                      setLearnerForm(
                        EMPTY_LEARNER,
                      );

                      setShowCreateLearner(
                        true,
                      );
                    }}
                    onEdit={user => {
                      setSelectedLearner(
                        user,
                      );

                      setShowLearner(
                        true,
                      );
                    }}
                  />
                )}

                {activeTab ===
                  'normal' && (
                  <UsersPanel
                    users={users.filter(
                      user =>
                        user.role ===
                        'normal',
                    )}
                    search={
                      userSearch
                    }
                    setSearch={
                      setUserSearch
                    }
                    filter="normal"
                    setFilter={
                      setUserFilter
                    }
                    onCreate={() => {
                      setLearnerForm({
                        ...EMPTY_LEARNER,
                        role: 'normal',
                      });

                      setShowCreateLearner(
                        true,
                      );
                    }}
                    onEdit={user => {
                      setSelectedLearner(
                        user,
                      );

                      setShowLearner(
                        true,
                      );
                    }}
                  />
                )}

                {activeTab ===
                  'witstart' && (
                  <UsersPanel
                    users={users.filter(
                      user =>
                        user.role ===
                        'witstart',
                    )}
                    search={
                      userSearch
                    }
                    setSearch={
                      setUserSearch
                    }
                    filter="witstart"
                    setFilter={
                      setUserFilter
                    }
                    onCreate={() => {
                      setLearnerForm({
                        ...EMPTY_LEARNER,
                        role: 'witstart',
                      });

                      setShowCreateLearner(
                        true,
                      );
                    }}
                    onEdit={user => {
                      setSelectedLearner(
                        user,
                      );

                      setShowLearner(
                        true,
                      );
                    }}
                  />
                )}

                {activeTab ===
                  'admins' && (
                  <AdminsPanel
                    admins={admins}
                    search={
                      adminSearch
                    }
                    setSearch={
                      setAdminSearch
                    }
                    currentEmail={
                      adminEmail
                    }
                    onCreate={() => {
                      setAdminForm(
                        EMPTY_ADMIN,
                      );

                      setShowCreateAdmin(
                        true,
                      );
                    }}
                    onEdit={admin => {
                      setSelectedAdmin(
                        admin,
                      );

                      setShowAdmin(
                        true,
                      );
                    }}
                    onDelete={
                      deleteAdmin
                    }
                  />
                )}

                {activeTab ===
                  'billing' && (
                  <BillingPanel
                    users={users}
                    stats={stats}
                  />
                )}

                {activeTab ===
                  'security' && (
                  <SecurityPanel
                    summary={
                      securitySummary
                    }
                    logs={
                      securityLogs
                    }
                    activity={
                      activity
                    }
                  />
                )}

                {activeTab ===
                  'settings' && (
                  <SettingsPanel />
                )}
              </>
            )}

            <footer className="border-t border-white/[0.06] pt-4 text-[11px] text-slate-600">
              {lastUpdated
                ? `Last refreshed ${lastUpdated.toLocaleTimeString()}`
                : 'Live platform administration'}{' '}
              · Learnora Me
            </footer>
          </div>
        </main>
      </div>

      {showCourse && (
        <Modal
          title={
            selectedCourse
              ? 'Edit course'
              : 'Create course'
          }
          onClose={() =>
            setShowCourse(false)
          }
        >
          <form
            onSubmit={saveCourse}
            className="space-y-4"
          >
            <Field
              label="Course title"
              value={
                courseForm.title
              }
              onChange={value =>
                setCourseForm(
                  current => ({
                    ...current,
                    title: value,
                  }),
                )
              }
              required
            />

            <Textarea
              label="Description"
              value={
                courseForm.description
              }
              onChange={value =>
                setCourseForm(
                  current => ({
                    ...current,
                    description:
                      value,
                  }),
                )
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Category"
                value={
                  courseForm.category
                }
                onChange={value =>
                  setCourseForm(
                    current => ({
                      ...current,
                      category: value,
                    }),
                  )
                }
              />

              <Field
                label="Track"
                value={
                  courseForm.track
                }
                onChange={value =>
                  setCourseForm(
                    current => ({
                      ...current,
                      track: value,
                    }),
                  )
                }
              />

              <Select
                label="Level"
                value={
                  courseForm.level
                }
                onChange={value =>
                  setCourseForm(
                    current => ({
                      ...current,
                      level: value,
                    }),
                  )
                }
                options={[
                  'Beginner',
                  'Intermediate',
                  'Advanced',
                ]}
              />

              <Field
                label="Instructor"
                value={
                  courseForm.instructor
                }
                onChange={value =>
                  setCourseForm(
                    current => ({
                      ...current,
                      instructor: value,
                    }),
                  )
                }
              />

              <Select
                label="Status"
                value={
                  courseForm.status
                }
                onChange={value =>
                  setCourseForm(
                    current => ({
                      ...current,
                      status: value,
                    }),
                  )
                }
                options={[
                  'draft',
                  'published',
                  'archived',
                ]}
              />
            </div>

            <ModalButtons
              submit={
                selectedCourse
                  ? 'Save changes'
                  : 'Create course'
              }
              onCancel={() =>
                setShowCourse(false)
              }
            />
          </form>
        </Modal>
      )}

      {showLesson && (
        <Modal
          title={
            lessonForm.id
              ? 'Edit lesson'
              : 'Add lesson'
          }
          onClose={() =>
            setShowLesson(false)
          }
        >
          <form
            onSubmit={saveLesson}
            className="space-y-4"
          >
            <Field
              label="Lesson title"
              value={
                lessonForm.title
              }
              onChange={value =>
                setLessonForm(
                  current => ({
                    ...current,
                    title: value,
                  }),
                )
              }
              required
            />

            <Textarea
              label="Description"
              value={
                lessonForm.description
              }
              onChange={value =>
                setLessonForm(
                  current => ({
                    ...current,
                    description:
                      value,
                  }),
                )
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Order"
                type="number"
                value={
                  lessonForm.order
                }
                onChange={value =>
                  setLessonForm(
                    current => ({
                      ...current,
                      order: value,
                    }),
                  )
                }
              />

              <Field
                label="Duration (minutes)"
                type="number"
                value={
                  lessonForm.duration_minutes
                }
                onChange={value =>
                  setLessonForm(
                    current => ({
                      ...current,
                      duration_minutes:
                        value,
                    }),
                  )
                }
              />
            </div>

            <Field
              label="Video URL (optional)"
              value={
                lessonForm.video_url
              }
              onChange={value =>
                setLessonForm(
                  current => ({
                    ...current,
                    video_url: value,
                  }),
                )
              }
              placeholder="https://..."
            />

            <Textarea
              label="Lesson notes"
              value={
                lessonForm.notes
              }
              onChange={value =>
                setLessonForm(
                  current => ({
                    ...current,
                    notes: value,
                  }),
                )
              }
            />

            <Field
              label="Resource/PDF URL"
              value={
                lessonForm.resource_url
              }
              onChange={value =>
                setLessonForm(
                  current => ({
                    ...current,
                    resource_url:
                      value,
                  }),
                )
              }
              placeholder="https://..."
            />

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={
                  lessonForm.is_published
                }
                onChange={event =>
                  setLessonForm(
                    current => ({
                      ...current,
                      is_published:
                        event.target
                          .checked,
                    }),
                  )
                }
              />

              Publish lesson
            </label>

            <ModalButtons
              submit={
                lessonForm.id
                  ? 'Save lesson'
                  : 'Add lesson'
              }
              onCancel={() =>
                setShowLesson(false)
              }
            />
          </form>
        </Modal>
      )}

      {showVideo && (
        <Modal
          title="Attach video"
          onClose={() =>
            setShowVideo(false)
          }
        >
          <form
            onSubmit={saveVideo}
            className="space-y-4"
          >
            <Select
              label="Lesson"
              value={
                videoForm.lessonId
                  ? String(
                      videoForm.lessonId,
                    )
                  : ''
              }
              onChange={value =>
                setVideoForm(
                  current => ({
                    ...current,
                    lessonId:
                      value || undefined,
                  }),
                )
              }
              options={lessons.map(
                lesson =>
                  `${lesson.id}|${
                    lesson.title ||
                    'Untitled lesson'
                  }`,
              )}
            />

            <Field
              label="Video URL"
              value={
                videoForm.video_url
              }
              onChange={value =>
                setVideoForm(
                  current => ({
                    ...current,
                    video_url:
                      value,
                  }),
                )
              }
              placeholder="YouTube, Vimeo, storage/CDN URL"
              required
            />

            <Field
              label="Video title"
              value={
                videoForm.title
              }
              onChange={value =>
                setVideoForm(
                  current => ({
                    ...current,
                    title: value,
                  }),
                )
              }
            />

            <Field
              label="Duration (minutes)"
              type="number"
              value={
                videoForm.duration_minutes
              }
              onChange={value =>
                setVideoForm(
                  current => ({
                    ...current,
                    duration_minutes:
                      value,
                  }),
                )
              }
            />

            <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-3 text-xs leading-5 text-slate-400">
              This currently attaches a video
              through its URL. It does not pretend
              that a file was uploaded. Actual video
              file uploads should be connected to a
              real storage/upload endpoint such as
              your Supabase Storage layer.
            </div>

            <ModalButtons
              submit="Attach video"
              onCancel={() =>
                setShowVideo(false)
              }
            />
          </form>
        </Modal>
      )}

      {showCreateLearner && (
        <Modal
          title="Create learner"
          onClose={() =>
            setShowCreateLearner(false)
          }
        >
          <form
            onSubmit={createLearner}
            className="space-y-4"
          >
            <Field
              label="Name"
              value={
                learnerForm.name
              }
              onChange={value =>
                setLearnerForm(
                  current => ({
                    ...current,
                    name: value,
                  }),
                )
              }
              required
            />

            <Field
              label="Email"
              type="email"
              value={
                learnerForm.email
              }
              onChange={value =>
                setLearnerForm(
                  current => ({
                    ...current,
                    email: value,
                  }),
                )
              }
              required
            />

            <Field
              label="Temporary password"
              type="password"
              value={
                learnerForm.password
              }
              onChange={value =>
                setLearnerForm(
                  current => ({
                    ...current,
                    password:
                      value,
                  }),
                )
              }
              required
            />

            <Select
              label="Account"
              value={
                learnerForm.role
              }
              onChange={value =>
                setLearnerForm(
                  current => ({
                    ...current,
                    role:
                      value as LearnerRole,
                  }),
                )
              }
              options={[
                'normal',
                'witstart',
              ]}
            />

            <ModalButtons
              submit="Create learner"
              onCancel={() =>
                setShowCreateLearner(
                  false,
                )
              }
            />
          </form>
        </Modal>
      )}

      {showCreateAdmin && (
        <Modal
          title="Create administrator"
          onClose={() =>
            setShowCreateAdmin(false)
          }
        >
          <form
            onSubmit={createAdmin}
            className="space-y-4"
          >
            <Field
              label="Name"
              value={
                adminForm.name
              }
              onChange={value =>
                setAdminForm(
                  current => ({
                    ...current,
                    name: value,
                  }),
                )
              }
              required
            />

            <Field
              label="Email"
              type="email"
              value={
                adminForm.email
              }
              onChange={value =>
                setAdminForm(
                  current => ({
                    ...current,
                    email: value,
                  }),
                )
              }
              required
            />

            <Field
              label="Temporary password"
              type="password"
              value={
                adminForm.password
              }
              onChange={value =>
                setAdminForm(
                  current => ({
                    ...current,
                    password:
                      value,
                  }),
                )
              }
              required
            />

            <Select
              label="Role"
              value={
                adminForm.role
              }
              onChange={value =>
                setAdminForm(
                  current => ({
                    ...current,
                    role:
                      value as AdminRole,
                  }),
                )
              }
              options={[
                'staff_admin',
                'witstart_admin',
                'super_admin',
              ]}
            />

            <div className="rounded-xl border border-red-400/10 bg-red-400/[0.03] p-3 text-xs leading-5 text-slate-500">
              The frontend may display the
              Super Admin option, but the backend
              must independently enforce who is
              authorised to create or assign a
              Super Admin role.
            </div>

            <ModalButtons
              submit="Create administrator"
              onCancel={() =>
                setShowCreateAdmin(
                  false,
                )
              }
            />
          </form>
        </Modal>
      )}

      {showLearner &&
        selectedLearner && (
          <Modal
            title="Learner account"
            onClose={() =>
              setShowLearner(false)
            }
          >
            <LearnerDetail
              user={
                selectedLearner
              }
              onClose={() =>
                setShowLearner(
                  false,
                )
              }
            />
          </Modal>
        )}

      {showAdmin &&
        selectedAdmin && (
          <Modal
            title="Administrator account"
            onClose={() =>
              setShowAdmin(false)
            }
          >
            <AdminDetail
              admin={
                selectedAdmin
              }
              currentEmail={
                adminEmail
              }
              onClose={() =>
                setShowAdmin(false)
              }
            />
          </Modal>
        )}

      {selectedCourse &&
        !showCourse && (
          <CourseDrawer
            course={
              selectedCourse
            }
            lessons={lessons}
            media={
              courseMedia
            }
            loading={
              courseDetailLoading
            }
            error={
              courseDetailError
            }
            onClose={() =>
              setSelectedCourse(null)
            }
            onAddLesson={
              openCreateLesson
            }
            onEditLesson={
              openEditLesson
            }
            onAddVideo={() =>
              openVideoModal()
            }
            onAddVideoToLesson={
              lessonId =>
                openVideoModal(
                  lessonId,
                )
            }
            onDeleteLesson={
              deleteLesson
            }
          />
        )}
    </div>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function Sidebar({
  activeTab,
  navigate,
  open,
  close,
  adminName,
  onLogout,
}: {
  activeTab: Tab;
  navigate: (tab: Tab) => void;
  open: boolean;
  close: () => void;
  adminName: string;
  onLogout: () => void;
}) {
  const groups: {
    label: string;
    items: {
      id: Tab;
      label: string;
      icon: string;
    }[];
  }[] = [
    {
      label: 'Command Centre',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: '⌂',
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: '◫',
        },
        {
          id: 'activity',
          label: 'Activity & Audit',
          icon: '↯',
        },
      ],
    },

    {
      label: 'Learning',
      items: [
        {
          id: 'courses',
          label: 'Courses',
          icon: '▣',
        },
        {
          id: 'content',
          label: 'Content Audit',
          icon: '✓',
        },
        {
          id: 'media',
          label: 'Media Library',
          icon: '▶',
        },
      ],
    },

    {
      label: 'Users',
      items: [
        {
          id: 'users',
          label: 'All Learners',
          icon: '♙',
        },
        {
          id: 'normal',
          label: 'Learnora Learners',
          icon: 'L',
        },
        {
          id: 'witstart',
          label: 'WitStart Learners',
          icon: 'W',
        },
        {
          id: 'admins',
          label: 'Administrators',
          icon: '◆',
        },
      ],
    },

    {
      label: 'Commerce',
      items: [
        {
          id: 'billing',
          label: 'Subscriptions & Billing',
          icon: '₦',
        },
      ],
    },

    {
      label: 'Security',
      items: [
        {
          id: 'security',
          label: 'Security Centre',
          icon: '⌁',
        },
      ],
    },

    {
      label: 'Platform',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: '⚙',
        },
      ],
    },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 lg:hidden ${
          open
            ? 'block'
            : 'hidden'
        }`}
        onClick={close}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-screen w-72 flex-col
          border-r border-white/[0.07]
          bg-[#071421]
          px-4 py-5
          transition-transform
          lg:sticky lg:top-0
          lg:z-20
          lg:translate-x-0
          ${
            open
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        <div className="mb-5 flex shrink-0 items-center justify-between px-2">
          <div>
            <p className="text-xl font-black tracking-tight">
              Learnora
              <span className="text-amber-400">
                .
              </span>
            </p>

            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">
              Super Admin
            </p>
          </div>

          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.05] hover:text-slate-200 lg:hidden"
            onClick={close}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* IMPORTANT:
            This is the part that fixes Commerce/Billing
            being below the visible sidebar area. */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-4">
          <div className="space-y-5">
            {groups.map(group => (
              <div
                key={
                  group.label
                }
              >
                <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {group.items.map(
                    item => {
                      const active =
                        activeTab ===
                        item.id;

                      return (
                        <button
                          key={
                            item.id
                          }
                          onClick={() =>
                            navigate(
                              item.id,
                            )
                          }
                          className={`
                            flex w-full
                            items-center gap-3
                            rounded-xl
                            px-3 py-2.5
                            text-left text-sm
                            transition
                            ${
                              active
                                ? 'bg-amber-400/10 font-semibold text-amber-300 ring-1 ring-amber-400/10'
                                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                            }
                          `}
                        >
                          <span
                            className={`
                              grid h-7 w-7 shrink-0
                              place-items-center
                              rounded-lg
                              text-xs
                              ${
                                active
                                  ? 'bg-amber-400/10 text-amber-300'
                                  : 'bg-white/[0.03] text-slate-500'
                              }
                            `}
                          >
                            {
                              item.icon
                            }
                          </span>

                          <span className="truncate">
                            {
                              item.label
                            }
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Fixed footer area */}
        <div className="mt-3 shrink-0 border-t border-white/[0.06] pt-3">
          <div className="mb-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
            <p className="truncate text-[11px] font-semibold text-slate-300">
              {adminName}
            </p>

            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Super Admin access
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-500 transition hover:bg-red-400/[0.05] hover:text-red-300"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.03] text-xs">
              ↪
            </span>

            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */

function Overview({
  stats,
  users,
  admins,
  courses,
  totalCourses,
  emptyCourses,
  incompleteCourses,
  publishedCourses,
  totalLessons,
  totalVideos,
  activity,
  security,
  onNavigate,
}: {
  stats: Stats | null;
  users: UserRecord[];
  admins: AdminRecord[];
  courses: Course[];
  totalCourses: number;
  emptyCourses: number;
  incompleteCourses: number;
  publishedCourses: number;
  totalLessons: number;
  totalVideos: number;
  activity: ActivityRecord[];
  security: SecurityLog[];
  onNavigate: (tab: Tab) => void;
}) {
  const activeUsers =
    users.filter(
      user =>
        user.is_active !==
        false,
    ).length;

  const paidUsers =
    users.filter(
      user =>
        user.is_paid === true,
    ).length;

  const critical =
    security.filter(item =>
      /critical/i.test(
        String(
          item.action ||
            item.event ||
            '',
        ),
      ),
    ).length;

  const topCourses = [
    ...courses,
  ]
    .sort(
      (a, b) =>
        courseEnrollmentCount(
          b,
        ) -
        courseEnrollmentCount(
          a,
        ),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Command Centre"
        title="Platform overview"
        description="The high-level state of learners, learning content, administrators, commerce and security."
        action={
          <button
            onClick={() =>
              onNavigate(
                'courses',
              )
            }
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            Manage courses
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total learners"
          value={
            valueOf(
              stats,
              [
                'total_users',
                'total_learners',
              ],
              users.length,
            ) || users.length
          }
          detail={`${activeUsers} active accounts`}
          icon="♙"
        />

        <MetricCard
          label="Courses"
          value={
            totalCourses
          }
          detail={`${publishedCourses} published`}
          icon="▣"
        />

        <MetricCard
          label="Lessons / videos"
          value={`${totalLessons} / ${totalVideos}`}
          detail={
            incompleteCourses
              ? `${incompleteCourses} courses need videos`
              : 'Content coverage looks healthy'
          }
          icon="▶"
        />

        <MetricCard
          label="Paid learners"
          value={
            paidUsers
          }
          detail="Current paid-state records"
          icon="₦"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
        <Panel
          title="Content health"
          description="What needs attention before you publish or promote courses."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <HealthCard
              label="Empty courses"
              value={emptyCourses}
              tone="red"
              action={() =>
                onNavigate(
                  'content',
                )
              }
            />

            <HealthCard
              label="Missing videos"
              value={
                incompleteCourses
              }
              tone="amber"
              action={() =>
                onNavigate(
                  'content',
                )
              }
            />

            <HealthCard
              label="Published"
              value={
                publishedCourses
              }
              tone="emerald"
              action={() =>
                onNavigate(
                  'courses',
                )
              }
            />
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-sm leading-6 text-slate-400">
            A course is treated as{' '}
            <span className="text-red-300">
              empty
            </span>{' '}
            when it has no lessons. A
            course is treated as{' '}
            <span className="text-amber-300">
              incomplete
            </span>{' '}
            when it has lessons but fewer
            videos than lessons.
          </div>
        </Panel>

        <Panel
          title="Action required"
          description="Direct routes to areas that normally require Super Admin attention."
        >
          <div className="space-y-2">
            <ActionRow
              label="Review empty courses"
              value={
                emptyCourses
              }
              onClick={() =>
                onNavigate(
                  'content',
                )
              }
            />

            <ActionRow
              label="Review incomplete courses"
              value={
                incompleteCourses
              }
              onClick={() =>
                onNavigate(
                  'content',
                )
              }
            />

            <ActionRow
              label="Review security events"
              value={critical}
              onClick={() =>
                onNavigate(
                  'security',
                )
              }
            />

            <ActionRow
              label="Manage administrators"
              value={
                admins.length
              }
              onClick={() =>
                onNavigate(
                  'admins',
                )
              }
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Most enrolled courses"
          description="Based on enrolment counts returned by the course API."
        >
          {topCourses.length ? (
            <div className="space-y-3">
              {topCourses.map(
                (course, index) => (
                  <div
                    key={String(
                      course.id ??
                        index,
                    )}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {courseName(
                          course,
                        )}
                      </p>

                      <p className="text-xs text-slate-600">
                        {course.category ||
                          course.track ||
                          'Uncategorised'}
                      </p>
                    </div>

                    <span className="text-sm font-bold text-amber-300">
                      {courseEnrollmentCount(
                        course,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState message="No course enrolment data is available yet." />
          )}
        </Panel>

        <Panel
          title="Recent platform activity"
          description="Latest activity returned by the existing audit/activity endpoint."
        >
          {activity.length ? (
            <div className="space-y-3">
              {activity
                .slice(0, 6)
                .map(
                  (
                    item,
                    index,
                  ) => (
                    <ActivityRow
                      key={index}
                      item={item}
                    />
                  ),
                )}
            </div>
          ) : (
            <EmptyState message="No recent activity." />
          )}
        </Panel>
      </div>

      {stats && (
        <Panel
          title="Backend overview data"
          description="Raw statistics returned by the existing backend. This is useful until the dashboard metrics are fully normalised."
        >
          <pre className="max-h-72 overflow-auto rounded-xl bg-black/20 p-4 text-xs leading-5 text-slate-500">
            {JSON.stringify(
              stats,
              null,
              2,
            )}
          </pre>
        </Panel>
      )}
    </div>
  );
}

/* =========================================================
   ANALYTICS
   ========================================================= */

function Analytics({
  stats,
  traffic,
  users,
  courses,
}: {
  stats: Stats | null;
  traffic: Traffic | null;
  users: UserRecord[];
  courses: Course[];
}) {
  const loginEvents =
    valueOf(
      traffic,
      [
        'login_events',
        'logins',
      ],
    );

  const trafficEvents =
    valueOf(
      traffic,
      [
        'total_events',
        'events',
        'total_traffic_events',
      ],
    );

  const unique =
    valueOf(
      traffic,
      [
        'unique_users',
        'traffic_unique_users',
      ],
    );

  const coursesWithCompletion =
    courses.filter(
      course =>
        course.completion_rate !=
        null &&
        Number.isFinite(
          Number(
            course.completion_rate,
          ),
        ),
    );

  const completion =
    coursesWithCompletion.length
      ? coursesWithCompletion.reduce(
          (total, course) =>
            total +
            Number(
              course.completion_rate ||
                0,
            ),
          0,
        ) /
        coursesWithCompletion.length
      : 0;

  const published =
    courses.filter(
      course =>
        normaliseCourseStatus(
          course,
        ) === 'published',
    ).length;

  const draft =
    courses.filter(
      course =>
        normaliseCourseStatus(
          course,
        ) === 'draft',
    ).length;

  const empty =
    courses.filter(
      course =>
        courseLessonCount(
          course,
        ) === 0,
    ).length;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Analytics"
        title="Platform analytics"
        description="Operational metrics available from your current backend, with room for richer course, learner and revenue analytics."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Traffic events"
          value={trafficEvents}
          detail="Returned by /traffic"
          icon="↗"
        />

        <MetricCard
          label="Login events"
          value={loginEvents}
          detail="Returned by traffic data"
          icon="→"
        />

        <MetricCard
          label="Unique users"
          value={unique}
          detail="Traffic-based where available"
          icon="♙"
        />

        <MetricCard
          label="Avg completion"
          value={
            completion
              ? `${completion.toFixed(
                  1,
                )}%`
              : '—'
          }
          detail="Course completion data"
          icon="✓"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="User mix">
          <div className="space-y-4">
            <Bar
              label="Learnora learners"
              value={
                users.filter(
                  user =>
                    user.role ===
                    'normal',
                ).length
              }
              max={Math.max(
                users.length,
                1,
              )}
            />

            <Bar
              label="WitStart learners"
              value={
                users.filter(
                  user =>
                    user.role ===
                    'witstart',
                ).length
              }
              max={Math.max(
                users.length,
                1,
              )}
            />

            <Bar
              label="Paid learners"
              value={
                users.filter(
                  user =>
                    user.is_paid ===
                    true,
                ).length
              }
              max={Math.max(
                users.length,
                1,
              )}
            />
          </div>
        </Panel>

        <Panel title="Course publishing pipeline">
          <div className="space-y-4">
            <Bar
              label="Published"
              value={published}
              max={Math.max(
                courses.length,
                1,
              )}
            />

            <Bar
              label="Draft"
              value={draft}
              max={Math.max(
                courses.length,
                1,
              )}
            />

            <Bar
              label="Empty"
              value={empty}
              max={Math.max(
                courses.length,
                1,
              )}
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="Raw backend metrics"
        description="Useful while the analytics API is still evolving."
      >
        <pre className="max-h-96 overflow-auto rounded-xl bg-black/20 p-4 text-xs leading-5 text-slate-400">
          {JSON.stringify(
            {
              stats,
              traffic,
            },
            null,
            2,
          )}
        </pre>
      </Panel>
    </div>
  );
}

/* =========================================================
   COURSES
   ========================================================= */

function CoursesPanel({
  courses,
  allCourses,
  search,
  setSearch,
  filter,
  setFilter,
  loading,
  error,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: {
  courses: Course[];
  allCourses: Course[];
  search: string;
  setSearch: (value: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  loading: boolean;
  error: string;
  onCreate: () => void;
  onOpen: (course: Course) => void;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Learning"
        title="Courses"
        description="See every course, including empty and incomplete courses. Open any course to manage its curriculum, lessons and videos."
        action={
          <button
            onClick={onCreate}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            + Add course
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="All courses"
          value={
            allCourses.length
          }
          detail="Every course returned"
          icon="▣"
        />

        <MetricCard
          label="Published"
          value={
            allCourses.filter(
              course =>
                normaliseCourseStatus(
                  course,
                ) === 'published',
            ).length
          }
          detail="Visible/publish state"
          icon="✓"
        />

        <MetricCard
          label="Empty"
          value={
            allCourses.filter(
              course =>
                courseLessonCount(
                  course,
                ) === 0,
            ).length
          }
          detail="No lessons"
          icon="!"
        />

        <MetricCard
          label="Needs video"
          value={
            allCourses.filter(
              course =>
                courseLessonCount(
                  course,
                ) >
                courseVideoCount(
                  course,
                ),
            ).length
          }
          detail="Lesson/video mismatch"
          icon="▶"
        />
      </div>

      {error && (
        <Notice
          type="error"
          message={`Courses could not be loaded: ${error}`}
          onClose={() => {}}
        />
      )}

      <Panel
        title="Course catalogue"
        description="This table uses real course records returned by the backend. It does not create placeholder courses."
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search course, track, instructor..."
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none"
          />

          <select
            value={filter}
            onChange={event =>
              setFilter(
                event.target.value,
              )
            }
            className="rounded-xl border border-white/10 bg-[#0b1827] px-4 py-2.5 text-sm"
          >
            <option value="all">
              All courses
            </option>
            <option value="published">
              Published
            </option>
            <option value="draft">
              Draft
            </option>
            <option value="archived">
              Archived
            </option>
            <option value="empty">
              Empty
            </option>
            <option value="missing-video">
              Missing videos
            </option>
            <option value="healthy">
              Healthy
            </option>
          </select>
        </div>

        {loading ? (
          <Loading small />
        ) : courses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3">
                    Course
                  </th>

                  <th className="px-3 py-3">
                    Track
                  </th>

                  <th className="px-3 py-3">
                    Lessons
                  </th>

                  <th className="px-3 py-3">
                    Videos
                  </th>

                  <th className="px-3 py-3">
                    Enrolments
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Health
                  </th>

                  <th className="px-3 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {courses.map(
                  (
                    course,
                    index,
                  ) => {
                    const lessons =
                      courseLessonCount(
                        course,
                      );

                    const videos =
                      courseVideoCount(
                        course,
                      );

                    const health =
                      courseHealth(
                        course,
                      );

                    return (
                      <tr
                        key={String(
                          course.id ??
                            index,
                        )}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="px-3 py-4">
                          <button
                            onClick={() =>
                              onOpen(
                                course,
                              )
                            }
                            className="text-left font-semibold hover:text-amber-300"
                          >
                            {courseName(
                              course,
                            )}
                          </button>

                          <p className="mt-1 max-w-[280px] truncate text-xs text-slate-600">
                            {course.description ||
                              'No description'}
                          </p>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-400">
                          {course.track ||
                            course.category ||
                            '—'}
                        </td>

                        <td className="px-3 py-4 text-sm">
                          {lessons}
                        </td>

                        <td className="px-3 py-4 text-sm">
                          {videos}
                        </td>

                        <td className="px-3 py-4 text-sm">
                          {courseEnrollmentCount(
                            course,
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <Badge>
                            {statusLabel(
                              normaliseCourseStatus(
                                course,
                              ),
                            )}
                          </Badge>
                        </td>

                        <td className="px-3 py-4">
                          <HealthBadge
                            value={
                              health ===
                              'empty'
                                ? 'Empty'
                                : health ===
                                    'missing-video'
                                  ? 'Needs videos'
                                  : 'Healthy'
                            }
                          />
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                onOpen(
                                  course,
                                )
                              }
                              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs"
                            >
                              Open
                            </button>

                            <button
                              onClick={() =>
                                onEdit(
                                  course,
                                )
                              }
                              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                onDelete(
                                  course,
                                )
                              }
                              className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            message={
              error
                ? 'The course endpoint failed, so the dashboard cannot determine whether courses actually exist.'
                : 'No courses were returned by /api/admin/courses.'
            }
          />
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   CONTENT AUDIT
   ========================================================= */

function ContentAudit({
  courses,
  onCourses,
  onOpen,
}: {
  courses: Course[];
  onCourses: () => void;
  onOpen: (course: Course) => void;
}) {
  const empty =
    courses.filter(
      course =>
        courseLessonCount(
          course,
        ) === 0,
    );

  const missing =
    courses.filter(course => {
      const lessons =
        courseLessonCount(
          course,
        );

      const videos =
        courseVideoCount(
          course,
        );

      return (
        lessons > 0 &&
        videos < lessons
      );
    });

  const noDescription =
    courses.filter(
      course =>
        !course.description?.trim(),
    );

  const estimatedMissingVideos =
    missing.reduce(
      (total, course) =>
        total +
        Math.max(
          0,
          courseLessonCount(
            course,
          ) -
            courseVideoCount(
              course,
            ),
        ),
      0,
    );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Learning"
        title="Content audit"
        description="A Super Admin should be able to see what is incomplete before learners encounter it."
        action={
          <button
            onClick={onCourses}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm"
          >
            Open catalogue
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Empty courses"
          value={empty.length}
          detail="No lessons"
          icon="!"
        />

        <MetricCard
          label="Lessons without videos"
          value={
            estimatedMissingVideos
          }
          detail="Estimated from course counts"
          icon="▶"
        />

        <MetricCard
          label="Missing descriptions"
          value={
            noDescription.length
          }
          detail="Course metadata"
          icon="i"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AuditList
          title="Empty courses"
          items={empty}
          empty="No empty courses found."
          onOpen={onOpen}
        />

        <AuditList
          title="Missing videos"
          items={missing}
          empty="No course-level video gaps found."
          onOpen={onOpen}
        />

        <AuditList
          title="Missing descriptions"
          items={noDescription}
          empty="All courses have descriptions."
          onOpen={onOpen}
        />
      </div>
    </div>
  );
}

function AuditList({
  title,
  items,
  empty,
  onOpen,
}: {
  title: string;
  items: Course[];
  empty: string;
  onOpen: (course: Course) => void;
}) {
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {items.length ? (
          items
            .slice(0, 12)
            .map(course => (
              <button
                key={String(
                  course.id,
                )}
                onClick={() =>
                  onOpen(
                    course,
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] p-3 text-left hover:bg-white/[0.03]"
              >
                <span className="min-w-0 truncate text-sm">
                  {courseName(
                    course,
                  )}
                </span>

                <span className="ml-3 text-xs text-amber-300">
                  Fix →
                </span>
              </button>
            ))
        ) : (
          <EmptyState
            message={empty}
          />
        )}
      </div>
    </Panel>
  );
}

/* =========================================================
   COURSE DRAWER
   ========================================================= */

function CourseDrawer({
  course,
  lessons,
  media,
  loading,
  error,
  onClose,
  onAddLesson,
  onEditLesson,
  onAddVideo,
  onAddVideoToLesson,
  onDeleteLesson,
}: {
  course: Course;
  lessons: Lesson[];
  media: Media[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onAddVideo: () => void;
  onAddVideoToLesson: (
    lessonId: number | string,
  ) => void;
  onDeleteLesson: (
    lesson: Lesson,
  ) => void;
}) {
  const videoCount =
    lessons.filter(
      lesson =>
        Boolean(
          lessonVideo(
            lesson,
          ),
        ),
    ).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/60"
      onClick={onClose}
    >
      <aside
        onClick={event =>
          event.stopPropagation()
        }
        className="h-full w-full max-w-3xl overflow-y-auto border-l border-white/10 bg-[#071421] p-5 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Course control
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {courseName(
                course,
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {course.description ||
                'No description'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/10 px-3 py-2"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <MiniStat
            label="Lessons"
            value={
              lessons.length ||
              courseLessonCount(
                course,
              )
            }
          />

          <MiniStat
            label="Videos"
            value={
              videoCount ||
              courseVideoCount(
                course,
              )
            }
          />

          <MiniStat
            label="Enrolments"
            value={courseEnrollmentCount(
              course,
            )}
          />
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          <button
            onClick={onAddLesson}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            + Add lesson
          </button>

          <button
            onClick={onAddVideo}
            disabled={!lessons.length}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add video
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/10 bg-red-400/[0.04] p-4 text-sm leading-6 text-red-200">
            {error}
          </div>
        )}

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">
              Curriculum
            </h3>

            <span className="text-xs text-slate-600">
              {loading
                ? 'Loading…'
                : `${lessons.length} lessons`}
            </span>
          </div>

          {loading ? (
            <Loading small />
          ) : lessons.length ? (
            <div className="space-y-3">
              {lessons.map(
                (
                  lesson,
                  index,
                ) => {
                  const video =
                    lessonVideo(
                      lesson,
                    );

                  return (
                    <div
                      key={String(
                        lesson.id ??
                          index,
                      )}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-xs text-slate-500">
                          {lessonPosition(
                            lesson,
                          ) ||
                            index +
                              1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {lesson.title ||
                              'Untitled lesson'}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            {lesson.duration_minutes
                              ? `${lesson.duration_minutes} min · `
                              : ''}
                            {lesson.is_published
                              ? 'Published'
                              : 'Draft'}
                          </p>

                          {lesson.description && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {lesson.description}
                            </p>
                          )}

                          {video ? (
                            <a
                              href={
                                video
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 block truncate text-xs text-amber-300 hover:underline"
                            >
                              Video attached:{' '}
                              {video}
                            </a>
                          ) : (
                            <p className="mt-2 text-xs text-red-300">
                              No video attached
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            onClick={() =>
                              onEditLesson(
                                lesson,
                              )
                            }
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              if (
                                lesson.id
                              ) {
                                onAddVideoToLesson(
                                  lesson.id,
                                );
                              }
                            }}
                            className="rounded-lg border border-amber-400/10 px-2.5 py-1.5 text-xs text-amber-300"
                          >
                            {video
                              ? 'Replace video'
                              : 'Add video'}
                          </button>

                          <button
                            onClick={() =>
                              onDeleteLesson(
                                lesson,
                              )
                            }
                            className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <EmptyState
              message={
                error
                  ? 'The lesson endpoint could not be loaded.'
                  : 'No lessons found. This course may genuinely be empty.'
              }
            />
          )}
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">
              Course media
            </h3>

            <span className="text-xs text-slate-600">
              {media.length} assets
            </span>
          </div>

          {media.length ? (
            <div className="space-y-2">
              {media.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={String(
                      item.id ??
                        index,
                    )}
                    className="rounded-xl border border-white/[0.06] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.title ||
                            item.name ||
                            'Media file'}
                        </p>

                        <p className="text-xs text-slate-600">
                          {item.mime_type ||
                            item.type ||
                            'unknown'}{' '}
                          ·{' '}
                          {fmtBytes(
                            item.size_bytes,
                          )}
                        </p>
                      </div>

                      {item.url ||
                        item.file_url ? (
                        <a
                          href={
                            item.url ||
                            item.file_url ||
                            '#'
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-xs text-amber-300"
                        >
                          Open →
                        </a>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState message="No media records returned for this course." />
          )}
        </div>
      </aside>
    </div>
  );
}

/* =========================================================
   MEDIA
   ========================================================= */

function MediaPanel({
  media,
  courses,
  error,
}: {
  media: Media[];
  courses: Course[];
  error: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Learning"
        title="Media Library"
        description="A central place for videos, PDFs and other course assets returned by the media API."
      />

      {error && (
        <Notice
          type="error"
          message={`Media could not be loaded: ${error}`}
          onClose={() => {}}
        />
      )}

      <Panel
        title="Media inventory"
        description="This panel reads /api/admin/media. It will not invent files when the backend does not return them."
      >
        {media.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {media.map(
              (
                item,
                index,
              ) => (
                <div
                  key={String(
                    item.id ??
                      index,
                  )}
                  className="rounded-2xl border border-white/[0.07] p-4"
                >
                  <div className="mb-3 grid h-28 place-items-center rounded-xl bg-black/20 text-3xl">
                    {String(
                      item.mime_type ||
                        item.type ||
                        '',
                    ).includes(
                      'video',
                    )
                      ? '▶'
                      : '▧'}
                  </div>

                  <p className="truncate text-sm font-semibold">
                    {item.title ||
                      item.name ||
                      'Untitled media'}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {item.mime_type ||
                      item.type ||
                      'Unknown type'}{' '}
                    ·{' '}
                    {fmtBytes(
                      item.size_bytes,
                    )}
                  </p>

                  {item.url ||
                  item.file_url ? (
                    <a
                      href={
                        item.url ||
                        item.file_url ||
                        '#'
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block text-xs text-amber-300"
                    >
                      Open asset →
                    </a>
                  ) : null}
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyState
            message={
              error
                ? 'The media endpoint failed, so the dashboard cannot determine whether media exists.'
                : courses.length
                  ? 'No media records are currently returned by the backend.'
                  : 'Create courses first.'
            }
          />
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   USERS
   ========================================================= */

function UsersPanel({
  users,
  search,
  setSearch,
  filter,
  setFilter,
  onCreate,
  onEdit,
}: {
  users: UserRecord[];
  search: string;
  setSearch: (value: string) => void;
  filter:
    | 'all'
    | 'normal'
    | 'witstart';
  setFilter: (
    value:
      | 'all'
      | 'normal'
      | 'witstart',
  ) => void;
  onCreate: () => void;
  onEdit: (user: UserRecord) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Users"
        title="Learners"
        description="Manage learner accounts. Detailed course progress and enrolments require dedicated backend learner-detail data."
        action={
          <button
            onClick={onCreate}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            + Create learner
          </button>
        }
      />

      <Panel title="Learner directory">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search name, email or role..."
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none"
          />

          <select
            value={filter}
            onChange={event =>
              setFilter(
                event.target.value as
                  | 'all'
                  | 'normal'
                  | 'witstart',
              )
            }
            className="rounded-xl border border-white/10 bg-[#0b1827] px-4 py-2.5 text-sm"
          >
            <option value="all">
              All learners
            </option>
            <option value="normal">
              Learnora
            </option>
            <option value="witstart">
              WitStart
            </option>
          </select>
        </div>

        {users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3">
                    Learner
                  </th>

                  <th className="px-3 py-3">
                    Type
                  </th>

                  <th className="px-3 py-3">
                    Subscription
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Last login
                  </th>

                  <th className="px-3 py-3">
                    Created
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (
                    user,
                    index,
                  ) => (
                    <tr
                      key={String(
                        user.id ??
                          user.email ??
                          index,
                      )}
                      className="border-b border-white/[0.04]"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold">
                          {user.name ||
                            'Unnamed learner'}
                        </p>

                        <p className="text-xs text-slate-600">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-3 py-4">
                        <Badge>
                          {roleLabel(
                            user.role,
                          )}
                        </Badge>
                      </td>

                      <td className="px-3 py-4 text-sm">
                        {user.is_paid
                          ? 'Paid'
                          : user.trial_ends_at
                            ? 'Trial'
                            : 'Free'}
                      </td>

                      <td className="px-3 py-4">
                        <HealthBadge
                          value={
                            user.is_active ===
                            false
                              ? 'Inactive'
                              : 'Active'
                          }
                        />
                      </td>

                      <td className="px-3 py-4 text-xs text-slate-500">
                        {fmtDate(
                          user.last_login_at,
                        )}
                      </td>

                      <td className="px-3 py-4 text-xs text-slate-500">
                        {fmtDate(
                          user.created_at,
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <button
                          onClick={() =>
                            onEdit(
                              user,
                            )
                          }
                          className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No learners found." />
        )}
      </Panel>
    </div>
  );
}

function LearnerDetail({
  user,
  onClose,
}: {
  user: UserRecord;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat
          label="Role"
          value={roleLabel(
            user.role,
          )}
        />

        <MiniStat
          label="Subscription"
          value={
            user.is_paid
              ? 'Paid'
              : user.trial_ends_at
                ? 'Trial'
                : 'Free'
          }
        />

        <MiniStat
          label="Status"
          value={
            user.is_active ===
            false
              ? 'Inactive'
              : 'Active'
          }
        />

        <MiniStat
          label="Last login"
          value={fmtDate(
            user.last_login_at,
          )}
        />
      </div>

      <Panel title="Account details">
        <div className="space-y-3 text-sm">
          <InfoRow
            label="Name"
            value={
              user.name || '—'
            }
          />

          <InfoRow
            label="Email"
            value={
              user.email
            }
          />

          <InfoRow
            label="Account type"
            value={
              user.account_type ||
              '—'
            }
          />

          <InfoRow
            label="Subscription status"
            value={
              user.sub_status ||
              '—'
            }
          />

          <InfoRow
            label="Subscription tier"
            value={
              user.subscription_tier ||
              '—'
            }
          />

          <InfoRow
            label="Created"
            value={fmtDate(
              user.created_at,
            )}
          />

          <InfoRow
            label="Updated"
            value={fmtDate(
              user.updated_at,
            )}
          />

          <InfoRow
            label="Trial ends"
            value={fmtDate(
              user.trial_ends_at,
            )}
          />

          <InfoRow
            label="Subscription expires"
            value={fmtDate(
              user.expires_at,
            )}
          />
        </div>
      </Panel>

      <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4 text-xs leading-5 text-slate-500">
        The current user endpoint does not
        provide enough information to truthfully
        display enrolments, individual course
        progress, lessons completed, video watch
        progress, certificates, access grants or
        detailed learner activity. Those should be
        added through a dedicated backend learner
        detail endpoint rather than being fabricated
        here.
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm"
      >
        Close
      </button>
    </div>
  );
}

/* =========================================================
   ADMINS
   ========================================================= */

function AdminsPanel({
  admins,
  search,
  setSearch,
  currentEmail,
  onCreate,
  onEdit,
  onDelete,
}: {
  admins: AdminRecord[];
  search: string;
  setSearch: (value: string) => void;
  currentEmail: string;
  onCreate: () => void;
  onEdit: (admin: AdminRecord) => void;
  onDelete: (admin: AdminRecord) => void;
}) {
  const filtered =
    admins.filter(
      admin =>
        !search ||
        `${admin.name || ''} ${
          admin.email
        } ${admin.role || ''}`
          .toLowerCase()
          .includes(
            search.toLowerCase(),
          ),
    );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Access control"
        title="Administrators"
        description="Manage Super Admin, Staff Admin and WitStart Admin accounts."
        action={
          <button
            onClick={onCreate}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950"
          >
            + Create administrator
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Admins"
          value={admins.length}
          detail="All administrator records"
          icon="◆"
        />

        <MetricCard
          label="Active"
          value={
            admins.filter(
              admin =>
                admin.is_active !==
                false,
            ).length
          }
          detail="Enabled accounts"
          icon="✓"
        />

        <MetricCard
          label="WitStart admins"
          value={
            admins.filter(
              admin =>
                admin.role ===
                'witstart_admin',
            ).length
          }
          detail="Academy administration"
          icon="W"
        />
      </div>

      <Panel title="Administrator directory">
        <input
          value={search}
          onChange={event =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search administrators..."
          className="mb-5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none"
        />

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3">
                    Administrator
                  </th>

                  <th className="px-3 py-3">
                    Role
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Last login
                  </th>

                  <th className="px-3 py-3">
                    Created
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (
                    admin,
                    index,
                  ) => {
                    const isCurrent =
                      admin.email.toLowerCase() ===
                      currentEmail.toLowerCase();

                    return (
                      <tr
                        key={String(
                          admin.id ??
                            admin.email ??
                            index,
                        )}
                        className="border-b border-white/[0.04]"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold">
                            {admin.name ||
                              'Unnamed admin'}
                          </p>

                          <p className="text-xs text-slate-600">
                            {admin.email}
                          </p>

                          {isCurrent && (
                            <span className="mt-1 inline-block text-[10px] text-emerald-300">
                              Current account
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <Badge>
                            {roleLabel(
                              admin.role,
                            )}
                          </Badge>
                        </td>

                        <td className="px-3 py-4">
                          <HealthBadge
                            value={
                              admin.is_active ===
                              false
                                ? 'Inactive'
                                : 'Active'
                            }
                          />
                        </td>

                        <td className="px-3 py-4 text-xs text-slate-500">
                          {fmtDate(
                            admin.last_login_at,
                          )}
                        </td>

                        <td className="px-3 py-4 text-xs text-slate-500">
                          {fmtDate(
                            admin.created_at,
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                onEdit(
                                  admin,
                                )
                              }
                              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs"
                            >
                              View
                            </button>

                            {!isCurrent && (
                              <button
                                onClick={() =>
                                  onDelete(
                                    admin,
                                  )
                                }
                                className="rounded-lg border border-red-400/10 px-2.5 py-1.5 text-xs text-red-300"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No administrators found." />
        )}
      </Panel>
    </div>
  );
}

function AdminDetail({
  admin,
  currentEmail,
  onClose,
}: {
  admin: AdminRecord;
  currentEmail: string;
  onClose: () => void;
}) {
  const isCurrent =
    admin.email.toLowerCase() ===
    currentEmail.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat
          label="Role"
          value={roleLabel(
            admin.role,
          )}
        />

        <MiniStat
          label="Status"
          value={
            admin.is_active ===
            false
              ? 'Inactive'
              : 'Active'
          }
        />

        <MiniStat
          label="Created"
          value={fmtDate(
            admin.created_at,
          )}
        />

        <MiniStat
          label="Last login"
          value={fmtDate(
            admin.last_login_at,
          )}
        />
      </div>

      <Panel title="Administrator details">
        <div className="space-y-3 text-sm">
          <InfoRow
            label="Name"
            value={
              admin.name ||
              '—'
            }
          />

          <InfoRow
            label="Email"
            value={
              admin.email
            }
          />

          <InfoRow
            label="Role"
            value={roleLabel(
              admin.role,
            )}
          />

          <InfoRow
            label="Status"
            value={
              admin.is_active ===
              false
                ? 'Inactive'
                : 'Active'
            }
          />

          <InfoRow
            label="Created"
            value={fmtDate(
              admin.created_at,
            )}
          />

          <InfoRow
            label="Updated"
            value={fmtDate(
              admin.updated_at,
            )}
          />

          <InfoRow
            label="Last login"
            value={fmtDate(
              admin.last_login_at,
            )}
          />
        </div>
      </Panel>

      {isCurrent && (
        <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] p-4 text-xs leading-5 text-slate-500">
          This is the currently signed-in
          administrator account.
        </div>
      )}

      <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4 text-xs leading-5 text-slate-500">
        Role changes, suspension, password
        resets and permission management should
        only be enabled when the backend exposes
        dedicated authorised endpoints. The
        dashboard does not pretend a local UI change
        modified administrator permissions.
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm"
      >
        Close
      </button>
    </div>
  );
}

/* =========================================================
   ACTIVITY
   ========================================================= */

function ActivityPanel({
  activity,
  security,
}: {
  activity: ActivityRecord[];
  security: SecurityLog[];
}) {
  const all = [
    ...activity.map(item => ({
      ...item,
      kind: 'activity',
    })),
    ...security.map(item => ({
      ...item,
      kind: 'security',
    })),
  ].sort(
    (a, b) =>
      new Date(
        timestamp(b),
      ).getTime() -
      new Date(
        timestamp(a),
      ).getTime(),
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Audit"
        title="Activity & Audit"
        description="A single operational view of user, administrator and security events."
      />

      <Panel title="Event stream">
        <div className="space-y-2">
          {all.length ? (
            all.map(
              (
                item,
                index,
              ) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/[0.06] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          {String(
                            item.action ||
                              item.event ||
                              'Unknown event',
                          )}
                        </p>

                        <Badge>
                          {item.kind ===
                          'security'
                            ? 'Security'
                            : 'Activity'}
                        </Badge>
                      </div>

                      <p className="mt-1 text-xs text-slate-600">
                        {item.email ||
                          item.name ||
                          'System'}{' '}
                        ·{' '}
                        {roleLabel(
                          item.role,
                        )}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {fmtDate(
                        timestamp(
                          item,
                        ),
                      )}
                    </p>
                  </div>

                  {item.ip && (
                    <p className="mt-2 text-[11px] text-slate-600">
                      IP: {item.ip}
                    </p>
                  )}

                  {item.metadata ? (
                    <pre className="mt-3 overflow-auto rounded-lg bg-black/20 p-3 text-[10px] text-slate-600">
                      {JSON.stringify(
                        item.metadata,
                        null,
                        2,
                      )}
                    </pre>
                  ) : null}
                </div>
              ),
            )
          ) : (
            <EmptyState message="No activity events available." />
          )}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   BILLING
   ========================================================= */

function BillingPanel({
  users,
  stats,
}: {
  users: UserRecord[];
  stats: Stats | null;
}) {
  const paid =
    users.filter(
      user =>
        user.is_paid === true,
    );

  const trial =
    users.filter(
      user =>
        user.is_paid !== true &&
        Boolean(
          user.trial_ends_at,
        ),
    );

  const free =
    Math.max(
      0,
      users.length -
        paid.length -
        trial.length,
    );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Commerce"
        title="Subscriptions & billing"
        description="Account-level subscription state from your current user records."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Paid"
          value={paid.length}
          detail="is_paid records"
          icon="₦"
        />

        <MetricCard
          label="Trial"
          value={trial.length}
          detail="Trial end present"
          icon="◇"
        />

        <MetricCard
          label="Free"
          value={free}
          detail="Neither paid nor trial"
          icon="○"
        />

        <MetricCard
          label="Revenue"
          value="—"
          detail="Needs authoritative payment data"
          icon="₦"
        />
      </div>

      <Panel
        title="What is currently available"
        description="The user API exposes account subscription state."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat
            label="Paid users"
            value={
              paid.length
            }
          />

          <MiniStat
            label="Trial users"
            value={
              trial.length
            }
          />

          <MiniStat
            label="Free users"
            value={
              free
            }
          />

          <MiniStat
            label="Users"
            value={
              users.length
            }
          />
        </div>
      </Panel>

      <Panel
        title="Billing data boundary"
        description="Do not calculate financial figures from is_paid."
      >
        <p className="text-sm leading-6 text-slate-400">
          The existing admin API exposes
          learner subscription state, but that
          is not enough to safely calculate
          revenue, MRR, refunds, failed payments,
          transaction history or payment-provider
          reconciliation.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Those figures should come from an
          authoritative payments/transactions
          endpoint connected to your actual payment
          records.
        </p>

        <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-black/20 p-4 text-xs text-slate-500">
          {JSON.stringify(
            stats || {},
            null,
            2,
          )}
        </pre>
      </Panel>
    </div>
  );
}

/* =========================================================
   SECURITY
   ========================================================= */

function SecurityPanel({
  summary,
  logs,
  activity,
}: {
  summary: SecuritySummary | null;
  logs: SecurityLog[];
  activity: ActivityRecord[];
}) {
  const critical =
    logs.filter(item =>
      /critical/i.test(
        String(
          item.action ||
            item.event ||
            '',
        ),
      ),
    ).length;

  const adminEvents =
    activity.filter(item =>
      /admin|role|permission|password/i.test(
        String(
          item.action ||
            item.event ||
            '',
        ),
      ),
    ).length;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Security"
        title="Security Centre"
        description="Security events, administrator activity and backend security summaries."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Security events"
          value={logs.length}
          detail="Returned by security logs"
          icon="⌁"
        />

        <MetricCard
          label="Critical"
          value={critical}
          detail="Detected by event label"
          icon="!"
        />

        <MetricCard
          label="Admin events"
          value={adminEvents}
          detail="Activity-based estimate"
          icon="◆"
        />

        <MetricCard
          label="Summary"
          value={
            summary
              ? 'Available'
              : '—'
          }
          detail="Security summary endpoint"
          icon="✓"
        />
      </div>

      <Panel title="Recent security events">
        <div className="space-y-2">
          {logs.length ? (
            logs
              .slice(0, 25)
              .map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/[0.06] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold">
                        {String(
                          item.action ||
                            item.event ||
                            'Security event',
                        )}
                      </p>

                      <p className="text-[11px] text-slate-600">
                        {fmtDate(
                          timestamp(
                            item,
                          ),
                        )}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-slate-600">
                      {item.email ||
                        'System'}{' '}
                      ·{' '}
                      {item.ip ||
                        'IP unavailable'}
                    </p>
                  </div>
                ),
              )
          ) : (
            <EmptyState message="No security events returned." />
          )}
        </div>
      </Panel>

      <Panel title="Backend security summary">
        <pre className="max-h-96 overflow-auto rounded-xl bg-black/20 p-4 text-xs leading-5 text-slate-500">
          {JSON.stringify(
            summary || {},
            null,
            2,
          )}
        </pre>
      </Panel>
    </div>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function SettingsPanel() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Platform"
        title="Settings"
        description="Platform-level configuration should be controlled by backend-authorised Super Admin settings."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <SettingsCard
          title="Learning"
          items={[
            'Course publishing rules',
            'Lesson completion rules',
            'Video progress tracking',
            'Certificate settings',
          ]}
        />

        <SettingsCard
          title="Accounts"
          items={[
            'Registration',
            'Email verification',
            'Password policy',
            'Account suspension',
          ]}
        />

        <SettingsCard
          title="Commerce"
          items={[
            'Plans',
            'Trial period',
            'Access grants',
            'Refund rules',
          ]}
        />

        <SettingsCard
          title="Security"
          items={[
            'Admin sessions',
            'Rate limits',
            'Login protection',
            'Audit retention',
          ]}
        />
      </div>

      <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-5 text-sm leading-6 text-slate-400">
        These controls are intentionally
        informational until the backend exposes
        explicit settings endpoints. A Super Admin
        interface must never make a local UI toggle
        look like it changed the platform when it
        did not.
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item}
            className="flex items-center justify-between rounded-xl border border-white/[0.05] p-3"
          >
            <span className="text-sm text-slate-300">
              {item}
            </span>

            <span className="text-xs text-slate-600">
              Backend setting
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* =========================================================
   GENERIC UI
   ========================================================= */

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0a1725] p-4 shadow-2xl shadow-black/10 sm:p-5">
      <div className="mb-4">
        <h3 className="font-semibold">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0a1725] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-slate-600">
          {label}
        </p>

        <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 text-amber-300">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function HealthCard({
  label,
  value,
  tone,
  action,
}: {
  label: string;
  value: number;
  tone:
    | 'red'
    | 'amber'
    | 'emerald';
  action: () => void;
}) {
  return (
    <button
      onClick={action}
      className="rounded-xl border border-white/[0.06] p-4 text-left hover:bg-white/[0.03]"
    >
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${
          tone === 'red'
            ? 'text-red-300'
            : tone === 'amber'
              ? 'text-amber-300'
              : 'text-emerald-300'
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-600">
        View details →
      </p>
    </button>
  );
}

function ActionRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-white/[0.05] px-3 py-3 text-left hover:bg-white/[0.03]"
    >
      <span className="text-sm text-slate-300">
        {label}
      </span>

      <span className="text-xs font-semibold text-amber-300">
        {value > 0
          ? value
          : 'Open'}{' '}
        →
      </span>
    </button>
  );
}

function ActivityRow({
  item,
}: {
  item: ActivityRecord;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium">
          {String(
            item.action ||
              item.event ||
              'Activity',
          )}
        </p>

        <p className="shrink-0 text-[10px] text-slate-600">
          {fmtDate(
            timestamp(item),
          )}
        </p>
      </div>

      <p className="mt-1 text-xs text-slate-600">
        {item.email ||
          item.name ||
          'System'}{' '}
        ·{' '}
        {roleLabel(
          item.role,
        )}
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = Math.min(
    100,
    Math.max(
      0,
      max
        ? (value / max) * 100
        : 0,
    ),
  );

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-400">
          {label}
        </span>

        <span className="text-slate-500">
          {value}
        </span>
      </div>

      <div className="h-2 rounded-full bg-white/[0.05]">
        <div
          className="h-2 rounded-full bg-amber-400"
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

function Badge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-slate-400">
      {children}
    </span>
  );
}

function HealthBadge({
  value,
}: {
  value: string;
}) {
  const red =
    /empty|missing|inactive/i.test(
      value,
    );

  const green =
    /healthy|active|published/i.test(
      value,
    );

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${
        red
          ? 'border-red-400/10 bg-red-400/[0.05] text-red-300'
          : green
            ? 'border-emerald-400/10 bg-emerald-400/[0.05] text-emerald-300'
            : 'border-amber-400/10 bg-amber-400/[0.05] text-amber-300'
      }`}
    >
      {value}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/[0.04] pb-2">
      <span className="text-slate-600">
        {label}
      </span>

      <span className="text-right text-slate-300">
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] px-5 py-10 text-center text-sm text-slate-600">
      {message}
    </div>
  );
}

function Loading({
  small = false,
}: {
  small?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center rounded-2xl border border-white/[0.06] bg-[#0a1725] ${
        small
          ? 'min-h-24'
          : 'min-h-[50vh]'
      }`}
    >
      <div className="text-sm text-slate-600">
        Loading Super Admin data…
      </div>
    </div>
  );
}

function Notice({
  type,
  message,
  onClose,
}: {
  type:
    | 'error'
    | 'success';
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
        type === 'error'
          ? 'border-red-400/10 bg-red-400/[0.04] text-red-200'
          : 'border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-200'
      }`}
    >
      <span>
        {message}
      </span>

      <button
        onClick={onClose}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        onChange={event =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-700 focus:border-amber-400/30"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      <textarea
        value={value}
        onChange={event =>
          onChange(
            event.target.value,
          )
        }
        rows={4}
        className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/30"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={event =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-white/10 bg-[#0b1827] px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400/30"
      >
        <option value="">
          Select…
        </option>

        {options.map(
          option => {
            const [
              valuePart,
              ...labelParts
            ] =
              option.split(
                '|',
              );

            return (
              <option
                key={option}
                value={
                  valuePart
                }
              >
                {labelParts.length
                  ? labelParts.join(
                      '|',
                    )
                  : roleLabel(
                      valuePart,
                    )}
              </option>
            );
          },
        )}
      </select>
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1725] p-5 shadow-2xl sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalButtons({
  submit,
  onCancel,
}: {
  submit: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm"
      >
        Cancel
      </button>

      <button
        type="submit"
        className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950"
      >
        {submit}
      </button>
    </div>
  );
}
