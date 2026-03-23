import { useEffect, useState, useMemo } from 'react';
import api from '../../api';

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  audience?: string;
  imageUrl?: string;
  imageAlt?: string;
  isPublished: boolean;
}

type ViewMode = 'calendar' | 'list';

const AUDIENCE_COLORS: Record<string, string> = {
  'All ages': '#3d1f6e',
  'Adults': '#2a9d8f',
  'Children': '#e8820c',
  'Teens': '#8b1a1a',
  'Seniors': '#2d5a27',
  'Families': '#b45309',
};

function getAudienceColor(audience?: string): string {
  if (!audience) return 'var(--purple-deep)';
  for (const [key, color] of Object.entries(AUDIENCE_COLORS)) {
    if (audience.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return 'var(--purple-deep)';
}

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('calendar');
  const [today] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [audienceFilter, setAudienceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Unique audiences and locations for filters
  const audiences = useMemo(() =>
    [...new Set(events.map(e => e.audience).filter(Boolean))] as string[],
    [events]
  );

  const locations = useMemo(() =>
    [...new Set(events.map(e => e.location).filter(Boolean))] as string[],
    [events]
  );

  // Filtered events
  const filtered = useMemo(() => events.filter(e => {
    if (audienceFilter && e.audience !== audienceFilter) return false;
    if (locationFilter && e.location !== locationFilter) return false;
    return true;
  }), [events, audienceFilter, locationFilter]);

  // Events for current month
  const monthEvents = useMemo(() => filtered.filter(e => {
    const d = new Date(e.startDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [filtered, currentMonth, currentYear]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: Array<{ date: number | null; events: Event[] }> = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, events: [] });
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = monthEvents.filter(e => {
        return new Date(e.startDate).getDate() === d;
      });
      days.push({ date: d, events: dayEvents });
    }

    return days;
  }, [currentMonth, currentYear, monthEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const isToday = (date: number) =>
    date === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  return (
    <div>
      <section className="owlet-hero owlet-hero-short">
        <div className="owlet-hero-inner">
          <div className="owlet-hero-text">
            <h1>Events & <em>Programs.</em></h1>
            <p>What's happening at your library.</p>
          </div>
        </div>
      </section>

      <main className="owlet-main">
        {/* Controls */}
        <div className="owlet-events-controls">
          <div className="owlet-events-filters">
            {audiences.length > 0 && (
              <select
                className="owlet-select owlet-select-sm"
                value={audienceFilter}
                onChange={e => setAudienceFilter(e.target.value)}
              >
                <option value="">All audiences</option>
                {audiences.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}
            {locations.length > 0 && (
              <select
                className="owlet-select owlet-select-sm"
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
              >
                <option value="">All locations</option>
                {locations.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}
          </div>

          <div className="owlet-events-view-toggle">
            <button
              className={`owlet-media-filter ${view === 'calendar' ? 'active' : ''}`}
              onClick={() => setView('calendar')}
            >
              📅 Calendar
            </button>
            <button
              className={`owlet-media-filter ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              ☰ List
            </button>
          </div>
        </div>

        {loading ? (
          <div className="owlet-loading"><span /><span /><span /></div>
        ) : (
          <>
            {/* ── CALENDAR VIEW ── */}
            {view === 'calendar' && (
              <div className="owlet-calendar">
                {/* Month navigation */}
                <div className="owlet-calendar-header">
                  <button className="owlet-calendar-nav" onClick={prevMonth}>‹</button>
                  <h2 className="owlet-calendar-title">
                    {MONTHS[currentMonth]} {currentYear}
                  </h2>
                  <button className="owlet-calendar-nav" onClick={nextMonth}>›</button>
                </div>

                {/* Day headers */}
                <div className="owlet-calendar-grid">
                  {DAYS.map(d => (
                    <div key={d} className="owlet-calendar-day-header">{d}</div>
                  ))}

                  {/* Calendar cells */}
                  {calendarDays.map((day, i) => (
                    <div
                      key={i}
                      className={`owlet-calendar-cell ${!day.date ? 'owlet-calendar-empty' : ''} ${day.date && isToday(day.date) ? 'owlet-calendar-today' : ''}`}
                    >
                      {day.date && (
                        <>
                          <span className="owlet-calendar-date">{day.date}</span>
                          <div className="owlet-calendar-events">
                            {day.events.slice(0, 3).map(event => (
                              <button
                                key={event.id}
                                className="owlet-calendar-event"
                                style={{ background: getAudienceColor(event.audience) }}
                                onClick={() => setSelectedEvent(event)}
                                title={event.title}
                              >
                                {event.title}
                              </button>
                            ))}
                            {day.events.length > 3 && (
                              <span className="owlet-calendar-more">
                                +{day.events.length - 3} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Audience colour legend */}
                {audiences.length > 0 && (
                  <div className="owlet-calendar-legend">
                    {audiences.map(a => (
                      <div key={a} className="owlet-calendar-legend-item">
                        <span
                          className="owlet-calendar-legend-dot"
                          style={{ background: getAudienceColor(a) }}
                        />
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {view === 'list' && (
              <div>
                {filtered.length === 0 ? (
                  <div className="owlet-empty">
                    <div className="owlet-empty-icon">📅</div>
                    <p>No upcoming events.</p>
                  </div>
                ) : (
                  <div className="owlet-events-list">
                    {filtered.map(event => {
                      const d = new Date(event.startDate);
                      return (
                        <div
                          key={event.id}
                          className="owlet-event-card"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div
                            className="owlet-event-date"
                            style={{ background: getAudienceColor(event.audience) }}
                          >
                            <span className="owlet-event-day">
                              {d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="owlet-event-num">{d.getDate()}</span>
                            <span className="owlet-event-month">
                              {d.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                          </div>
                          <div className="owlet-event-body">
                            <h3>{event.title}</h3>
                            <p>{event.description}</p>
                            <div className="owlet-event-meta">
                              {event.location && <span>📍 {event.location}</span>}
                              {event.audience && <span>👥 {event.audience}</span>}
                              <span>🕐 {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          {event.imageUrl && (
                            <div className="owlet-event-image">
                              <img src={event.imageUrl} alt={event.imageAlt || event.title} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── EVENT DETAIL MODAL ── */}
      {selectedEvent && (
        <div className="owlet-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="owlet-modal owlet-event-modal" onClick={e => e.stopPropagation()}>
            <button className="owlet-modal-close" onClick={() => setSelectedEvent(null)}>✕</button>

            {selectedEvent.imageUrl && (
              <div className="owlet-event-modal-image">
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.imageAlt || selectedEvent.title}
                />
              </div>
            )}

            <div className="owlet-event-modal-body">
              <div
                className="owlet-event-modal-date"
                style={{ background: getAudienceColor(selectedEvent.audience) }}
              >
                {(() => {
                  const d = new Date(selectedEvent.startDate);
                  return (
                    <>
                      <span className="owlet-event-day">
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="owlet-event-num">{d.getDate()}</span>
                      <span className="owlet-event-month">
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </>
                  );
                })()}
              </div>

              <div className="owlet-event-modal-info">
                <h2>{selectedEvent.title}</h2>
                <div className="owlet-event-meta" style={{ marginBottom: '1rem' }}>
                  {selectedEvent.location && <span>📍 {selectedEvent.location}</span>}
                  {selectedEvent.audience && <span>👥 {selectedEvent.audience}</span>}
                  <span>🕐 {new Date(selectedEvent.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <p style={{ color: 'var(--ink-light)', lineHeight: 1.7, fontWeight: 300 }}>
                  {selectedEvent.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
