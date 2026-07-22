const MEMBER_FIELDS = `
  id
  userId
  name
  isActive
  orderIndex
  createdAt
  updatedAt
`

const ITEM_FIELDS = `
  id
  userId
  dayId
  memberId
  title
  notes
  ticketNumber
  status
  backlogStartedOn
  daysInBacklog
  sourceItemId
  linkedTodoId
  orderIndex
  createdAt
  updatedAt
  member {
    id
    name
    isActive
  }
`

const DAY_FIELDS = `
  id
  userId
  date
  status
  openedAt
  closedAt
  createdAt
  updatedAt
`

export const STANDUP_MEMBERS_QUERY = `
  query StandupMembers($includeInactive: Boolean) {
    standupMembers(includeInactive: $includeInactive) {
      ${MEMBER_FIELDS}
    }
  }
`

export const STANDUP_DAY_QUERY = `
  query StandupDay($date: String!) {
    standupDay(date: $date) {
      day {
        ${DAY_FIELDS}
      }
      items {
        ${ITEM_FIELDS}
      }
      carryOverCandidates {
        ${ITEM_FIELDS}
      }
    }
  }
`

export const STANDUP_DAY_SUMMARY_QUERY = `
  query StandupDaySummary($date: String!) {
    standupDaySummary(date: $date) {
      date
      text
      groups {
        memberId
        memberName
        items {
          ${ITEM_FIELDS}
        }
      }
    }
  }
`

export const STANDUP_MEMBER_CREATE_MUTATION = `
  mutation StandupMemberCreate($input: StandupMemberCreateInput!) {
    standupMemberCreate(input: $input) {
      ${MEMBER_FIELDS}
    }
  }
`

export const STANDUP_MEMBER_UPDATE_MUTATION = `
  mutation StandupMemberUpdate($input: StandupMemberUpdateInput!) {
    standupMemberUpdate(input: $input) {
      ${MEMBER_FIELDS}
    }
  }
`

export const STANDUP_MEMBER_DELETE_MUTATION = `
  mutation StandupMemberDelete($input: StandupMemberDeleteInput!) {
    standupMemberDelete(input: $input)
  }
`

export const STANDUP_OPEN_DAY_MUTATION = `
  mutation StandupOpenDay($input: StandupDateInput!) {
    standupOpenDay(input: $input) {
      day {
        ${DAY_FIELDS}
      }
      items {
        ${ITEM_FIELDS}
      }
      carryOverCandidates {
        ${ITEM_FIELDS}
      }
    }
  }
`

export const STANDUP_CLOSE_DAY_MUTATION = `
  mutation StandupCloseDay($input: StandupDateInput!) {
    standupCloseDay(input: $input) {
      ${DAY_FIELDS}
    }
  }
`

export const STANDUP_CARRY_OVER_MUTATION = `
  mutation StandupCarryOver($input: StandupCarryOverInput!) {
    standupCarryOver(input: $input) {
      ${ITEM_FIELDS}
    }
  }
`

export const STANDUP_ITEM_CREATE_MUTATION = `
  mutation StandupItemCreate($input: StandupItemCreateInput!) {
    standupItemCreate(input: $input) {
      ${ITEM_FIELDS}
    }
  }
`

export const STANDUP_ITEM_UPDATE_MUTATION = `
  mutation StandupItemUpdate($input: StandupItemUpdateInput!) {
    standupItemUpdate(input: $input) {
      ${ITEM_FIELDS}
    }
  }
`

export const STANDUP_ITEM_DELETE_MUTATION = `
  mutation StandupItemDelete($input: StandupItemDeleteInput!) {
    standupItemDelete(input: $input)
  }
`

export const STANDUP_ITEM_CREATE_TODO_MUTATION = `
  mutation StandupItemCreateTodo($input: StandupItemCreateTodoInput!) {
    standupItemCreateTodo(input: $input) {
      id
      title
      folderId
      status
    }
  }
`
