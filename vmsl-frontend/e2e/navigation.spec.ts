import { test, expect } from '@playwright/test';
const standing = { position: 1, team_name: 'Test Football Club With A Long Name', games_played: 0, points: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, goal_diff: 0 };
test.beforeEach(async ({ page }) => {
    await page.route('http://127.0.0.1:8000/**', async route => {
        const path = new URL(route.request().url()).pathname;
        let body: unknown;
        if (path === '/divisions/grouped') body = { categories: [{ category_name: 'Open', divisions: [{ code: 'prem', name: 'Premier' }] }] };
        else if (path.endsWith('/teams')) body = { teams: [{ team_name: standing.team_name, team_slug: 'test-fc' }] };
        else if (path.endsWith('/overview')) body = { team_name: standing.team_name, standings: { position: 1, standing, rivals_above: [], rivals_below: [] }, form: [], upcoming_fixture: null };
        else if (path.endsWith('/standings')) body = { pools: [{ pool_name: 'Pool A', teams: [standing] }] };
        else if (path.endsWith('/schedule')) body = { year: 2027, division: 'prem', team_name: standing.team_name, played: [], upcoming: [] };
        else if (path.endsWith('/scorers')) body = { pools: [{ scorers: [{ player_name: 'Alex Player', team_name: standing.team_name, goals: 3 }] }] };
        else if (path.endsWith('/mvps')) body = { pools: [{ player_mvps: [] }] };
        else if (path.endsWith('/shutouts')) body = { pools: [{ keepers: [] }] };
        else if (path.endsWith('/goal-data')) body = { teams: [], insights: null };
        else throw new Error(`Unmocked API path: ${path}`);
        await route.fulfill({ json: body });
    });
});
test('picker, standings, fixtures and player pages remain usable across viewports', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Season ending year').fill('2027');
    await page.getByLabel('Division', { exact: true }).selectOption('prem');
    await page.getByLabel('Team', { exact: true }).selectOption('test-fc');
    await page.getByRole('button', { name: 'Go to Team Hub' }).click();
    await expect(page.getByRole('heading', { name: 'Team Hub', exact: true })).toBeVisible();
    await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0);
    await page.getByRole('link', { name: 'View Full Table' }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('rowheader', { name: standing.team_name })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    await page.screenshot({ path: `test-results/standings-${test.info().project.name}.png`, fullPage: true });
    await page.goBack();
    await page.getByRole('navigation', { name: 'Team pages' }).getByRole('link', { name: 'Fixtures' }).click();
    await expect(page.getByText('No upcoming fixtures.')).toBeVisible();
    await expect(page.getByText('No played matches yet.')).toBeVisible();
    for (const [link, heading] of [['Scorers', 'Division Scorers'], ['MVPs', 'Division MVPs'], ['Shutouts', 'Division Keeper Shutouts'], ['Goal analytics', 'Goal Data Dashboard']]) {
        await page.getByRole('navigation', { name: 'Team pages' }).getByRole('link', { name: link, exact: true }).click();
        await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
        if (link === 'Scorers') {
            await expect(page.getByText('Alex Player')).toBeVisible();
            await page.getByLabel('Search players or teams').fill('missing-player');
            await expect(page.getByText('No players match this search.')).toBeVisible();
            await expect(page.getByText('Alex Player')).toHaveCount(0);
        }
        if (link === 'MVPs') await expect(page.getByText('No players match this search.')).toBeVisible();
        if (link === 'Shutouts') await expect(page.getByText('No keepers match this search.')).toBeVisible();
        if (link === 'Goal analytics') await expect(page.getByText('No goal statistics published for this team.')).toBeVisible();
    }
});
test('keyboard users can reach the skip link and picker', async ({ page }) => {
    await page.goto('/'); await expect(page.getByLabel('Season ending year')).toBeVisible(); await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter'); await page.keyboard.press('Tab');
    await expect(page.getByLabel('Season ending year')).toBeFocused();
});

test('deep links show actionable API failures instead of crashing', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/divisions/2027/prem/standings', route => route.fulfill({ status: 502, json: {} }));
    await page.goto('/divisions/2027/prem/standings');
    await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
    await page.route('http://127.0.0.1:8000/divisions/2027/prem/standings', route => route.fulfill({ json: { pools: [{ teams: null }] } }));
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('unexpected league data');
});
