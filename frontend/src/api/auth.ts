export type AuthUser = {
    id: string
    email: string
}

// Read an API error and turn it into a message for UI
export async function getError(response: Response): Promise<string> {
    const data = await response.json().catch(() => null)

    // identity errors are arrays; validation errors are grouped by fields
    const errors = data?.errors
    const details = 
        errors && typeof errors === 'object'
         ? Object.values(errors).flat().join(' ')
         : ''

    return details || data?.message || `Request failed (${response.status})`
}

// Fetch the current user. HTTP 401 means there is no signed-in session
export async function getCurrentUser(): Promise<AuthUser | null> {
    const response = await fetch('/api/auth/me')

    if (response.status === 401) return null
    if (!response.ok) throw new Error(await getError(response))

    return response.json()
}

// Fetch a fresh token for the current session before sending a POST request.
export async function getCsrfToken(): Promise<string> {
    const response = await fetch('/api/auth/csrf')

    if (!response.ok) {
        throw new Error("Failed to fetch CSRF token")
    }

    const { token } = await response.json()
    
    if (typeof token !== 'string' || !token) {
        throw new Error('The server did not return a CSRF token')
    }
    return token
}

// Send an authentication request with a fresh CSRF token.
export async function authPost(
    action: 'register' | 'login' | 'logout' | 'delete-account',
    body?: { email?: string; password?: string }
): Promise<void> {
    const token = await getCsrfToken()

    const response = await fetch(`/api/auth/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    })

    if (!response.ok) {
        throw new Error(await getError(response))
    }
}