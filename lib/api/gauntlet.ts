import apiClient from './client';
import type {
    GauntletRun,
    GauntletRunCreateRequest,
    RespiteRequest,
} from '@/lib/types/gauntlet';

export const gauntletApi = {
    // Create a new Gauntlet run (stages snapshot heroes and launches Wave 1)
    createRun: (data: GauntletRunCreateRequest) =>
        apiClient.post<GauntletRun>('/gauntlet/', data),

    // Get specific run details
    getRun: (id: number) =>
        apiClient.get<GauntletRun>(`/gauntlet/${id}/`),

    // Get all runs for the user
    getAllRuns: () =>
        apiClient.get<GauntletRun[]>('/gauntlet/'),

    // Sync state from current combat session (check if wave is cleared or party wiped)
    syncWave: (id: number) =>
        apiClient.post<{
            run_status: string;
            message?: string;
            wave_cleared?: number;
            run: GauntletRun;
        }>(`/gauntlet/${id}/sync_wave/`),

    // Apply respite choice (breather, arcane_surge, supply_drop, tactical_boon)
    applyRespite: (id: number, data: RespiteRequest) =>
        apiClient.post<{
            result: {
                message: string;
                healed_hp?: number;
                restored_slots?: number;
                boon?: any;
            };
            run: GauntletRun;
        }>(`/gauntlet/${id}/respite/`, data),

    // Summon next wave
    nextWave: (id: number) =>
        apiClient.post<{
            run_status: string;
            current_wave?: number;
            combat_session_id?: number;
            message?: string;
            run: GauntletRun;
        }>(`/gauntlet/${id}/next_wave/`),

    // Claim victory upon clearing Wave 10
    claimVictory: (id: number) =>
        apiClient.post<{
            message: string;
            run: GauntletRun;
        }>(`/gauntlet/${id}/claim_victory/`),

    // Enter Endless Overtime past Wave 10
    enterEndless: (id: number) =>
        apiClient.post<{
            message: string;
            run: GauntletRun;
        }>(`/gauntlet/${id}/enter_endless/`),

    // Get top high scores
    getLeaderboard: () =>
        apiClient.get<GauntletRun[]>('/gauntlet/leaderboard/'),
};
