/* Dashboard.css – add these styles */

.wd-filter-bar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    align-items: flex-end;
}

.wd-filter-bar input, .wd-filter-bar select {
    padding: 0.5rem;
    border: 1px solid var(--border, #ddd);
    border-radius: 6px;
    background: var(--bg-input, white);
    color: var(--text-pri, #333);
    font-size: 0.85rem;
}

.wd-filter-bar button {
    background-color: var(--accent-primary, #4aad4a);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.wd-filter-bar button.active {
    background-color: var(--accent-amber, #f59e0b);
}

.wd-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
}

.wd-table th {
    text-align: left;
    padding: 0.75rem;
    background-color: var(--bg-raised, #f0f0f0);
    border-bottom: 1px solid var(--border, #ddd);
    font-weight: 600;
}

.wd-table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-light, #eee);
}

.wd-section {
    font-family: var(--font-display, 'Barlow Condensed', sans-serif);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-dim, #666);
    margin: 1.5rem 0 0.75rem 0;
    font-size: 0.85rem;
}
