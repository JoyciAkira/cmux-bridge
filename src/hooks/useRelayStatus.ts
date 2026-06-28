import { useState, useEffect } from 'react';
import { getRelayClient, RelayStatus } from '../services/relay';

/** Subscribes to live status updates from a RelayClient singleton. */
export function useRelayStatus(macId: string): RelayStatus {
  const client = getRelayClient(macId);
  const [status, setStatus] = useState<RelayStatus>(client.status);

  useEffect(() => {
    setStatus(client.status);
    client.on('status', setStatus);
    return () => { client.off('status', setStatus); };
  }, [macId, client]);

  return status;
}
