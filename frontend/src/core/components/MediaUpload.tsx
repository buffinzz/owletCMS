import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../../api';
import MediaPicker from '../media/MediaPicker';
import type { FilterType } from '../media/MediaLibrary';

interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  title?: string;
  description?: string;
  alt?: string;
}

interface MediaUploadProps {
  currentUrl?: string;
  onSelect: (url: string, item?: MediaItem) => void;
  label?: string;
  mediaType?: Exclude<FilterType, 'all' | 'image'> | 'image' | 'all';
}

const TYPE_META: Record<MediaUploadProps['mediaType'], { icon: string; accept: string; noun: string }> = {
  all: { icon: 'FILE', accept: '*/*', noun: 'file' },
  image: { icon: 'IMG', accept: 'image/*', noun: 'image' },
  document: {
    icon: 'DOC',
    accept: '.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    noun: 'document',
  },
  audio: { icon: 'AUD', accept: 'audio/*', noun: 'audio file' },
  video: { icon: 'VID', accept: 'video/*', noun: 'video' },
};

export default function MediaUpload({
  currentUrl,
  onSelect,
  label = 'Media',
  mediaType = 'all',
}: MediaUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const meta = useMemo(() => TYPE_META[mediaType], [mediaType]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      onSelect(res.data.url, {
        id: res.data.id,
        filename: res.data.filename,
        originalName: res.data.originalName,
        mimetype: res.data.mimetype,
        size: res.data.size,
      });
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePickerSelect = (url: string, item: MediaItem) => {
    setPreview(url);
    onSelect(url, item);
    setShowPicker(false);
  };

  return (
    <>
      <div className="owlet-image-upload">
        <label className="owlet-field-label">{label}</label>
        <div className="owlet-image-upload-inner">
          <div
            className="owlet-image-preview"
            style={{ width: 100, height: 100, cursor: 'default' }}
          >
            {preview ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--purple-deep)',
                  background: 'var(--white)',
                }}
              >
                {meta.icon}
              </div>
            ) : (
              <div className="owlet-image-placeholder"><span>{meta.icon}</span></div>
            )}
          </div>

          <div className="owlet-image-upload-actions">
            <button
              type="button"
              className="owlet-btn-action owlet-btn-edit"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${meta.noun}`}
            </button>
            <button
              type="button"
              className="owlet-btn-action owlet-btn-edit"
              onClick={() => setShowPicker(true)}
              disabled={uploading}
            >
              Browse library
            </button>
            {preview && (
              <button
                type="button"
                className="owlet-btn-action owlet-btn-delete"
                onClick={() => {
                  setPreview('');
                  onSelect('');
                }}
                disabled={uploading}
              >
                Remove
              </button>
            )}
            <p className="owlet-image-hint">Max 20MB</p>
          </div>
        </div>

        {preview && (
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-light)', marginTop: '0.4rem', wordBreak: 'break-all' }}>
            {preview}
          </p>
        )}

        {error && <p className="owlet-login-error">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept={meta.accept}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {showPicker && (
        <MediaPicker
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
          initialFilter={mediaType === 'all' ? 'all' : mediaType}
          lockedFilter={mediaType !== 'all'}
        />
      )}
    </>
  );
}
