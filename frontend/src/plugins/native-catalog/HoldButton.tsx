import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import api from '../../api';

interface Availability {
  total: number;
  available: number;
  checkedOut: number;
  onHold: number;
  hasNativeCopies: boolean;
}

interface HoldButtonProps {
  itemId: number;
  size?: 'small' | 'medium';
}

export default function HoldButton({ itemId, size = 'medium' }: HoldButtonProps) {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${user?.token}` } };

  useEffect(() => {
    api.get(`/catalog/${itemId}/availability`)
      .then(res => setAvailability(res.data))
      .catch(() => setAvailability(null))
      .finally(() => setLoading(false));
  }, [itemId]);

  const handlePlaceHold = async () => {
    if (!user) return;
    setPlacing(true);
    setError('');
    try {
      await api.post(`/holds/item/${itemId}`, {}, authHeader);
      setPlaced(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place hold.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading || !availability || !availability.hasNativeCopies) return null;

  const isSmall = size === 'small';

  return (
    <div className={`owlet-hold-wrap ${isSmall ? 'owlet-hold-wrap-sm' : ''}`}>
      <div className="owlet-availability">
        {availability.available > 0 ? (
          <span className="owlet-availability-badge owlet-availability-available">
            {availability.available} available
          </span>
        ) : (
          <span className="owlet-availability-badge owlet-availability-out">
            All {availability.total} cop{availability.total !== 1 ? 'ies' : 'y'} checked out
          </span>
        )}
        {availability.onHold > 0 && (
          <span className="owlet-availability-badge owlet-availability-hold">
            {availability.onHold} on hold
          </span>
        )}
      </div>

      {placed ? (
        <span className="owlet-hold-success">Reservation placed.</span>
      ) : !user ? (
        <Link
          to="/admin/login"
          className={`owlet-hold-btn owlet-hold-btn-login ${isSmall ? 'owlet-hold-btn-sm' : ''}`}
        >
          Sign in to reserve
        </Link>
      ) : user.role !== 'patron' ? null : (
        <>
          <button
            className={`owlet-hold-btn ${isSmall ? 'owlet-hold-btn-sm' : ''}`}
            onClick={handlePlaceHold}
            disabled={placing}
          >
            {placing ? 'Reserving...' : availability.available > 0 ? 'Reserve Item' : 'Place Hold'}
          </button>
          {error && (
            <p className="owlet-hold-error">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
