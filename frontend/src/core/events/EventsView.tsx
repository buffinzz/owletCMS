import { useEffect, useState } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  location?: string;
  audience?: string;
  isPublished: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageTitle?: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function EventsView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="owlet-loading">
        <span /><span /><span />
      </div>
    );
  }

  return (
    <section>
      <div className="owlet-section-heading">
        <h2>📅 Upcoming Events</h2>
      </div>

      {events.length === 0 ? (
        <div className="owlet-empty">
          <div className="owlet-empty-icon">📅</div>
          <p>No upcoming events — check back soon.</p>
        </div>
      ) : (
        <div className="owlet-events-list">
          {events.map(event => {
            const start = formatDate(event.startDate);
            return (
              <Link key={event.id} to={`/${event.slug}`} className="owlet-event-card">
                <div className="owlet-event-date">
                  <span className="owlet-event-day">{start.day}</span>
                  <span className="owlet-event-num">{start.date}</span>
                  <span className="owlet-event-month">{start.month}</span>
                </div>
                {event.imageUrl && (
                  <div className="owlet-event-image">
                    <img 
                      src={event.imageUrl} 
                      alt={event.imageAlt || event.title} 
                      title={event.imageTitle || undefined}
                    />
                  </div>
                )}
                <div className="owlet-event-body">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <div className="owlet-event-meta">
                    {event.location && (
                      <span>📍 {event.location}</span>
                    )}
                    {event.audience && (
                      <span>👥 {event.audience}</span>
                    )}
                    <span>🕐 {start.time}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
