import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../../api';
import MediaPicker from '../media/MediaPicker';

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  alt?: string;
}

interface ImageUploadProps {
  currentUrl?: string;
  currentAlt?: string;
  currentTitle?: string;
  onUpload: (url: string, alt?: string, title?: string) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  showAlt?: boolean;
  showTitle?: boolean;
}

export default function ImageUpload({
  currentUrl,
  currentAlt,
  currentTitle,
  onUpload,
  label = 'Photo',
  size = 'medium',
  showAlt = true,
  showTitle = false,
}: ImageUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [alt, setAlt] = useState(currentAlt || '');
  const [title, setTitle] = useState(currentTitle || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dimensions = { small: 64, medium: 100, large: 140 }[size];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/media/upload', formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setPreview(res.data.url);
      onUpload(res.data.url, alt, title);
    } catch {
      setError('Upload failed. Please try again.');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handlePickerSelect = (url: string, item: MediaItem) => {
    setPreview(url);
    // Pre-fill alt from media library if available and alt is empty
    if (item.alt && !alt) setAlt(item.alt);
    onUpload(url, alt || item.alt, title);
    setShowPicker(false);
  };

  const handleMetaChange = (newAlt: string, newTitle: string) => {
    setAlt(newAlt);
    setTitle(newTitle);
    if (preview) onUpload(preview, newAlt, newTitle);
  };

  return (
    <>
      <div className="owlet-image-upload">
        <label className="owlet-field-label">{label}</label>
        <div className="owlet-image-upload-inner">
          <div
            className="owlet-image-preview"
            style={{ width: dimensions, height: dimensions }}
            onClick={() => inputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt={alt || 'Preview'} />
            ) : (
              <div className="owlet-image-placeholder"><span>📷</span></div>
            )}
            {uploading && (
              <div className="owlet-image-uploading">
                <div className="owlet-loading" style={{ padding: 0 }}>
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          <div className="owlet-image-upload-actions">
            <button
              type="button"
              className="owlet-btn-action owlet-btn-edit"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : '📤 Upload new'}
            </button>
            <button
              type="button"
              className="owlet-btn-action owlet-btn-edit"
              onClick={() => setShowPicker(true)}
              disabled={uploading}
            >
              📁 Browse library
            </button>
            {preview && (
              <button
                type="button"
                className="owlet-btn-action owlet-btn-delete"
                onClick={() => {
                  setPreview(null);
                  setAlt('');
                  setTitle('');
                  onUpload('', '', '');
                }}
                disabled={uploading}
              >
                🗑️ Remove
              </button>
            )}
            <p className="owlet-image-hint">Max 20MB</p>
          </div>
        </div>

        {/* Alt and title fields — only show when an image is selected */}
        {preview && (showAlt || showTitle) && (
          <div className="owlet-image-meta">
            {showAlt && (
              <div className="owlet-field">
                <label>Alt Text <span style={{ fontWeight: 300, textTransform: 'none', fontSize: '0.75rem' }}>(describes the image for accessibility)</span></label>
                <input
                  value={alt}
                  onChange={e => handleMetaChange(e.target.value, title)}
                  placeholder="A photo of the library entrance..."
                />
              </div>
            )}
            {showTitle && (
              <div className="owlet-field">
                <label>Title / Caption</label>
                <input
                  value={title}
                  onChange={e => handleMetaChange(alt, e.target.value)}
                  placeholder="Optional caption or title..."
                />
              </div>
            )}
          </div>
        )}

        {error && <p className="owlet-login-error">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {showPicker && (
        <MediaPicker
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
