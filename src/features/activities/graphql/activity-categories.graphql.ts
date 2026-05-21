export const ACTIVITY_CATEGORIES_QUERY = `
  query ActivityCategories {
    activityCategories {
      id
      userId
      orderIndex
      name
      description
      icon
      color
    }
  }
`

export const ACTIVITY_CATEGORY_QUERY = `
  query ActivityCategory($id: ID!) {
    activityCategory(id: $id) {
      id
      userId
      orderIndex
      name
      description
      icon
      color
    }
  }
`

export const ACTIVITY_CATEGORY_ADD_MUTATION = `
  mutation ActivityCategoryAdd($input: ActivityCategoryInput!) {
    activityCategoryAdd(input: $input) {
      id
      userId
      orderIndex
      name
      description
      icon
      color
    }
  }
`

export const ACTIVITY_CATEGORY_EDIT_MUTATION = `
  mutation ActivityCategoryEdit($input: ActivityCategoryEditInput!) {
    activityCategoryEdit(input: $input) {
      id
      userId
      orderIndex
      name
      description
      icon
      color
    }
  }
`

export const ACTIVITY_CATEGORY_REMOVE_MUTATION = `
  mutation ActivityCategoryRemove($id: ID!) {
    activityCategoryRemove(id: $id)
  }
`
