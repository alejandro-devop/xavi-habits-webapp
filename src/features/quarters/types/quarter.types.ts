export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'
export type ObjectiveStatus = 'pending' | 'in_progress' | 'completed'
export type QuarterStatus = 'planning' | 'active' | 'completed'
export type ProjectMemberRole = 'owner' | 'editor'

export interface ProjectObjective {
  id: string
  projectId: string
  title: string
  description: string | null
  status: ObjectiveStatus
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: number
  role: ProjectMemberRole
  invitedAt: string
  acceptedAt: string | null
}

export interface Project {
  id: string
  userId: number
  name: string
  description: string | null
  priority: number
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  objectives: ProjectObjective[]
  members: ProjectMember[]
}

export interface QuarterProject {
  id: string
  quarterId: string
  projectId: string
  weeklyHours: number
  createdAt: string
  updatedAt: string
  project: Project
}

export interface Quarter {
  id: string
  userId: number
  name: string
  startDate: string
  endDate: string
  status: QuarterStatus
  retrospectiveNotes: string | null
  summaryNotes: string | null
  createdAt: string
  updatedAt: string
  projects: QuarterProject[]
}

export interface SessionLog {
  id: string
  quarterId: string
  projectId: string
  userId: number
  sessionDate: string
  weekStartDate: string
  content: string
  createdAt: string
  updatedAt: string
  project?: Project
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface WeekScheduleSlot {
  id: string
  quarterId: string
  projectId: string
  userId: number
  dayOfWeek: DayOfWeek
  startTime: string | null
  hours: number
  notes: string | null
  createdAt: string
  updatedAt: string
  project?: Project
}

export interface WeekScheduleSlotAddInput {
  quarterId: string
  projectId: string
  dayOfWeek: DayOfWeek
  startTime?: string
  hours: number
  notes?: string
}

export interface WeekScheduleSlotEditInput {
  id: string
  startTime?: string | null
  hours?: number
  notes?: string | null
}

// Inputs
export interface ProjectAddInput {
  name: string
  description?: string
  priority?: number
  status?: ProjectStatus
}

export interface ProjectEditInput {
  id: string
  name?: string
  description?: string
  priority?: number
  status?: ProjectStatus
}

export interface ObjectiveAddInput {
  projectId: string
  title: string
  description?: string
  orderIndex?: number
}

export interface ObjectiveEditInput {
  id: string
  title?: string
  description?: string
  status?: ObjectiveStatus
  orderIndex?: number
}

export interface QuarterAddInput {
  name: string
  startDate: string
  endDate: string
}

export interface QuarterEditInput {
  id: string
  name?: string
  startDate?: string
  endDate?: string
  retrospectiveNotes?: string
  summaryNotes?: string
}

export interface QuarterCompleteInput {
  id: string
  retrospectiveNotes?: string
  summaryNotes?: string
}

export interface QuarterProjectAddInput {
  quarterId: string
  projectId: string
  weeklyHours: number
}

export interface QuarterProjectEditInput {
  id: string
  weeklyHours: number
}

export interface SessionLogAddInput {
  quarterId: string
  projectId: string
  sessionDate: string
  content: string
}

export interface SessionLogEditInput {
  id: string
  content?: string
}
