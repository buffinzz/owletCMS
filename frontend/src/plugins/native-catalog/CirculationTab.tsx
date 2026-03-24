import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';

interface Patron {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  libraryCardNumber?: string;
  role: string;
}

interface Copy {
  id: number;
  itemId: number;
  barcode: string;
  status: string;
  condition: string;
  location?: string;
}

interface CatalogItem {
  id: number;
  title: string;
  author?: string;
  coverUrl?: string;
}

interface CirculationRecord {
  id: number;
  copyId: number;
  itemId: number;
  patronId: number;
  dueDate: string;
  checkedOutAt: string;
  renewalCount: number;
}

type DeskMode = 'checkout' | 'return' | 'active';

export default function CirculationTab() {
  const { user } = useAuth();
  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [deskMode, setDeskMode] = useState<DeskMode>('checkout');

  // Patron lookup
  const [patronBarcode, setPatronBarcode] = useState('');
  const [patronSearch, setPatronSearch] = useState('');
  const [patronResults, setPatronResults] = useState<Patron[]>([]);
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);
  const [patronCheckouts, setPatronCheckouts] = useState<Array<CirculationRecord & { item?: CatalogItem; copy?: Copy }>>([]);

  // Item/copy lookup
  const [copyBarcode, setCopyBarcode] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [itemResults, setItemResults] = useState<Array<CatalogItem & { copies?: Copy[] }>>([]);
  const [selectedCopy, setSelectedCopy] = useState<Copy | null>(null);
  const [selectedCopyItem, setSelectedCopyItem] = useState<CatalogItem | null>(null);

  // Return
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnResult, setReturnResult] = useState<any>(null);

  // Active checkouts
  const [activeCheckouts, setActiveCheckouts] = useState<any[]>([]);
  const [overdueCheckouts, setOverdueCheckouts] = useState<any[]>([]);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const patronBarcodeRef = useRef<HTMLInputElement>(null);
  const copyBarcodeRef = useRef<HTMLInputElement>(null);
  const returnBarcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (deskMode === 'active') {
      fetchActive();
    }
  }, [deskMode]);

  // Focus barcode inputs on mode change
  useEffect(() => {
    if (deskMode === 'checkout') patronBarcodeRef.current?.focus();
    if (deskMode === 'return') returnBarcodeRef.current?.focus();
  }, [deskMode]);

  const fetchActive = async () => {
    const [active, overdue] = await Promise.all([
      api.get('/circulation', authHeader).then(r => r.data).catch(() => []),
      api.get('/circulation/overdue', authHeader).then(r => r.data).catch(() => []),
    ]);
    setActiveCheckouts(active);
    setOverdueCheckouts(overdue);
  };

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 5000);
  };

  // ── Patron lookup by card number ──
  const handlePatronBarcode = async (barcode: string) => {
    if (!barcode.trim()) return;
    try {
      const res = await api.get(`/users?libraryCard=${encodeURIComponent(barcode)}`, authHeader);
      if (res.data?.length > 0) {
        selectPatron(res.data[0]);
      } else {
        notify('No patron found with that card number.', true);
      }
    } catch {
      notify('Patron lookup failed.', true);
    }
  };

  // ── Patron search ──
  const handlePatronSearch = async (q: string) => {
    setPatronSearch(q);
    if (q.length < 2) return setPatronResults([]);
    try {
      const res = await api.get(`/users?search=${encodeURIComponent(q)}&role=patron`, authHeader);
      setPatronResults(res.data.slice(0, 8));
    } catch {
      setPatronResults([]);
    }
  };

  const selectPatron = async (patron: Patron) => {
    setSelectedPatron(patron);
    setPatronResults([]);
    setPatronSearch('');
    setPatronBarcode('');
    // Load patron's current checkouts
    try {
      const res = await api.get(`/circulation/patron/${patron.id}`, authHeader);
      // Enrich with item data
      const enriched = await Promise.all(
        res.data.map(async (record: CirculationRecord) => {
          const item = await api.get(`/catalog/${record.itemId}`).then(r => r.data).catch(() => null);
          const copy = await api.get(`/catalog/copies/item/${record.itemId}`, authHeader)
            .then(r => r.data.find((c: Copy) => c.id === record.copyId)).catch(() => null);
          return { ...record, item, copy };
        })
      );
      setPatronCheckouts(enriched);
    } catch {
      setPatronCheckouts([]);
    }
  };

  // ── Copy lookup by barcode ──
  const handleCopyBarcode = async (barcode: string) => {
    if (!barcode.trim()) return;
    try {
      const res = await api.get(`/catalog/copies/barcode/${encodeURIComponent(barcode)}`, authHeader);
      if (res.data) {
        const item = await api.get(`/catalog/${res.data.itemId}`).then(r => r.data).catch(() => null);
        setSelectedCopy(res.data);
        setSelectedCopyItem(item);
        setCopyBarcode('');
      } else {
        notify('No copy found with that barcode.', true);
      }
    } catch {
      notify('Copy lookup failed.', true);
    }
  };

  // ── Item search ──
  const handleItemSearch = async (q: string) => {
    setItemSearch(q);
    if (q.length < 2) return setItemResults([]);
    try {
      const res = await api.get(`/catalog?search=${encodeURIComponent(q)}&source=native`);
      const enriched = await Promise.all(
        res.data.slice(0, 6).map(async (item: CatalogItem) => {
          const copies = await api.get(`/catalog/copies/item/${item.id}`, authHeader)
            .then(r => r.data).catch(() => []);
          return { ...item, copies };
        })
      );
      setItemResults(enriched);
    } catch {
      setItemResults([]);
    }
  };

  // ── Checkout ──
  const handleCheckout = async () => {
    if (!selectedPatron || !selectedCopy) {
      notify('Please select both a patron and a copy.', true);
      return;
    }
    if (selectedCopy.status !== 'available') {
      notify(`This copy is ${selectedCopy.status.replace('_', ' ')}.`, true);
      return;
    }
    setProcessing(true);
    try {
      await api.post('/circulation/checkout', {
        copyId: selectedCopy.id,
        patronId: selectedPatron.id,
        patronEmail: selectedPatron.email || '',
        patronName: selectedPatron.displayName || selectedPatron.username,
      }, authHeader);
      notify(`✅ Checked out "${selectedCopyItem?.title}" to ${selectedPatron.displayName || selectedPatron.username}!`);
      // Refresh patron checkouts
      await selectPatron(selectedPatron);
      setSelectedCopy(null);
      setSelectedCopyItem(null);
      setItemSearch('');
      setItemResults([]);
    } catch (err: any) {
      notify(err.response?.data?.message || 'Checkout failed.', true);
    } finally {
      setProcessing(false);
    }
  };

  // ── Return ──
  const handleReturn = async () => {
    if (!returnBarcode.trim()) return;
    setProcessing(true);
    try {
      const copyRes = await api.get(`/catalog/copies/barcode/${encodeURIComponent(returnBarcode)}`, authHeader);
      if (!copyRes.data) {
        notify('No copy found with that barcode.', true);
        return;
      }
      const copy = copyRes.data;
      const record = await api.post(`/circulation/return/${copy.id}`, {}, authHeader);
      const item = await api.get(`/catalog/${copy.itemId}`).then(r => r.data).catch(() => null);
      setReturnResult({ copy, item, record: record.data });
      setReturnBarcode('');
      notify(`✅ "${item?.title || 'Item'}" returned successfully!`);
    } catch (err: any) {
      notify(err.response?.data?.message || 'Return failed.', true);
    } finally {
      setProcessing(false);
      returnBarcodeRef.current?.focus();
    }
  };

  // ── Renew ──
  const handleRenew = async (circulationId: number) => {
    try {
      await api.post(`/circulation/renew/${circulationId}`, {}, authHeader);
      notify('✅ Renewed successfully!');
      if (selectedPatron) await selectPatron(selectedPatron);
    } catch (err: any) {
      notify(err.response?.data?.message || 'Renewal failed.', true);
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <div>
      {success && <div className="owlet-alert owlet-alert-success">{success}</div>}
      {error && <div className="owlet-alert owlet-alert-error">{error}</div>}

      {/* Mode tabs */}
      <div className="owlet-catalog-nav" style={{ marginBottom: '1.5rem' }}>
        <button className={`owlet-tab ${deskMode === 'checkout' ? 'active' : ''}`}
          onClick={() => setDeskMode('checkout')}>
          📤 Check Out
        </button>
        <button className={`owlet-tab ${deskMode === 'return' ? 'active' : ''}`}
          onClick={() => setDeskMode('return')}>
          📥 Return
        </button>
        <button className={`owlet-tab ${deskMode === 'active' ? 'active' : ''}`}
          onClick={() => setDeskMode('active')}>
          📋 Active Checkouts
        </button>
      </div>

      {/* ── CHECKOUT DESK ── */}
      {deskMode === 'checkout' && (
        <div className="owlet-circ-desk">
          <div className="owlet-circ-panels">
            {/* Patron panel */}
            <div className="owlet-circ-panel">
              <h4 className="owlet-circ-panel-title">👤 Patron</h4>
              {!selectedPatron ? (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      ref={patronBarcodeRef}
                      className="owlet-catalog-search"
                      placeholder="Scan library card..."
                      value={patronBarcode}
                      onChange={e => setPatronBarcode(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handlePatronBarcode(patronBarcode); }}
                      style={{ flex: 1 }}
                    />
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handlePatronBarcode(patronBarcode)}>
                      ↵
                    </button>
                  </div>
                  <input
                    className="owlet-catalog-search"
                    placeholder="Or search by name..."
                    value={patronSearch}
                    onChange={e => handlePatronSearch(e.target.value)}
                  />
                  {patronResults.length > 0 && (
                    <div className="owlet-collection-search-results" style={{ marginTop: '0.5rem' }}>
                      {patronResults.map(p => (
                        <div key={p.id} className="owlet-collection-item-row"
                          style={{ cursor: 'pointer' }}
                          onClick={() => selectPatron(p)}>
                          <span>
                            {p.displayName || p.username}
                            {p.libraryCardNumber && (
                              <span style={{ color: 'var(--ink-light)', fontSize: '0.8rem' }}>
                                {' '}· {p.libraryCardNumber}
                              </span>
                            )}
                          </span>
                          <button className="owlet-btn-action owlet-btn-edit">Select</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="owlet-circ-selected">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: 'var(--purple-deep)' }}>
                      {selectedPatron.displayName || selectedPatron.username}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)' }}>
                      {selectedPatron.email}
                      {selectedPatron.libraryCardNumber && ` · Card: ${selectedPatron.libraryCardNumber}`}
                    </p>
                    {patronCheckouts.length > 0 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--amber)', marginTop: '0.25rem' }}>
                        {patronCheckouts.length} item{patronCheckouts.length !== 1 ? 's' : ''} currently checked out
                      </p>
                    )}
                  </div>
                  <button className="owlet-btn-action owlet-btn-delete"
                    onClick={() => { setSelectedPatron(null); setPatronCheckouts([]); }}>
                    ✕
                  </button>
                </div>
              )}

              {/* Patron's current checkouts */}
              {selectedPatron && patronCheckouts.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Current Checkouts
                  </p>
                  {patronCheckouts.map(record => (
                    <div key={record.id} className="owlet-circ-checkout-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', margin: 0 }}>
                          {record.item?.title || `Item #${record.itemId}`}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: isOverdue(record.dueDate) ? '#c0392b' : 'var(--ink-light)', margin: 0 }}>
                          Due: {new Date(record.dueDate).toLocaleDateString()}
                          {isOverdue(record.dueDate) && ' ⚠️ OVERDUE'}
                          {record.renewalCount > 0 && ` · Renewed ${record.renewalCount}×`}
                        </p>
                      </div>
                      <button className="owlet-btn-action owlet-btn-edit"
                        onClick={() => handleRenew(record.id)}
                        style={{ fontSize: '0.75rem' }}>
                        🔄 Renew
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Item panel */}
            <div className="owlet-circ-panel">
              <h4 className="owlet-circ-panel-title">📚 Item</h4>
              {!selectedCopy ? (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      ref={copyBarcodeRef}
                      className="owlet-catalog-search"
                      placeholder="Scan item barcode..."
                      value={copyBarcode}
                      onChange={e => setCopyBarcode(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCopyBarcode(copyBarcode); }}
                      style={{ flex: 1 }}
                    />
                    <button className="owlet-btn-action owlet-btn-edit"
                      onClick={() => handleCopyBarcode(copyBarcode)}>
                      ↵
                    </button>
                  </div>
                  <input
                    className="owlet-catalog-search"
                    placeholder="Or search by title..."
                    value={itemSearch}
                    onChange={e => handleItemSearch(e.target.value)}
                  />
                  {itemResults.length > 0 && (
                    <div className="owlet-collection-search-results" style={{ marginTop: '0.5rem' }}>
                      {itemResults.map(item => (
                        <div key={item.id}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', padding: '0.4rem 0.6rem 0.2rem', margin: 0 }}>
                            {item.title}
                            {item.author && <span style={{ fontWeight: 300 }}> — {item.author}</span>}
                          </p>
                          {(item.copies || []).map((copy: Copy) => (
                            <div key={copy.id} className="owlet-collection-item-row">
                              <span style={{ fontSize: '0.8rem' }}>
                                <span style={{ fontFamily: 'monospace' }}>{copy.barcode}</span>
                                <span style={{ color: copy.status === 'available' ? 'var(--teal)' : 'var(--amber)', marginLeft: '0.4rem' }}>
                                  {copy.status.replace('_', ' ')}
                                </span>
                              </span>
                              <button
                                className="owlet-btn-action owlet-btn-edit"
                                disabled={copy.status !== 'available'}
                                onClick={() => {
                                  setSelectedCopy(copy);
                                  setSelectedCopyItem(item);
                                  setItemSearch('');
                                  setItemResults([]);
                                }}
                              >
                                {copy.status === 'available' ? 'Select' : '—'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="owlet-circ-selected">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: 'var(--purple-deep)' }}>
                      {selectedCopyItem?.title}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)' }}>
                      Barcode: <span style={{ fontFamily: 'monospace' }}>{selectedCopy.barcode}</span>
                      {' '}· {selectedCopy.condition}
                    </p>
                  </div>
                  <button className="owlet-btn-action owlet-btn-delete"
                    onClick={() => { setSelectedCopy(null); setSelectedCopyItem(null); }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Checkout button */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              className="owlet-btn owlet-btn-primary"
              style={{ width: 'auto', padding: '0.75rem 2.5rem', fontSize: '1rem' }}
              onClick={handleCheckout}
              disabled={!selectedPatron || !selectedCopy || processing}
            >
              {processing ? 'Processing...' : '📤 Check Out'}
            </button>
            {(!selectedPatron || !selectedCopy) && (
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: '0.5rem' }}>
                {!selectedPatron && !selectedCopy ? 'Select a patron and an item to check out'
                  : !selectedPatron ? 'Select a patron'
                  : 'Select an item'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── RETURN DESK ── */}
      {deskMode === 'return' && (
        <div className="owlet-circ-desk">
          <h4 className="owlet-circ-panel-title">📥 Return Item</h4>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: 480 }}>
            <input
              ref={returnBarcodeRef}
              className="owlet-catalog-search"
              placeholder="Scan or enter item barcode..."
              value={returnBarcode}
              onChange={e => setReturnBarcode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleReturn(); }}
              style={{ flex: 1 }}
              autoFocus
            />
            <button
              className="owlet-btn owlet-btn-primary"
              style={{ width: 'auto' }}
              onClick={handleReturn}
              disabled={processing}
            >
              {processing ? '⏳' : '📥 Return'}
            </button>
          </div>

          {returnResult && (
            <div className="owlet-circ-return-result">
              <div style={{ fontSize: '2rem' }}>✅</div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--purple-deep)' }}>
                  {returnResult.item?.title || 'Item'} returned
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-light)' }}>
                  Barcode: <span style={{ fontFamily: 'monospace' }}>{returnResult.copy?.barcode}</span>
                </p>
                {returnResult.record?.isOverdue && (
                  <p style={{ fontSize: '0.85rem', color: '#c0392b' }}>
                    ⚠️ Was overdue
                    {returnResult.record.fineAmount > 0 && ` · Fine: $${returnResult.record.fineAmount.toFixed(2)}`}
                  </p>
                )}
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: '1rem', fontStyle: 'italic' }}>
            💡 Tip: Focus stays on the barcode field — scan multiple items in a row.
          </p>
        </div>
      )}

      {/* ── ACTIVE CHECKOUTS ── */}
      {deskMode === 'active' && (
        <div>
          {overdueCheckouts.length > 0 && (
            <>
              <h4 style={{ color: '#c0392b', fontFamily: 'Playfair Display, serif', marginBottom: '0.75rem' }}>
                ⚠️ Overdue ({overdueCheckouts.length})
              </h4>
              <div className="owlet-admin-list" style={{ marginBottom: '1.5rem' }}>
                {overdueCheckouts.map(record => (
                  <div key={record.id} className="owlet-admin-item" style={{ borderLeft: '3px solid #c0392b' }}>
                    <div className="owlet-admin-item-info">
                      <h3>Patron #{record.patronId} · Copy #{record.copyId}</h3>
                      <p style={{ color: '#c0392b' }}>
                        Due: {new Date(record.dueDate).toLocaleDateString()}
                        {' '}· {Math.floor((Date.now() - new Date(record.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <h4 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '0.75rem', color: 'var(--purple-deep)' }}>
            All Active Checkouts ({activeCheckouts.length})
          </h4>
          <div className="owlet-admin-list">
            {activeCheckouts.length === 0 ? (
              <div className="owlet-empty"><p>No active checkouts.</p></div>
            ) : activeCheckouts.map(record => (
              <div key={record.id} className="owlet-admin-item">
                <div className="owlet-admin-item-info">
                  <h3>Patron #{record.patronId} · Copy #{record.copyId}</h3>
                  <p style={{ color: isOverdue(record.dueDate) ? '#c0392b' : 'var(--ink-light)' }}>
                    Due: {new Date(record.dueDate).toLocaleDateString()}
                    {record.renewalCount > 0 && ` · Renewed ${record.renewalCount}×`}
                  </p>
                </div>
                <div className="owlet-admin-item-actions">
                  <button className="owlet-btn-action owlet-btn-edit"
                    onClick={() => handleRenew(record.id)}>
                    🔄 Renew
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
