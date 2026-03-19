import { useState } from 'react';
import MediaLibrary from './MediaLibrary';

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  alt?: string;
}

interface MediaPickerProps {
  onSelect: (url: string, item: MediaItem) => void;
  onClose: () => void;
}

export default function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const [selected, setSelected] = useState<{ url: string; item: MediaItem } | null>(null);

  const handleSelect = (url: string, item: MediaItem) => {
    setSelected({ url, item });
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected.url, selected.item);
      onClose();
    }
  };

  return (
    <div className="owlet-modal-overlay" onClick={onClose}>
      <div className="owlet-modal" onClick={e => e.stopPropagation()}>
        <div className="owlet-modal-header">
          <h2>📁 Media Library</h2>
          <button className="owlet-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="owlet-modal-body">
          <MediaLibrary
            pickerMode
            onSelect={handleSelect}
          />
        </div>

        <div className="owlet-modal-footer">
          {selected && (
            <p className="owlet-modal-selected">
              ✓ Selected: <strong>{selected.item.originalName}</strong>
            </p>
          )}
          <div className="owlet-form-actions">
            <button
              className="owlet-btn owlet-btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="owlet-btn owlet-btn-primary"
              style={{ width: 'auto' }}
              onClick={handleConfirm}
              disabled={!selected}
            >
              Use this file
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
