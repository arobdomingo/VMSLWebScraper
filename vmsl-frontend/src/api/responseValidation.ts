// Validate fields consumed by pages before exposing JSON as a TypeScript type.
// Extra fields are allowed so additive backend changes stay compatible.
type Shape = 'string' | 'number' | 'boolean' | { [key: string]: Shape }
    | readonly [Shape] | { nullable: Shape } | { optional: Shape };
const nullable = (shape: Shape): Shape => ({ nullable: shape });
const optional = (shape: Shape): Shape => ({ optional: shape });
const poolName = optional(nullable('string'));
const match: Shape = {
    date: 'string', opponent: 'string', is_home: 'boolean',
    goals_for: nullable('number'), goals_against: nullable('number'),
    result: nullable('string'), field: nullable('string'),
};
const standing = {
    games_played: 'number', wins: 'number', draws: 'number', losses: 'number',
    goals_for: 'number', goals_against: 'number', goal_diff: 'number', points: 'number',
} satisfies Shape;
const rival: Shape = { team_name: 'string', position: 'number', points: 'number', goal_diff: 'number' };
const goalTeam: Shape = {
    team_name: 'string', team_slug: 'string', pool_name: poolName,
    games_played: 'number', goals_for: 'number', goals_against: 'number', goal_diff: 'number',
    gf_per_game: 'number', ga_per_game: 'number', gd_per_game: 'number',
};
const insights: Shape = {
    team_name: 'string', team_slug: 'string',
    biggest_win: nullable(match), biggest_loss: nullable(match),
    gf_over_two: 'number', ga_under_one: 'number', clean_sheets: 'number',
    trend: [{ date: 'string', gd: 'number' }],
};

function conforms(value: unknown, shape: Shape): boolean {
    if (typeof shape === 'string') {
        return typeof value === shape && (shape !== 'number' || Number.isFinite(value));
    }
    if (Array.isArray(shape)) {
        return Array.isArray(value) && value.every(item => conforms(item, shape[0]));
    }
    const fields = shape as Record<string, Shape>;
    if ('optional' in fields) return value === undefined || conforms(value, fields.optional);
    if ('nullable' in fields) return value === null || conforms(value, fields.nullable);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        && Object.entries(fields).every(([key, field]) =>
            conforms((value as Record<string, unknown>)[key], field));
}

export function validateResponse(path: string, data: unknown) {
    let shape: Shape | undefined;
    if (path.startsWith('/divisions/grouped')) {
        shape = { categories: [{ category_name: 'string', divisions: [{ code: 'string', name: 'string' }] }] };
    } else if (path.includes('/teams?')) {
        shape = { teams: [{ team_name: 'string', team_slug: 'string', pool_name: poolName }] };
    } else if (path.includes('/standings')) {
        shape = { pools: [{ pool_name: poolName, teams: [{ ...standing, position: 'number', team_name: 'string' }] }] };
    } else if (path.includes('/analysis')) {
        const rate = nullable('number');
        const split: Shape = { games_played: 'number', wins: 'number', draws: 'number', losses: 'number', goals_for: 'number', goals_against: 'number', clean_sheets: 'number', points_per_game: rate, gf_per_game: rate, ga_per_game: rate };
        const team: Shape = { team_name: 'string', team_slug: 'string', pool_name: nullable('string'), position: 'number', points_per_game: rate, gf_per_game: rate, ga_per_game: rate, form: [match] };
        shape = { team, home: split, away: split, opponents: [{team_name: 'string', team_slug: 'string', pool_name: poolName}], opponent: nullable(team), meetings: [match], next_difficulty: nullable({label: 'string', opponent_ppg: rate, opponent_games: 'number'}) };
    } else if (path.includes('/overview')) {
        shape = {
            team_name: 'string', form: [match],
            standings: nullable({ position: 'number', standing, rivals_above: [rival], rivals_below: [rival] }),
            upcoming_fixture: nullable({ date: 'string', opponent: 'string', is_home: 'boolean', field: nullable('string') }),
        };
    } else if (path.includes('/schedule')) {
        shape = { year: 'number', division: 'string', team_name: 'string', played: [match], upcoming: [match] };
    } else if (path.includes('/goal-data')) {
        shape = { teams: [goalTeam], insights: nullable(insights) };
    } else {
        const entry = path.includes('/scorers') ? ['scorers', 'goals']
            : path.includes('/mvps') ? ['player_mvps', 'mvps']
            : path.includes('/shutouts') ? ['keepers', 'shutouts'] : null;
        if (entry) {
            shape = { pools: [{ pool_name: poolName,
                [entry[0]]: [{ player_name: 'string', team_name: 'string', [entry[1]]: 'number' }],
            }] };
        }
    }
    if (shape && !conforms(data, shape)) {
        throw new Error('The server returned unexpected league data. Please try again later.');
    }
}
