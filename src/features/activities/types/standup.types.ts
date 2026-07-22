export type StandupDayStatus = 'open' | 'closed'
export type StandupItemStatus = 'pending' | 'in_progress' | 'completed'

export interface StandupMember {
  id: string
  userId: number
  name: string
  isActive: boolean
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface StandupDay {
  id: string
  userId: number
  date: string
  status: StandupDayStatus
  openedAt: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface StandupItem {
  id: string
  userId: number
  dayId: string
  memberId: string
  title: string
  notes: string | null
  ticketNumber: string | null
  status: StandupItemStatus
  backlogStartedOn: string
  daysInBacklog: number
  sourceItemId: string | null
  linkedTodoId: string | null
  orderIndex: number
  createdAt: string
  updatedAt: string
  member?: StandupMember | null
}

export interface StandupDayView {
  day: StandupDay | null
  items: StandupItem[]
  carryOverCandidates: StandupItem[]
}

export interface StandupSummaryMemberGroup {
  memberId: string
  memberName: string
  items: StandupItem[]
}

export interface StandupDaySummary {
  date: string
  groups: StandupSummaryMemberGroup[]
  text: string
}

export interface StandupMemberCreateInput {
  name: string
  orderIndex?: number
}

export interface StandupMemberUpdateInput {
  id: string
  name?: string
  isActive?: boolean
  orderIndex?: number
}

export interface StandupItemCreateInput {
  date: string
  memberId: string
  title: string
  notes?: string | null
  ticketNumber?: string | null
  status?: StandupItemStatus
}

export interface StandupItemUpdateInput {
  id: string
  memberId?: string
  title?: string
  notes?: string | null
  ticketNumber?: string | null
  status?: StandupItemStatus
}

export interface StandupItemFormValues {
  title: string
  notes: string
  ticketNumber: string
  memberId: string
  status: StandupItemStatus
}
