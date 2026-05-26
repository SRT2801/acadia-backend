export enum CourseMemberRole {
  OWNER = 'OWNER',
  PROFESSOR = 'PROFESSOR',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
  MODERATOR = 'MODERATOR',
}

export const ALL_COURSE_MEMBER_ROLES = Object.values(CourseMemberRole);
