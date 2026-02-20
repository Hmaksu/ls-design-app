const API_BASE = '/api';

function getToken(): string | null {
    return localStorage.getItem('ls_token');
}

function setToken(token: string): void {
    localStorage.setItem('ls_token', token);
}

function clearToken(): void {
    localStorage.removeItem('ls_token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

// ═══ Auth ═══

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

export async function register(name: string, email: string, password: string, securityQuestion: string, securityAnswer: string): Promise<{ user: AuthUser; token: string }> {
    const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, securityQuestion, securityAnswer }),
    });
    setToken(data.token);
    return data;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
}

export async function getMe(): Promise<{ user: AuthUser }> {
    return apiFetch('/auth/me');
}

export function logout(): void {
    clearToken();
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

// ═══ Learning Stations ═══

export interface StationSummary {
    id: string;
    title: string;
    code: string;
    moduleCount: number;
    level: string;
    created_at: string;
    updated_at: string;
    role: 'owner' | 'collaborator';
    owner_name?: string;
}

export async function getStations(): Promise<StationSummary[]> {
    const data = await apiFetch('/ls');
    return data.stations;
}

export async function getStation(id: string): Promise<any> {
    const data = await apiFetch(`/ls/${id}`);
    return data.station.data;
}

export async function createStation(station: any): Promise<void> {
    await apiFetch('/ls', {
        method: 'POST',
        body: JSON.stringify({ station }),
    });
}

export async function updateStation(id: string, station: any): Promise<void> {
    await apiFetch(`/ls/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ station }),
    });
}

export async function deleteStation(id: string): Promise<void> {
    await apiFetch(`/ls/${id}`, {
        method: 'DELETE',
    });
}

// ═══ Collaboration ═══

export interface Collaborator {
    id: number;
    name: string;
    email: string;
    added_at: string;
}

export async function shareStation(stationId: string, email: string): Promise<{ collaborator: Collaborator }> {
    return apiFetch(`/ls/${stationId}/share`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function getCollaborators(stationId: string): Promise<Collaborator[]> {
    const data = await apiFetch(`/ls/${stationId}/collaborators`);
    return data.collaborators;
}

export async function removeCollaborator(stationId: string, userId: number): Promise<void> {
    await apiFetch(`/ls/${stationId}/share/${userId}`, {
        method: 'DELETE',
    });
}

// ═══ Forgot Password ═══

export async function getSecurityQuestion(email: string): Promise<{ securityQuestion: string }> {
    return apiFetch('/auth/get-security-question', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function resetPassword(email: string, securityAnswer: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, securityAnswer, newPassword }),
    });
}

// ═══ Admin ═══

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    station_count: number;
}

export interface AdminStation {
    id: string;
    title: string;
    code: string;
    created_at: string;
    updated_at: string;
    owner_id: number;
    owner_name: string;
    owner_email: string;
    moduleCount: number;
    level: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
    const data = await apiFetch('/admin/users');
    return data.users;
}

export async function getAdminStations(): Promise<AdminStation[]> {
    const data = await apiFetch('/admin/stations');
    return data.stations;
}

export async function getAdminMessages(): Promise<any[]> {
    const data = await apiFetch('/admin/messages');
    return data.messages;
}

export async function getAdminStationCollaborators(stationId: string): Promise<Collaborator[]> {
    const data = await apiFetch(`/admin/stations/${stationId}/collaborators`);
    return data.collaborators;
}

export async function adminShareStation(stationId: string, email: string): Promise<{ collaborator: Collaborator }> {
    return apiFetch(`/admin/stations/${stationId}/share`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function adminRemoveCollaborator(stationId: string, userId: number): Promise<void> {
    await apiFetch(`/admin/stations/${stationId}/share/${userId}`, {
        method: 'DELETE',
    });
}
