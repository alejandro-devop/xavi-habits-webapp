import { graphqlRequest } from '@/shared/api/graphql-client'
import type {
  Project,
  Quarter,
  QuarterProject,
  SessionLog,
  WeekScheduleSlot,
  ProjectObjective,
  ProjectAddInput,
  ProjectEditInput,
  ObjectiveAddInput,
  ObjectiveEditInput,
  QuarterAddInput,
  QuarterEditInput,
  QuarterCompleteInput,
  QuarterProjectAddInput,
  QuarterProjectEditInput,
  SessionLogAddInput,
  SessionLogEditInput,
  WeekScheduleSlotAddInput,
  WeekScheduleSlotEditInput,
} from '@/features/quarters/types/quarter.types'
import {
  PROJECTS_QUERY,
  PROJECT_QUERY,
  QUARTERS_QUERY,
  QUARTER_QUERY,
  ACTIVE_QUARTER_QUERY,
  SESSION_LOGS_QUERY,
  PROJECT_SESSION_LOGS_QUERY,
  PROJECT_ADD_MUTATION,
  PROJECT_EDIT_MUTATION,
  PROJECT_REMOVE_MUTATION,
  OBJECTIVE_ADD_MUTATION,
  OBJECTIVE_EDIT_MUTATION,
  OBJECTIVE_REMOVE_MUTATION,
  QUARTER_ADD_MUTATION,
  QUARTER_EDIT_MUTATION,
  QUARTER_ACTIVATE_MUTATION,
  QUARTER_COMPLETE_MUTATION,
  QUARTER_PROJECT_ADD_MUTATION,
  QUARTER_PROJECT_EDIT_MUTATION,
  QUARTER_PROJECT_REMOVE_MUTATION,
  SESSION_LOG_ADD_MUTATION,
  SESSION_LOG_EDIT_MUTATION,
  SESSION_LOG_REMOVE_MUTATION,
  WEEK_SCHEDULE_SLOTS_QUERY,
  WEEK_SCHEDULE_SLOT_ADD_MUTATION,
  WEEK_SCHEDULE_SLOT_EDIT_MUTATION,
  WEEK_SCHEDULE_SLOT_REMOVE_MUTATION,
} from '@/features/quarters/graphql/quarters.graphql'

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const data = await graphqlRequest<{ projects: Project[] }>(PROJECTS_QUERY)
  return data.projects
}

export async function getProject(id: string): Promise<Project> {
  const data = await graphqlRequest<{ project: Project }, { id: string }>(PROJECT_QUERY, { id })
  return data.project
}

export async function createProject(input: ProjectAddInput): Promise<Project> {
  const data = await graphqlRequest<{ projectAdd: Project }, { input: ProjectAddInput }>(PROJECT_ADD_MUTATION, { input })
  return data.projectAdd
}

export async function updateProject(input: ProjectEditInput): Promise<Project> {
  const data = await graphqlRequest<{ projectEdit: Project }, { input: ProjectEditInput }>(PROJECT_EDIT_MUTATION, { input })
  return data.projectEdit
}

export async function removeProject(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ projectRemove: boolean }, { id: string }>(PROJECT_REMOVE_MUTATION, { id })
  return data.projectRemove
}

// ─── Objectives ───────────────────────────────────────────────────────────────

export async function addObjective(input: ObjectiveAddInput): Promise<ProjectObjective> {
  const data = await graphqlRequest<{ projectObjectiveAdd: ProjectObjective }, { input: ObjectiveAddInput }>(OBJECTIVE_ADD_MUTATION, { input })
  return data.projectObjectiveAdd
}

export async function updateObjective(input: ObjectiveEditInput): Promise<ProjectObjective> {
  const data = await graphqlRequest<{ projectObjectiveEdit: ProjectObjective }, { input: ObjectiveEditInput }>(OBJECTIVE_EDIT_MUTATION, { input })
  return data.projectObjectiveEdit
}

export async function removeObjective(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ projectObjectiveRemove: boolean }, { id: string }>(OBJECTIVE_REMOVE_MUTATION, { id })
  return data.projectObjectiveRemove
}

// ─── Quarters ─────────────────────────────────────────────────────────────────

export async function getQuarters(): Promise<Quarter[]> {
  const data = await graphqlRequest<{ quarters: Quarter[] }>(QUARTERS_QUERY)
  return data.quarters
}

export async function getQuarter(id: string): Promise<Quarter> {
  const data = await graphqlRequest<{ quarter: Quarter }, { id: string }>(QUARTER_QUERY, { id })
  return data.quarter
}

export async function getActiveQuarter(): Promise<Quarter | null> {
  const data = await graphqlRequest<{ activeQuarter: Quarter | null }>(ACTIVE_QUARTER_QUERY)
  return data.activeQuarter
}

export async function createQuarter(input: QuarterAddInput): Promise<Quarter> {
  const data = await graphqlRequest<{ quarterAdd: Quarter }, { input: QuarterAddInput }>(QUARTER_ADD_MUTATION, { input })
  return data.quarterAdd
}

export async function updateQuarter(input: QuarterEditInput): Promise<Quarter> {
  const data = await graphqlRequest<{ quarterEdit: Quarter }, { input: QuarterEditInput }>(QUARTER_EDIT_MUTATION, { input })
  return data.quarterEdit
}

export async function activateQuarter(id: string): Promise<Quarter> {
  const data = await graphqlRequest<{ quarterActivate: Quarter }, { id: string }>(QUARTER_ACTIVATE_MUTATION, { id })
  return data.quarterActivate
}

export async function completeQuarter(input: QuarterCompleteInput): Promise<Quarter> {
  const data = await graphqlRequest<{ quarterComplete: Quarter }, { input: QuarterCompleteInput }>(QUARTER_COMPLETE_MUTATION, { input })
  return data.quarterComplete
}

// ─── Quarter Projects ─────────────────────────────────────────────────────────

export async function addProjectToQuarter(input: QuarterProjectAddInput): Promise<QuarterProject> {
  const data = await graphqlRequest<{ quarterProjectAdd: QuarterProject }, { input: QuarterProjectAddInput }>(QUARTER_PROJECT_ADD_MUTATION, { input })
  return data.quarterProjectAdd
}

export async function updateQuarterProject(input: QuarterProjectEditInput): Promise<QuarterProject> {
  const data = await graphqlRequest<{ quarterProjectEdit: QuarterProject }, { input: QuarterProjectEditInput }>(QUARTER_PROJECT_EDIT_MUTATION, { input })
  return data.quarterProjectEdit
}

export async function removeProjectFromQuarter(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ quarterProjectRemove: boolean }, { id: string }>(QUARTER_PROJECT_REMOVE_MUTATION, { id })
  return data.quarterProjectRemove
}

// ─── Session Logs ─────────────────────────────────────────────────────────────

export async function getSessionLogs(quarterId: string, projectId?: string): Promise<SessionLog[]> {
  const data = await graphqlRequest<{ sessionLogs: SessionLog[] }, { quarterId: string; projectId?: string }>(
    SESSION_LOGS_QUERY,
    { quarterId, projectId },
  )
  return data.sessionLogs
}

export async function getProjectSessionLogs(projectId: string): Promise<SessionLog[]> {
  const data = await graphqlRequest<{ projectSessionLogs: SessionLog[] }, { projectId: string }>(
    PROJECT_SESSION_LOGS_QUERY,
    { projectId },
  )
  return data.projectSessionLogs
}

export async function createSessionLog(input: SessionLogAddInput): Promise<SessionLog> {
  const data = await graphqlRequest<{ sessionLogAdd: SessionLog }, { input: SessionLogAddInput }>(SESSION_LOG_ADD_MUTATION, { input })
  return data.sessionLogAdd
}

export async function updateSessionLog(input: SessionLogEditInput): Promise<SessionLog> {
  const data = await graphqlRequest<{ sessionLogEdit: SessionLog }, { input: SessionLogEditInput }>(SESSION_LOG_EDIT_MUTATION, { input })
  return data.sessionLogEdit
}

export async function deleteSessionLog(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ sessionLogRemove: boolean }, { id: string }>(SESSION_LOG_REMOVE_MUTATION, { id })
  return data.sessionLogRemove
}

// ─── Week Schedule Slots ──────────────────────────────────────────────────────

export async function getWeekScheduleSlots(quarterId: string): Promise<WeekScheduleSlot[]> {
  const data = await graphqlRequest<{ weekScheduleSlots: WeekScheduleSlot[] }, { quarterId: string }>(
    WEEK_SCHEDULE_SLOTS_QUERY,
    { quarterId },
  )
  return data.weekScheduleSlots
}

export async function createWeekScheduleSlot(input: WeekScheduleSlotAddInput): Promise<WeekScheduleSlot> {
  const data = await graphqlRequest<{ weekScheduleSlotAdd: WeekScheduleSlot }, { input: WeekScheduleSlotAddInput }>(
    WEEK_SCHEDULE_SLOT_ADD_MUTATION,
    { input },
  )
  return data.weekScheduleSlotAdd
}

export async function updateWeekScheduleSlot(input: WeekScheduleSlotEditInput): Promise<WeekScheduleSlot> {
  const data = await graphqlRequest<{ weekScheduleSlotEdit: WeekScheduleSlot }, { input: WeekScheduleSlotEditInput }>(
    WEEK_SCHEDULE_SLOT_EDIT_MUTATION,
    { input },
  )
  return data.weekScheduleSlotEdit
}

export async function deleteWeekScheduleSlot(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ weekScheduleSlotRemove: boolean }, { id: string }>(
    WEEK_SCHEDULE_SLOT_REMOVE_MUTATION,
    { id },
  )
  return data.weekScheduleSlotRemove
}
