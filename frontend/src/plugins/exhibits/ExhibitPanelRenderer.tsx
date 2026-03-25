interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

interface Panel {
  id: number;
  title?: string;
  content?: string;
  type: string;
  mediaUrl?: string;
  mediaAlt?: string;
  mediaCaption?: string;
  timelineItems?: TimelineItem[];
  mapLat?: number;
  mapLng?: number;
  mapZoom?: number;
  mapLabel?: string;
  collectionId?: number;
}

function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function renderMarkdown(text: string): string {
  // Very simple markdown — bold, italic, links, paragraphs
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export default function ExhibitPanelRenderer({ panel }: { panel: Panel }) {
  return (
    <div className="owlet-exhibit-panel">
      {panel.title && (
        <h2 className="owlet-exhibit-panel-title">{panel.title}</h2>
      )}

      {/* ── TEXT ── */}
      {panel.type === 'text' && panel.content && (
        <div
          className="owlet-exhibit-text"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(panel.content) }}
        />
      )}

      {/* ── IMAGE ── */}
      {panel.type === 'image' && panel.mediaUrl && (
        <figure className="owlet-exhibit-figure">
          <img
            src={panel.mediaUrl}
            alt={panel.mediaAlt || panel.title || ''}
            className="owlet-exhibit-image"
          />
          {(panel.content || panel.mediaCaption) && (
            <figcaption className="owlet-exhibit-caption">
              {panel.content || panel.mediaCaption}
            </figcaption>
          )}
        </figure>
      )}

      {/* ── VIDEO ── */}
      {panel.type === 'video' && panel.mediaUrl && (
        <div className="owlet-exhibit-video-wrap">
          {getYoutubeEmbedUrl(panel.mediaUrl) ? (
            <iframe
              src={getYoutubeEmbedUrl(panel.mediaUrl)!}
              title={panel.title || 'Video'}
              allowFullScreen
              className="owlet-exhibit-video"
            />
          ) : (
            <video controls className="owlet-exhibit-video-native">
              <source src={panel.mediaUrl} />
            </video>
          )}
          {panel.content && (
            <p className="owlet-exhibit-caption">{panel.content}</p>
          )}
        </div>
      )}

      {/* ── AUDIO ── */}
      {panel.type === 'audio' && panel.mediaUrl && (
        <div className="owlet-exhibit-audio-wrap">
          <audio controls className="owlet-exhibit-audio">
            <source src={panel.mediaUrl} />
          </audio>
          {panel.content && (
            <p className="owlet-exhibit-caption">{panel.content}</p>
          )}
        </div>
      )}

      {/* ── TIMELINE ── */}
      {panel.type === 'timeline' && panel.timelineItems && panel.timelineItems.length > 0 && (
        <div className="owlet-exhibit-timeline">
          {panel.timelineItems.map((item, idx) => (
            <div key={idx} className="owlet-exhibit-timeline-item">
              <div className="owlet-exhibit-timeline-marker">
                <div className="owlet-exhibit-timeline-dot" />
                {idx < panel.timelineItems!.length - 1 && (
                  <div className="owlet-exhibit-timeline-line" />
                )}
              </div>
              <div className="owlet-exhibit-timeline-content">
                <span className="owlet-exhibit-timeline-date">{item.date}</span>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title}
                    className="owlet-exhibit-timeline-image" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAP ── */}
      {panel.type === 'map' && panel.mapLat && panel.mapLng && (
        <div className="owlet-exhibit-map-wrap">
          <iframe
            title={panel.mapLabel || 'Map'}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${panel.mapLng - 0.01},${panel.mapLat - 0.01},${panel.mapLng + 0.01},${panel.mapLat + 0.01}&layer=mapnik&marker=${panel.mapLat},${panel.mapLng}`}
            className="owlet-exhibit-map"
          />
          {panel.mapLabel && (
            <p className="owlet-exhibit-caption">📍 {panel.mapLabel}</p>
          )}
        </div>
      )}

      {/* ── COLLECTION ── */}
      {panel.type === 'collection' && panel.collectionId && (
        <CollectionPanelRenderer
          collectionId={panel.collectionId}
          description={panel.content}
        />
      )}
    </div>
  );
}

// Separate component to load collection data
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function CollectionPanelRenderer({ collectionId, description }: { collectionId: number; description?: string }) {
  const [collection, setCollection] = useState<any>(null);

  useEffect(() => {
    api.get(`/collections/id/${collectionId}`)
      .then(res => setCollection(res.data))
      .catch(() => {});
  }, [collectionId]);

  if (!collection) return null;

  return (
    <div className="owlet-exhibit-collection">
      <div className="owlet-exhibit-collection-header">
        <h3>{collection.name}</h3>
        {description && <p>{description}</p>}
        <Link to={`/collections/${collection.slug}`} className="owlet-exhibit-collection-link">
          Browse collection →
        </Link>
      </div>
    </div>
  );
}
