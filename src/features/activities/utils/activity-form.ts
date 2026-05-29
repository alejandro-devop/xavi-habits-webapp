import type { Activity, ActivityFormValues, ActivityInput } from '@/features/activities/types/activity.types'
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/features/activities/utils/activity-date'

export function emptyActivityFormValues(): ActivityFormValues {
  return {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    categoryId: null,
    scheduledDate: '',
    todoFolderIds: [],
  }
}

export function activityToFormValues(activity: Activity): ActivityFormValues {
  return {
    title: activity.title,
    description: activity.description ?? '',
    status: activity.status,
    priority: activity.priority,
    categoryId: activity.categoryId,
    scheduledDate: isoToDatetimeLocal(activity.scheduledDate),
    todoFolderIds: activity.todoFolders?.map((f) => f.id) ?? [],
  }
}

export function validateActivityForm(values: ActivityFormValues): string | null {
  if (!values.title.trim()) {
    return 'El título es obligatorio.'
  }
  if (values.title.trim().length > 255) {
    return 'El título no puede superar 255 caracteres.'
  }
  return null
}

export function formValuesToInput(values: ActivityFormValues): ActivityInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    priority: values.priority,
    categoryId: values.categoryId,
    scheduledDate: datetimeLocalToIso(values.scheduledDate),
    todoFolderIds: values.todoFolderIds,
  }
}
