export const MY_SETTINGS_QUERY = `
  query MySettings {
    mySettings {
      userId
      hideHiddenHabits
      sleepActivityCategoryId
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
      createdAt
      updatedAt
    }
  }
`
