\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE
 org_id uuid := '10000000-0000-0000-0000-000000000001';
 other_org_id uuid := '10000000-0000-0000-0000-000000000002';
 cohort_id uuid := '20000000-0000-0000-0000-000000000001';
 other_cohort_id uuid := '20000000-0000-0000-0000-000000000002';
 track_id uuid := '30000000-0000-0000-0000-000000000001';
 wrong_track_id uuid := '30000000-0000-0000-0000-000000000002';
 account_id uuid := '40000000-0000-0000-0000-000000000001';
 member_id uuid := '50000000-0000-0000-0000-000000000001';
 course_id uuid := '60000000-0000-0000-0000-000000000001';
 other_course_id uuid := '60000000-0000-0000-0000-000000000002';
 module_id uuid := '70000000-0000-0000-0000-000000000001';
 other_module_id uuid := '70000000-0000-0000-0000-000000000002';
 lesson_id uuid := '80000000-0000-0000-0000-000000000001';
 other_lesson_id uuid := '80000000-0000-0000-0000-000000000002';
 tutor_id uuid := '90000000-0000-0000-0000-000000000001';
 other_tutor_id uuid := '90000000-0000-0000-0000-000000000002';
 assignment_id uuid;
 archive_result jsonb;
BEGIN
 INSERT INTO public.organisations(id,name,is_active) VALUES
 (org_id,'CI Test Organisation',true),(other_org_id,'CI Preservation Organisation',true);
 INSERT INTO public.users(id,name,email,sub_status) VALUES
 (tutor_id,'CI Tutor','ci-tutor@example.invalid','active'),
 (other_tutor_id,'Other Org Tutor','other-tutor@example.invalid','active');
 INSERT INTO public.organisation_members(organisation_id,user_id,role,status) VALUES
 (org_id,tutor_id,'tutor','active'),(other_org_id,other_tutor_id,'tutor','active');
 INSERT INTO public.cohorts(id,organisation_id,name,status,capacity) VALUES
 (cohort_id,org_id,'Disposable CI Cohort','active',10),
 (other_cohort_id,other_org_id,'Unrelated Preservation Cohort','active',10);
 INSERT INTO public.learnora_tracks(id,organisation_id,name,slug) VALUES
 (track_id,org_id,'Data Science','data-science'),(wrong_track_id,org_id,'Web Development','web-development');
 INSERT INTO public.cohort_track_options(cohort_id,track_id,status) VALUES
 (cohort_id,track_id,'active'),(cohort_id,wrong_track_id,'active');
 INSERT INTO public.cohort_accounts(id,cohort_id,organisation_id,first_name,last_name,email,username,date_of_birth,status,password_hash,activation_token_hash,activation_expires_at)
 VALUES(account_id,cohort_id,org_id,'Test','Learner','ci-learner@example.invalid','ci-learner-001',DATE '2000-01-01','active','fake-password-hash','fake-activation-hash',now()+interval '1 hour');
 INSERT INTO public.cohort_members(id,cohort_id,user_id,cohort_account_id,track_id,status)
 VALUES(member_id,cohort_id,NULL,account_id,track_id,'active');

 BEGIN
   UPDATE public.cohort_members SET track_id=wrong_track_id WHERE id=member_id;
   RAISE EXCEPTION 'TEST_ASSERTION: track change unexpectedly succeeded';
 EXCEPTION WHEN check_violation OR raise_exception THEN
   IF SQLERRM LIKE 'TEST_ASSERTION:%' THEN RAISE; END IF;
 END;

 INSERT INTO public.learnora_courses(id,organisation_id,title,slug,status,ownership) VALUES
 (course_id,org_id,'CI Course','ci-course','published','organisation'),
 (other_course_id,other_org_id,'Other Org Course','other-course','published','organisation');
 INSERT INTO public.course_modules(id,course_id,title) VALUES
 (module_id,course_id,'CI Module'),(other_module_id,other_course_id,'Other Module');
 INSERT INTO public.learnora_lessons(id,module_id,title,order_index,status) VALUES
 (lesson_id,module_id,'CI Lesson',1,'published'),(other_lesson_id,other_module_id,'Other Lesson',1,'published');
 INSERT INTO public.cohort_track_courses(cohort_id,track_id,course_id,status) VALUES(cohort_id,track_id,course_id,'active');

 BEGIN
   INSERT INTO public.cohort_member_course_assignments(cohort_member_id,cohort_id,track_id,course_id,tutor_user_id,status)
   VALUES(member_id,cohort_id,track_id,course_id,other_tutor_id,'active');
   RAISE EXCEPTION 'TEST_ASSERTION: cross-organisation tutor unexpectedly accepted';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM LIKE 'TEST_ASSERTION:%' THEN RAISE; END IF;
   IF SQLERRM NOT LIKE 'Assigned tutor must be an active member%' THEN RAISE; END IF;
 END;

 INSERT INTO public.cohort_member_course_assignments(cohort_member_id,cohort_id,track_id,course_id,tutor_user_id,status)
 VALUES(member_id,cohort_id,track_id,course_id,tutor_id,'active') RETURNING id INTO assignment_id;

 BEGIN
   INSERT INTO public.cohort_member_course_assignments(cohort_member_id,cohort_id,track_id,course_id,tutor_user_id,status)
   VALUES(member_id,cohort_id,wrong_track_id,course_id,tutor_id,'active');
   RAISE EXCEPTION 'TEST_ASSERTION: mismatched-track course assignment unexpectedly succeeded';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM LIKE 'TEST_ASSERTION:%' THEN RAISE; END IF;
   IF SQLERRM NOT LIKE 'Course assignment must use the learner fixed track%' THEN RAISE; END IF;
 END;

 INSERT INTO public.cohort_member_lesson_assignments(course_assignment_id,lesson_id,status) VALUES(assignment_id,lesson_id,'active');
 BEGIN
   INSERT INTO public.cohort_member_lesson_assignments(course_assignment_id,lesson_id,status) VALUES(assignment_id,other_lesson_id,'active');
   RAISE EXCEPTION 'TEST_ASSERTION: lesson from another course unexpectedly assigned';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM LIKE 'TEST_ASSERTION:%' THEN RAISE; END IF;
   IF SQLERRM NOT LIKE 'Lesson must belong to the assigned course%' THEN RAISE; END IF;
 END;

 IF has_table_privilege('anon','public.learnora_cohort_archive','SELECT')
 OR has_table_privilege('authenticated','public.learnora_cohort_archive','SELECT') THEN
   RAISE EXCEPTION 'TEST_ASSERTION: browser role can read cohort archive';
 END IF;
 IF has_function_privilege('anon','public.archive_and_close_cohort(uuid,uuid,text)','EXECUTE')
 OR has_function_privilege('authenticated','public.archive_and_close_cohort(uuid,uuid,text)','EXECUTE') THEN
   RAISE EXCEPTION 'TEST_ASSERTION: browser role can execute archive function';
 END IF;
 IF NOT has_function_privilege('service_role','public.archive_and_close_cohort(uuid,uuid,text)','EXECUTE') THEN
   RAISE EXCEPTION 'TEST_ASSERTION: service_role cannot execute archive function';
 END IF;

 BEGIN
   PERFORM public.archive_and_close_cohort(cohort_id,NULL,'active cohort rejection');
   RAISE EXCEPTION 'TEST_ASSERTION: active cohort was archived';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM LIKE 'TEST_ASSERTION:%' THEN RAISE; END IF;
   IF SQLERRM NOT LIKE 'Set the cohort to completed%' THEN RAISE; END IF;
 END;

 UPDATE public.cohorts SET status='closed' WHERE id=cohort_id;
 archive_result := public.archive_and_close_cohort(cohort_id,NULL,'CI integration test');
 IF coalesce((archive_result->>'success')::boolean,false) IS NOT TRUE
 OR coalesce((archive_result->>'archived_members')::integer,0) <> 1
 OR archive_result->>'cohort_status' <> 'archived' THEN
   RAISE EXCEPTION 'TEST_ASSERTION: unexpected archive result: %',archive_result;
 END IF;
 IF EXISTS(SELECT 1 FROM public.cohort_members WHERE id=member_id) THEN
   RAISE EXCEPTION 'TEST_ASSERTION: live membership not removed after archival';
 END IF;
 IF EXISTS(SELECT 1 FROM public.cohort_accounts WHERE id=account_id AND
   (status<>'inactive' OR password_hash IS NOT NULL OR activation_token_hash IS NOT NULL
    OR activation_expires_at IS NOT NULL OR username NOT LIKE 'archived-%')) THEN
   RAISE EXCEPTION 'TEST_ASSERTION: cohort account credentials not retired';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.learnora_cohort_member_archive WHERE source_cohort_member_id=member_id) THEN
   RAISE EXCEPTION 'TEST_ASSERTION: archived learner snapshot missing';
 END IF;
 IF (SELECT status FROM public.cohorts WHERE id=other_cohort_id)<>'active'
 OR (SELECT is_active FROM public.organisations WHERE id=other_org_id) IS NOT TRUE THEN
   RAISE EXCEPTION 'TEST_ASSERTION: unrelated cohort/organisation changed';
 END IF;
END $$;
ROLLBACK;
