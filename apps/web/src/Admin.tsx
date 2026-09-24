import { useEffect, useState } from 'react';
import type { AdminOverview } from '@nexus/shared';
import { api } from './api';
export default function Admin() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [search, setSearch] = useState(''),
    [query, setQuery] = useState(''),
    [type, setType] = useState('registered'),
    [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0);
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api<AdminOverview>(
      `/admin/overview?${new URLSearchParams({ search: query, type, page: String(page) })}`,
    )
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, type, page, refresh]);
  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="tag">OWNER ACCESS</span>
          <h1>Your Nexus, at a glance.</h1>
          <p>People, learning activity and payment visibility.</p>
        </div>
        <button
          className="button secondary"
          disabled={loading}
          onClick={() => setRefresh((v) => v + 1)}
        >
          Refresh data
        </button>
      </div>
      {error && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      {loading && <p role="status">Loading current records…</p>}
      {data && (
        <>
          <div className="admin-stats">
            <article>
              <span>Registered users</span>
              <strong>{data.summary.registered}</strong>
              <small>Accounts outside demo mode</small>
            </article>
            <article>
              <span>Real revenue</span>
              <strong>Not connected</strong>
              <small>Live billing receipts needed</small>
            </article>
            <article>
              <span>Premium previews</span>
              <strong>{data.summary.premiumPreviews}</strong>
              <small>Sandbox unlocks, not paid subscribers</small>
            </article>
            <article>
              <span>Sandbox payments</span>
              <strong>{data.summary.sandboxSettled}</strong>
              <small>Settled tests · no real money</small>
            </article>
          </div>
          <div className="admin-revenue">
            <h2>Revenue tracking</h2>
            <p>{data.revenue.explanation}</p>
            <p>
              Connect live billing and a verified payment receipt ledger before reporting sales,
              refunds or recurring revenue.
            </p>
          </div>
          <div className="admin-users">
            <h2>User directory</h2>
            <p>
              {data.total} matching accounts · {data.summary.demos} demo accounts stored separately
              from registered users.
            </p>
            <form
              className="admin-filters"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setQuery(search);
              }}
            >
              <label>
                Search users
                <input
                  value={search}
                  maxLength={100}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or email"
                />
              </label>
              <label>
                Account type
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="registered">Registered users</option>
                  <option value="demo">Demo users</option>
                  <option value="all">All accounts</option>
                </select>
              </label>
              <button className="button secondary" type="submit">
                Search
              </button>
            </form>
            <div className="admin-table" tabIndex={0} aria-label="User learning summaries">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Skills started</th>
                    <th>Verified proofs</th>
                    <th>Sessions completed</th>
                    <th>Challenges</th>
                    <th>SkillCredits</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                        <small>{u.campus}</small>
                      </td>
                      <td>{u.skills}</td>
                      <td>{u.proofs}</td>
                      <td>{u.sessions}</td>
                      <td>{u.challenges}</td>
                      <td>{u.credits}</td>
                      <td>
                        {u.premiumPreview ? 'Premium preview' : 'Free'}
                        {u.demo ? ' · Demo' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.users.length && <p>No users match this search.</p>}
            </div>
            <div className="admin-pagination">
              <button
                className="button secondary"
                disabled={loading || page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}
              </span>
              <button
                className="button secondary"
                disabled={loading || page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
            <p className="admin-privacy">
              Private owner view. Personal conversations, sign-in codes and credentials are
              excluded.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
