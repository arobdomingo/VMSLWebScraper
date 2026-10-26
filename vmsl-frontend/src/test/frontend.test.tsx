import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Home from '../pages/Home';
import Standings from '../pages/Standings';
import { useApi } from '../hooks/useApi';
import { apiGet } from '../api/client';
const divisions = { categories: [{ category_name: 'Open', divisions: [{ code: 'prem', name: 'Premier' }, { code: 'd1', name: 'Division 1' }] }] };
const teams = { teams: [{ team_name: 'Test FC', team_slug: 'test-fc' }] };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function Location() { return <p>{useLocation().pathname}</p>; }
function picker() { render(<MemoryRouter><Home /><Location /></MemoryRouter>); }
function mockPicker() {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => json(url.includes('/teams?') ? teams : divisions)));
}
describe('team picker', () => {
    it('loads options, enables dependent controls, and navigates to the selected team', async () => {
        mockPicker(); picker(); const user = userEvent.setup();
        expect(screen.getByLabelText('Team')).toBeDisabled();
        expect(screen.getByRole('button')).toBeDisabled();
        await screen.findByRole('option', { name: 'Open • Premier' });
        await user.selectOptions(screen.getByLabelText('Division'), 'prem');
        await screen.findByRole('option', { name: 'Test FC' });
        await user.selectOptions(screen.getByLabelText('Team'), 'test-fc');
        await user.click(screen.getByRole('button'));
        expect(screen.getByText(/\/team\/\d{4}\/prem\/test-fc/)).toBeInTheDocument();
    });
    it('clears team on division changes and both selections on season changes', async () => {
        mockPicker(); picker(); const user = userEvent.setup();
        await screen.findByRole('option', { name: 'Open • Premier' });
        await user.selectOptions(screen.getByLabelText('Division'), 'prem');
        await screen.findByRole('option', { name: 'Test FC' });
        await user.selectOptions(screen.getByLabelText('Team'), 'test-fc');
        await user.selectOptions(screen.getByLabelText('Division'), 'd1');
        expect(screen.getByLabelText('Team')).toHaveValue('');
        await user.clear(screen.getByLabelText('Season ending year'));
        expect(screen.getByLabelText('Division')).toHaveValue('');
        expect(screen.getByLabelText('Division')).toBeDisabled();
        expect(screen.getByRole('alert')).toHaveTextContent('1900 to 2100');
    });
    it.each([['empty', { categories: [] }, 'No divisions published'], ['malformed', { categories: null }, 'unexpected league data']])('handles %s responses', async (_name, body, message) => {
        vi.stubGlobal('fetch', vi.fn(async () => json(body))); picker();
        expect(await screen.findByText(new RegExp(message))).toBeInTheDocument();
        expect(screen.getByLabelText('Division')).toBeDisabled();
    });
    it('disables an empty team picker and reports the empty division', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url: string) => json(url.includes('/teams?') ? { teams: [] } : divisions)));
        picker();
        await screen.findByRole('option', { name: 'Open • Premier' });
        await userEvent.selectOptions(screen.getByLabelText('Division'), 'prem');
        expect(await screen.findByText('No teams published for this division.')).toBeInTheDocument();
        expect(screen.getByLabelText('Team')).toBeDisabled();
        expect(screen.getByRole('button')).toBeDisabled();
    });
    it('announces loading and network errors', async () => {
        let reject!: (reason: Error) => void;
        vi.stubGlobal('fetch', vi.fn(() => new Promise((_resolve, fail) => { reject = fail; })));
        picker(); expect(screen.getByRole('status')).toHaveTextContent('Loading divisions');
        await act(async () => reject(new TypeError('offline')));
        expect(screen.getByRole('alert')).toHaveTextContent('Unable to connect');
    });
});
describe('request lifecycle', () => {
    it('aborts old requests and ignores late responses even when transport ignores abort', async () => {
        const pending: { resolve: (response: Response) => void; signal: AbortSignal }[] = [];
        vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise(resolve => pending.push({ resolve, signal: options.signal }))));
        const { result, rerender, unmount } = renderHook(({ path }) => useApi<{ value: string }>(path), { initialProps: { path: '/old' } });
        rerender({ path: '/new' }); expect(pending[0].signal.aborted).toBe(true);
        expect(result.current).toMatchObject({ loading: true, data: null });
        await act(async () => pending[1].resolve(json({ value: 'new' })));
        await act(async () => pending[0].resolve(json({ value: 'old' })));
        expect(result.current.data).toEqual({ value: 'new' });
        unmount(); expect(pending[1].signal.aborted).toBe(true);
    });
    it('clears previous data when returning A → B → A while B is pending', async () => {
        const pending: ((value: Response) => void)[] = [];
        vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => pending.push(resolve))));
        const { result, rerender } = renderHook(({ path }) => useApi<{ value: string }>(path), { initialProps: { path: '/a' } });
        await act(async () => pending[0](json({ value: 'old A' })));
        rerender({ path: '/b' }); rerender({ path: '/a' });
        expect(result.current).toMatchObject({ data: null, loading: true });
        await act(async () => pending[2](json({ value: 'fresh A' })));
        await act(async () => pending[1](json({ value: 'late B' })));
        expect(result.current.data).toEqual({ value: 'fresh A' });
    });
    it('turns timeout failures into actionable feedback', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('timeout', 'TimeoutError'); }));
        await expect(apiGet('/test')).rejects.toThrow('timed out');
    });
    it('does not fetch without a valid selection', () => {
        const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
        const { result } = renderHook(() => useApi(null));
        expect(result.current.loading).toBe(false); expect(fetcher).not.toHaveBeenCalled();
    });
    it.each([404, 422, 502])('reports HTTP %s as an error', async status => {
        vi.stubGlobal('fetch', vi.fn(async () => json({}, status)));
        await expect(apiGet('/test')).rejects.toThrow(status === 404 ? 'No league data' : status === 422 ? 'valid season' : 'temporarily unavailable');
    });
    it.each([
        ['/divisions/grouped?year=2027', { categories: [{ divisions: null }] }],
        ['/divisions/prem/teams?year=2027', { teams: [{ team_name: 'FC', team_slug: 123 }] }],
        ['/divisions/2027/prem/standings', { pools: [{ pool_name: null, teams: [{ points: 'six' }] }] }],
        ['/divisions/2027/prem/scorers', { pools: [{ scorers: [null] }] }],
        ['/divisions/2027/prem/mvps', { pools: [{ player_mvps: null }] }],
        ['/divisions/2027/prem/shutouts', { pools: [{ keepers: [{}] }] }],
        ['/teams/prem/fc/overview?year=2027', { team_name: 'FC', standings: null, form: null, upcoming_fixture: null }],
        ['/teams/prem/fc/schedule?year=2027', { year: 2027, division: 'prem', team_name: 'FC', played: [], upcoming: [{}] }],
        ['/divisions/2027/prem/goal-data?team_slug=fc', { teams: [], insights: { trend: null } }],
    ])('rejects malformed nested data at %s', async (path, body) => {
        vi.stubGlobal('fetch', vi.fn(async () => json(body)));
        await expect(apiGet(path)).rejects.toThrow('unexpected league data');
    });
    it('reports invalid JSON', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>')));
        await expect(apiGet('/test')).rejects.toThrow('invalid league data');
    });
});
describe('standings', () => {
    it('renders semantic standings and a working return link', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => json({ pools: [{ pool_name: 'Pool A', teams: [{ team_name: 'Test FC', position: 1, games_played: 2, points: 6, wins: 2, draws: 0, losses: 0, goals_for: 4, goals_against: 1, goal_diff: 3 }] }] })));
        render(<MemoryRouter initialEntries={['/divisions/2027/prem/standings']}><Routes><Route path="/divisions/:year/:division/standings" element={<Standings />} /><Route path="/" element={<p>Picker destination</p>} /></Routes></MemoryRouter>);
        expect(await screen.findByRole('table')).toHaveAccessibleName(/Division prem standings/);
        expect(screen.getByRole('rowheader', { name: 'Test FC' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('link', { name: 'Back to team picker' }));
        await waitFor(() => expect(screen.getByText('Picker destination')).toBeInTheDocument());
    });
});
