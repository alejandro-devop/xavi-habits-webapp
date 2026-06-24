const HABIT_FIELDS = `
  id
  userId
  name
  description
  habitType
  periodDays
  restartCount
  weeklyLifelines
  status
  hidden
  shouldAvoid
  shouldKeep
  streak
  maxStreak
  days
  dailyGoal
  timerGoal
  timesGoal
  icon
  color
  orderIndex
  startDate
  endDate
  categoryId
  measureId
  purposeId
  createdAt
  updatedAt
`

const FOLLOW_UP_FIELDS = `
  id
  date
  count
  time
  notes
  story
  isAccomplished
  isFailed
  isLifeline
  difficulty
  archived
`

const MEASURE_FIELDS = `
  id
  name
  abbreviation
  type
`

export const HABIT_MY_DAY_QUERY = `
  query HabitMyDay($date: String!) {
    habitMyDay(date: $date) {
      habit {
        ${HABIT_FIELDS}
        measure {
          ${MEASURE_FIELDS}
        }
        purpose {
          id
          name
          icon
          placement
        }
      }
      followUp {
        ${FOLLOW_UP_FIELDS}
      }
      lifelinesUsedThisWeek
      lifelinesRemaining
    }
  }
`

export const HABITS_QUERY = `
  query Habits(
    $isActive: Boolean
    $status: HabitStatus
    $categoryId: ID
    $page: Int
    $limit: Int
  ) {
    habits(
      isActive: $isActive
      status: $status
      categoryId: $categoryId
      page: $page
      limit: $limit
    ) {
      habits {
        ${HABIT_FIELDS}
      }
      page
      limit
      total
    }
  }
`

export const HABIT_QUERY = `
  query Habit($id: ID!) {
    habit(id: $id) {
      ${HABIT_FIELDS}
      category {
        id
        name
        icon
        color
      }
      measure {
        ${MEASURE_FIELDS}
      }
      purpose {
        id
        name
        icon
        placement
      }
    }
  }
`

export const HABIT_WEEK_VIEW_QUERY = `
  query HabitWeekView($habitId: ID!, $weekStart: String!) {
    habitWeekView(habitId: $habitId, weekStart: $weekStart) {
      habit {
        ${HABIT_FIELDS}
      }
      days {
        date
        status
        followUp {
          id
          date
          isAccomplished
          isFailed
          isLifeline
          difficulty
          count
          time
        }
      }
      lifelinesRemaining
    }
  }
`

export const HABIT_FOLLOW_UPS_IN_DATES_QUERY = `
  query HabitFollowUpsInDates($from: String!, $to: String!) {
    habitFollowUpsInDates(from: $from, to: $to) {
      date
      followUps {
        id
        date
        habitId
        isAccomplished
        isFailed
        isLifeline
        difficulty
        count
        time
      }
    }
  }
`

export const HABIT_CATEGORIES_QUERY = `
  query HabitCategories {
    habitCategories {
      id
      userId
      name
      description
      icon
      color
      orderIndex
    }
  }
`

export const HABIT_MEASURES_QUERY = `
  query HabitMeasures {
    habitMeasures {
      id
      userId
      name
      abbreviation
      type
      createdAt
      updatedAt
    }
  }
`

export const HABIT_ADD_MUTATION = `
  mutation HabitAdd($input: HabitInput!) {
    habitAdd(input: $input) {
      ${HABIT_FIELDS}
    }
  }
`

export const HABIT_EDIT_MUTATION = `
  mutation HabitEdit($input: HabitEditInput!) {
    habitEdit(input: $input) {
      ${HABIT_FIELDS}
    }
  }
`

export const HABIT_REMOVE_MUTATION = `
  mutation HabitRemove($id: ID!) {
    habitRemove(id: $id)
  }
`

export const HABIT_COMPLETE_MUTATION = `
  mutation HabitComplete($id: ID!) {
    habitComplete(id: $id) {
      id
      status
    }
  }
`
