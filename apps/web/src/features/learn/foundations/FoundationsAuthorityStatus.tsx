import type {
  FoundationsProgressApiResponse,
  FoundationsRewardApiState
} from '@natalnode/contracts';
import type { FoundationsAuthoritySyncStatus } from './authoritative-progress.js';
import type { FoundationsUiMessages } from './ui.js';

interface FoundationsAuthorityStatusProps {
  readonly status: FoundationsAuthoritySyncStatus | null;
  readonly authoritativeProgress: FoundationsProgressApiResponse | null;
  readonly authoritativeReward?: FoundationsRewardApiState | null;
  readonly ui: FoundationsUiMessages;
}

/** Small, factual account/reward status surface shared by Foundations views. */
export default function FoundationsAuthorityStatus({
  status,
  authoritativeProgress,
  authoritativeReward,
  ui
}: FoundationsAuthorityStatusProps) {
  if (status === null) {
    return null;
  }

  if (status === 'unavailable') {
    return (
      <p className="nn-notice nn-notice--research" role="status">
        {ui['learn.foundations.progressSyncUnavailable']}
      </p>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  const reward = authoritativeReward ?? authoritativeProgress?.reward ?? null;
  if (reward?.status === 'GRANTED') {
    return (
      <p className="nn-notice nn-notice--info" role="status">
        <span className="nn-status--success">
          {ui['learn.foundations.rewardGranted']}
        </span>
      </p>
    );
  }

  if (authoritativeProgress === null) {
    return null;
  }

  return (
    <div className="grid gap-2" role="status">
      <p className="nn-notice nn-notice--info">
        {ui['learn.foundations.authoritativeProgress']}
      </p>
      <p className="nn-type-metadata">
        {ui['learn.foundations.rewardPending']}
      </p>
    </div>
  );
}
