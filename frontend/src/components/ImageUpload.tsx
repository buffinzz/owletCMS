import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api';

interface ImageUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ImageUpload({
  currentUrl,
  onUpload,
  label = 'Photo',
  size = 'medium',
}: ImageUploadProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const dimensions = {
    small: 64,
    medium: 100,
    large: 140,
  }[size];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to server
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

      onUpload(`http://localhost:3000${res.data.url}`);
    } catch {
      setError('Upload failed. Please try again.');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="owlet-image-upload">
      <label className="owlet-field-label">{label}</label>
      <div className="owlet-image-upload-inner">
        <div
          className="owlet-image-preview"
          style={{ width: dimensions, height: dimensions }}
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" />
          ) : (
            <div className="owlet-image-placeholder">
              <span>📷</span>
            </div>
          )}
          {uploading && (
            <div className="owlet-image-uploading">
              <div className="owlet-loading" style={{ padding: '0' }}>
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
            {uploading ? 'Uploading...' : preview ? '🔄 Change' : '📷 Upload'}
          </button>
          {preview && (
            <button
              type="button"
              className="owlet-btn-action owlet-btn-delete"
              onClick={() => { setPreview(null); onUpload(''); }}
              disabled={uploading}
            >
              🗑️ Remove
            </button>
          )}
          <p className="owlet-image-hint">JPG, PNG, GIF, WebP · Max 5MB</p>
        </div>
      </div>
      {error && <p className="owlet-login-error">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
