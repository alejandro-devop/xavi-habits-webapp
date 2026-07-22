export const MY_SETTINGS_QUERY = `
  query MySettings {
    mySettings {
      userId
      hideHiddenHabits
      sleepActivityCategoryId
      standupTodoFolderId
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_MY_SETTINGS_MUTATION = `
  mutation UpdateMySettings($input: UpdateUserSettingsInput!) {
    updateMySettings(input: $input) {
      userId
      hideHiddenHabits
      sleepActivityCategoryId
      standupTodoFolderId
      createdAt
      updatedAt
    }
  }
`
