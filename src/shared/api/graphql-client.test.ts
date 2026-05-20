import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AuthRequiredError,
  GraphQLClientError,
  ValidationError,
} from '@/shared/api/api-error'
import { graphqlRequest } from '@/shared/api/graphql-client'

vi.mock('@/features/auth/services/token.service', () => ({
  getValidAccessToken: vi.fn(),
}))

import { getValidAccessToken } from '@/features/auth/services/token.service'

describe('graphqlRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(getValidAccessToken).mockResolvedValue('access-token')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('returns data when GraphQL response is successful', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { habits: [{ id: '1' }] },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(
      graphqlRequest<{ habits: Array<{ id: string }> }>(
        'query { habits { id } }',
      ),
    ).resolves.toEqual({ habits: [{ id: '1' }] })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/graphql'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      }),
    )
  })

  it('throws AuthRequiredError for authentication GraphQL errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [{ message: 'Authentication required' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(graphqlRequest('query { habits { id } }')).rejects.toBeInstanceOf(
      AuthRequiredError,
    )
  })

  it('throws ValidationError for BAD_USER_INPUT', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [
            {
              message: 'Validation failed',
              extensions: {
                code: 'BAD_USER_INPUT',
                validationErrors: [{ path: ['input', 'title'], message: 'Required' }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(graphqlRequest('mutation { activityAdd }')).rejects.toBeInstanceOf(
      ValidationError,
    )
  })

  it('throws GraphQLClientError for generic errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [{ message: 'Something went wrong' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(graphqlRequest('query { habits { id } }')).rejects.toBeInstanceOf(
      GraphQLClientError,
    )
  })

  it('throws AuthRequiredError when there is no access token', async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue(null)

    await expect(graphqlRequest('query { habits { id } }')).rejects.toBeInstanceOf(
      AuthRequiredError,
    )
    expect(fetch).not.toHaveBeenCalled()
  })
})
