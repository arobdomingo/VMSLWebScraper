import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import TeamAnalysis, { Difficulty } from '../components/TeamAnalysis';
import type { TeamAnalysis as Analysis } from '../types/analysis';
import { validateResponse } from '../api/responseValidation';

const split = { games_played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, clean_sheets: 0, points_per_game: null, gf_per_game: null, ga_per_game: null };
const team = { team_name: 'A', team_slug: 'a', pool_name: null, position: 1, points_per_game: null, gf_per_game: null, ga_per_game: null, form: [] };
const data: Analysis = { team, home: split, away: split, opponents: [{ team_name: 'B', team_slug: 'b', pool_name: null }], opponent: null, meetings: [], next_difficulty: { label: 'High', opponent_ppg: 2, opponent_games: 3 } };

it('shows empty venue splits and fetches a selected head-to-head comparison', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ...data, opponent: {...team,team_name:'B',team_slug:'b'} }), {status:200}));
    vi.stubGlobal('fetch',fetch);
    render(<MemoryRouter><TeamAnalysis year="2027" division="1" teamSlug="a" data={data} loading={false} error={null} /></MemoryRouter>);
    expect(screen.getByText('No completed home fixtures.')).toBeInTheDocument();
    expect(screen.getByText('No completed away fixtures.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    await userEvent.selectOptions(screen.getByLabelText('Compare with'),'b');
    expect(await screen.findByText('No completed meetings in the available schedule.')).toBeInTheDocument();
    expect(fetch.mock.calls.length).toBe(1);
});

it('provides an expandable difficulty explanation with sample size', async () => {
    render(<Difficulty data={data} />);
    await userEvent.click(screen.getByText('Fixture difficulty: High'));
    expect(screen.getByText(/2.00 opponent PPG \(3 played\)/)).toBeVisible();
    expect(screen.getByText(/not a prediction/)).toBeVisible();
});

it('rejects malformed analysis rates and accepts zero-game nulls', () => {
    expect(() => validateResponse('/teams/1/a/analysis?year=2027',data)).not.toThrow();
    expect(() => validateResponse('/teams/1/a/analysis?year=2027',{...data,home:{...split,points_per_game:'0'}})).toThrow(/unexpected league data/);
});
