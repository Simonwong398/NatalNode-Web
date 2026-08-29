import type {
  NotificationCategory,
  NotificationStateApiResponse,
  RegisterPushSubscriptionApiRequest
} from '@natalnode/contracts';

import {
  createNotificationClient,
  type NotificationClient,
  type NotificationRequestFailure
} from './notification-client.js';
import {
  NOTIFICATION_SERVICE_WORKER_PATH,
  NOTIFICATION_SERVICE_WORKER_SCOPE
} from './notification-sw-policy.js';

const SIGN_IN_PATH = '/auth/sign-in';
const READY_ENABLE_LABEL = 'Enable on this browser';
const READY_DISABLE_LABEL = 'Disable on this browser';
const ENABLE_PENDING_LABEL = 'Enabling notifications…';
const DISABLE_PENDING_LABEL = 'Disabling notifications…';
const CATEGORY_PENDING_LABEL = 'Saving…';
const ENABLED_MESSAGE = 'Notification preference saved for this browser.';
const DISABLED_MESSAGE = 'Notifications disabled on this browser.';
const PARTIAL_ENABLE_MESSAGE =
  'This browser is connected, but the notification preference could not be saved. Try enabling again to finish.';
const PARTIAL_DISABLE_MESSAGE =
  'The account preference was turned off, but this browser subscription could not be fully removed.';
const GENERIC_FAILURE_MESSAGE =
  "We couldn't update notification settings. Please try again.";
const CONFLICT_MESSAGE =
  "This browser's notification subscription is associated with another account. Switch to that account before changing it here.";
const UNAVAILABLE_MESSAGE =
  'Notification settings are currently unavailable. Please try again later.';
const BROWSER_NOTIFICATIONS_UNAVAILABLE_MESSAGE =
  'Browser notifications are currently unavailable.';
const BROWSER_NOTIFICATIONS_UNSUPPORTED_MESSAGE =
  'Browser notifications are not supported by this browser.';
const INVALID_REQUEST_MESSAGE =
  "We couldn't save this notification setting. Please try again.";
const RATE_LIMITED_MESSAGE =
  'Please wait a moment before trying this notification setting again.';
const ROLLBACK_FAILURE_MESSAGE =
  "We couldn't connect this browser. Your existing browser notification state was left unchanged.";

export interface NotificationCategoryControl {
  readonly category: NotificationCategory;
  readonly input: HTMLInputElement;
  readonly state: HTMLElement;
}

export interface NotificationSettingsElements {
  readonly root: HTMLElement;
  readonly loading: HTMLElement;
  readonly content: HTMLElement;
  readonly permissionStatus: HTMLElement;
  readonly connectionStatus: HTMLElement;
  readonly enableButton: HTMLButtonElement;
  readonly disableButton: HTMLButtonElement;
  readonly status: HTMLElement;
  readonly error: HTMLElement;
  readonly categoryControls: readonly NotificationCategoryControl[];
}

export interface BrowserNotificationCapabilities {
  readonly notification: boolean;
  readonly serviceWorker: boolean;
  readonly pushManager: boolean;
  readonly supported: boolean;
}

export interface BrowserNotificationAdapter {
  getPermission(): NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
  getExistingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null>;
  registerServiceWorker(
    scriptUrl: string,
    scope: string
  ): Promise<ServiceWorkerRegistration>;
  getSubscription(
    registration: ServiceWorkerRegistration
  ): Promise<PushSubscription | null>;
  subscribe(
    registration: ServiceWorkerRegistration,
    applicationServerKey: Uint8Array
  ): Promise<PushSubscription>;
  unsubscribe(subscription: PushSubscription): Promise<boolean>;
  toRegistrationRequest(subscription: PushSubscription): RegisterPushSubscriptionApiRequest;
}

export interface NotificationSettingsDependencies {
  readonly client?: NotificationClient;
  readonly browser?: BrowserNotificationAdapter;
  readonly getCapabilities?: () => BrowserNotificationCapabilities;
}

interface BrowserSnapshot {
  readonly capabilities: BrowserNotificationCapabilities;
  readonly permission: NotificationPermission;
  readonly registration: ServiceWorkerRegistration | null;
  readonly subscription: PushSubscription | null;
}

type NotificationSettingsPhase =
  | 'loading'
  | 'ready'
  | 'working'
  | 'unavailable'
  | 'error';

interface NotificationSettingsState {
  readonly phase: NotificationSettingsPhase;
  readonly apiState: NotificationStateApiResponse | null;
  readonly browser: BrowserSnapshot;
  readonly connected: boolean;
}

interface BrowserCapabilitySource {
  readonly Notification?: {
    readonly permission?: NotificationPermission;
    readonly requestPermission?: () => Promise<NotificationPermission>;
  };
  readonly navigator?: Navigator;
  readonly PushManager?: unknown;
}

function browserSource(): BrowserCapabilitySource {
  return globalThis as unknown as BrowserCapabilitySource;
}

export function detectBrowserNotificationCapabilities(
  source: BrowserCapabilitySource = browserSource()
): BrowserNotificationCapabilities {
  const notification =
    typeof source.Notification?.permission === 'string' &&
    typeof source.Notification?.requestPermission === 'function';
  const serviceWorker =
    typeof source.navigator?.serviceWorker?.register === 'function' &&
    typeof source.navigator.serviceWorker.getRegistration === 'function';
  const pushManager = typeof source.PushManager !== 'undefined';

  return {
    notification,
    serviceWorker,
    pushManager,
    supported: notification && serviceWorker && pushManager
  };
}

function getDefaultBrowserAdapter(): BrowserNotificationAdapter {
  return {
    getPermission(): NotificationPermission {
      const permission = browserSource().Notification?.permission;
      return permission === 'granted' || permission === 'denied'
        ? permission
        : 'default';
    },

    requestPermission(): Promise<NotificationPermission> {
      const requestPermission = browserSource().Notification?.requestPermission;

      return typeof requestPermission === 'function'
        ? requestPermission()
        : Promise.resolve('default');
    },

    getExistingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
      const serviceWorker = browserSource().navigator?.serviceWorker;

      return serviceWorker === undefined
        ? Promise.resolve(null)
        : serviceWorker
            .getRegistration(NOTIFICATION_SERVICE_WORKER_SCOPE)
            .then((registration) => registration ?? null);
    },

    async registerServiceWorker(
      scriptUrl,
      scope
    ): Promise<ServiceWorkerRegistration> {
      const serviceWorker = browserSource().navigator?.serviceWorker;

      if (serviceWorker === undefined) {
        throw new Error('Service Worker unavailable.');
      }

      const registration = await serviceWorker.register(scriptUrl, { scope });
      const activeWorker = registration.active;

      if (activeWorker !== null) {
        return registration;
      }

      const pendingWorker = registration.installing ?? registration.waiting;

      if (pendingWorker === null) {
        throw new Error('Service Worker did not become active.');
      }

      await new Promise<void>((resolve, reject) => {
        const handleStateChange = (): void => {
          if (pendingWorker.state === 'activated') {
            pendingWorker.removeEventListener('statechange', handleStateChange);
            resolve();
          } else if (pendingWorker.state === 'redundant') {
            pendingWorker.removeEventListener('statechange', handleStateChange);
            reject(new Error('Service Worker became redundant.'));
          }
        };

        pendingWorker.addEventListener('statechange', handleStateChange);
        handleStateChange();
      });

      return registration;
    },

    getSubscription(
      registration
    ): Promise<PushSubscription | null> {
      return registration.pushManager.getSubscription();
    },

    subscribe(
      registration,
      applicationServerKey
    ): Promise<PushSubscription> {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });
    },

    unsubscribe(subscription): Promise<boolean> {
      return subscription.unsubscribe();
    },

    toRegistrationRequest(subscription): RegisterPushSubscriptionApiRequest {
      return pushSubscriptionToRequest(subscription);
    }
  };
}

export function base64UrlToUint8Array(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error('Application server key is invalid.');
  }

  const padded = value.replace(/-/gu, '+').replace(/_/gu, '/') +
    '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  if (bytes.length !== 65 || bytes[0] !== 0x04) {
    throw new Error('Application server key is invalid.');
  }

  return bytes;
}

export function uint8ArrayToBase64Url(value: Uint8Array): string {
  let binary = '';

  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/u, '');
}

export function pushSubscriptionToRequest(
  subscription: Pick<PushSubscription, 'endpoint' | 'getKey'>
): RegisterPushSubscriptionApiRequest {
  const p256dh = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  if (p256dh === null || auth === null) {
    throw new Error('Push subscription keys are unavailable.');
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: uint8ArrayToBase64Url(new Uint8Array(p256dh)),
      auth: uint8ArrayToBase64Url(new Uint8Array(auth))
    }
  };
}

function unavailableBrowserSnapshot(
  capabilities: BrowserNotificationCapabilities
): BrowserSnapshot {
  return {
    capabilities,
    permission: 'default',
    registration: null,
    subscription: null
  };
}

async function readBrowserSnapshot(
  adapter: BrowserNotificationAdapter,
  capabilities: BrowserNotificationCapabilities
): Promise<BrowserSnapshot> {
  let permission: NotificationPermission = 'default';

  try {
    const reportedPermission = adapter.getPermission();
    permission = reportedPermission === 'granted' || reportedPermission === 'denied'
      ? reportedPermission
      : 'default';
  } catch (_error) {
    permission = 'default';
  }

  if (!capabilities.serviceWorker) {
    return {
      ...unavailableBrowserSnapshot(capabilities),
      permission
    };
  }

  try {
    const registration = await adapter.getExistingServiceWorkerRegistration();
    const subscription = registration === null || !capabilities.pushManager
      ? null
      : await adapter.getSubscription(registration);

    return {
      capabilities,
      permission,
      registration,
      subscription
    };
  } catch (_error) {
    return {
      capabilities,
      permission,
      registration: null,
      subscription: null
    };
  }
}

function clearMessage(element: HTMLElement): void {
  element.hidden = true;
  element.textContent = '';
}

function showStatus(
  elements: NotificationSettingsElements,
  message: string,
  statusClass = 'nn-status--info'
): void {
  elements.error.hidden = true;
  elements.error.textContent = '';
  elements.status.classList.remove(
    'nn-status--success',
    'nn-status--warning',
    'nn-status--error',
    'nn-status--info'
  );
  elements.status.classList.add(statusClass);
  elements.status.textContent = message;
  elements.status.hidden = false;
}

function showError(
  elements: NotificationSettingsElements,
  message: string
): void {
  elements.status.hidden = true;
  elements.status.textContent = '';
  elements.error.textContent = message;
  elements.error.hidden = false;
  elements.error.focus();
}

function showFailure(
  elements: NotificationSettingsElements,
  failure: NotificationRequestFailure,
  focus = true
): void {
  const message = failure.status === 'conflict'
    ? CONFLICT_MESSAGE
    : failure.status === 'unavailable'
      ? UNAVAILABLE_MESSAGE
      : failure.status === 'invalid-request'
        ? INVALID_REQUEST_MESSAGE
        : failure.status === 'rate-limited'
          ? RATE_LIMITED_MESSAGE
          : GENERIC_FAILURE_MESSAGE;

  if (failure.status === 'unauthorized') {
    elements.content.hidden = true;
    window.location.replace(SIGN_IN_PATH);
    return;
  }

  elements.error.textContent = message;
  elements.error.hidden = false;

  if (focus) {
    elements.error.focus();
  }
}

function renderPermission(
  elements: NotificationSettingsElements,
  permission: NotificationPermission,
  capabilities: BrowserNotificationCapabilities
): void {
  if (!capabilities.notification) {
    elements.permissionStatus.textContent = BROWSER_NOTIFICATIONS_UNSUPPORTED_MESSAGE;
    return;
  }

  if (permission === 'granted') {
    elements.permissionStatus.textContent =
      'Browser permission is granted. This does not connect the browser to your NatalNode account.';
  } else if (permission === 'denied') {
    elements.permissionStatus.textContent =
      "Browser permission is blocked. Update this site's browser permission before enabling notifications.";
  } else {
    elements.permissionStatus.textContent =
      'Permission has not been requested on this browser.';
  }
}

function renderCategories(
  elements: NotificationSettingsElements,
  apiState: NotificationStateApiResponse | null,
  disabled: boolean
): void {
  for (const control of elements.categoryControls) {
    const preference = apiState?.categoryPreferences[control.category] ?? null;
    control.input.checked = preference === true;
    control.input.indeterminate = false;
    control.input.removeAttribute('aria-checked');
    control.state.textContent = preference === null
      ? 'Not set'
      : preference
        ? 'On'
        : 'Off';
    control.input.disabled = disabled || apiState === null;
  }
}

function render(
  elements: NotificationSettingsElements,
  state: NotificationSettingsState
): void {
  const apiState = state.apiState;
  const capability = apiState?.webPushCapability;
  const browserSupported = state.browser.capabilities.supported;
  const ready = state.phase === 'ready';
  const working = state.phase === 'working';
  const configured = capability?.configured === true;
  const permission = state.browser.permission;

  elements.root.setAttribute('aria-busy', working || state.phase === 'loading' ? 'true' : 'false');
  elements.loading.hidden = state.phase !== 'loading';
  elements.content.hidden = state.phase === 'loading';

  renderPermission(elements, permission, state.browser.capabilities);

  if (apiState === null) {
    elements.connectionStatus.textContent = UNAVAILABLE_MESSAGE;
  } else if (!configured) {
    elements.connectionStatus.textContent = BROWSER_NOTIFICATIONS_UNAVAILABLE_MESSAGE;
  } else if (!browserSupported) {
    elements.connectionStatus.textContent = BROWSER_NOTIFICATIONS_UNSUPPORTED_MESSAGE;
  } else if (state.connected) {
    elements.connectionStatus.textContent =
      'This browser is connected to this NatalNode account.';
  } else if (permission === 'denied') {
    elements.connectionStatus.textContent =
      'This browser is not connected because browser permission is blocked.';
  } else if (apiState.channelPreferences.WEB_PUSH === true) {
    elements.connectionStatus.textContent =
      'The account preference is on, but this browser is not confirmed as connected.';
  } else {
    elements.connectionStatus.textContent =
      'This browser is not connected to notification settings yet.';
  }

  const canEnable =
    ready &&
    configured &&
    browserSupported &&
    (!state.connected || apiState?.channelPreferences.WEB_PUSH !== true) &&
    permission !== 'denied';
  const enableUnavailable = !canEnable && !working;
  elements.enableButton.hidden =
    state.connected && apiState?.channelPreferences.WEB_PUSH === true;
  elements.enableButton.disabled = !canEnable || working;
  elements.enableButton.classList.toggle('nn-button--primary', !enableUnavailable);
  elements.enableButton.classList.toggle('nn-button--unavailable', enableUnavailable);
  elements.enableButton.textContent = working && !state.connected
    ? ENABLE_PENDING_LABEL
    : READY_ENABLE_LABEL;
  elements.enableButton.title = permission === 'denied'
    ? 'Browser permission is blocked.'
    : '';

  const canDisable =
    apiState !== null &&
    (state.connected ||
      apiState.channelPreferences.WEB_PUSH === true ||
      state.browser.subscription !== null);
  elements.disableButton.hidden = !canDisable;
  elements.disableButton.disabled = !ready || working;
  elements.disableButton.textContent = working
    ? DISABLE_PENDING_LABEL
    : READY_DISABLE_LABEL;

  renderCategories(elements, apiState, !ready || working);
}

function initialState(
  capabilities: BrowserNotificationCapabilities
): NotificationSettingsState {
  return {
    phase: 'loading',
    apiState: null,
    browser: unavailableBrowserSnapshot(capabilities),
    connected: false
  };
}

async function readState(
  client: NotificationClient,
  adapter: BrowserNotificationAdapter,
  getCapabilities: () => BrowserNotificationCapabilities
): Promise<
  | { readonly status: 'success'; readonly state: NotificationStateApiResponse; readonly browser: BrowserSnapshot }
  | NotificationRequestFailure
> {
  const capabilities = getCapabilities();
  const [apiResult, browser] = await Promise.all([
    client.getState(),
    readBrowserSnapshot(adapter, capabilities)
  ]);

  if (apiResult.status !== 'success') {
    return apiResult;
  }

  return { status: 'success', state: apiResult.state, browser };
}

function setWorking(
  elements: NotificationSettingsElements,
  state: NotificationSettingsState,
  working: boolean
): NotificationSettingsState {
  const nextState: NotificationSettingsState = {
    ...state,
    phase: working ? 'working' : 'ready'
  };
  render(elements, nextState);
  return nextState;
}

function applyState(
  elements: NotificationSettingsElements,
  nextApiState: NotificationStateApiResponse,
  nextBrowser: BrowserSnapshot,
  connected: boolean
): NotificationSettingsState {
  const nextState: NotificationSettingsState = {
    phase: 'ready',
    apiState: nextApiState,
    browser: nextBrowser,
    connected
  };
  render(elements, nextState);
  return nextState;
}

async function refresh(
  elements: NotificationSettingsElements,
  state: NotificationSettingsState,
  client: NotificationClient,
  adapter: BrowserNotificationAdapter,
  getCapabilities: () => BrowserNotificationCapabilities,
  preserveConnection: boolean
): Promise<NotificationSettingsState> {
  const result = await readState(client, adapter, getCapabilities);

  if (result.status !== 'success') {
    if (result.status === 'unavailable') {
      const unavailableState = { ...state, phase: 'unavailable' as const };
      render(elements, unavailableState);
      showFailure(elements, result);
      return unavailableState;
    }

    const errorState = { ...state, phase: 'error' as const };
    render(elements, errorState);
    showFailure(elements, result);
    return errorState;
  }

  const connected = preserveConnection &&
    state.connected &&
    result.browser.subscription !== null;

  return applyState(
    elements,
    result.state,
    result.browser,
    connected
  );
}

async function bestEffortUnsubscribe(
  adapter: BrowserNotificationAdapter,
  subscription: PushSubscription
): Promise<void> {
  try {
    await adapter.unsubscribe(subscription);
  } catch (_error) {
    // The browser-created subscription is no longer owned by this page flow.
  }
}

async function enableNotifications(
  elements: NotificationSettingsElements,
  state: NotificationSettingsState,
  client: NotificationClient,
  adapter: BrowserNotificationAdapter,
  getCapabilities: () => BrowserNotificationCapabilities,
  setState: (nextState: NotificationSettingsState) => void
): Promise<void> {
  if (
    state.phase === 'working' ||
    state.browser.permission === 'denied' ||
    state.apiState?.webPushCapability.configured !== true ||
    !state.browser.capabilities.supported ||
    (state.connected && state.apiState.channelPreferences.WEB_PUSH === true)
  ) {
    return;
  }

  clearMessage(elements.status);
  clearMessage(elements.error);
  let workingState = setWorking(elements, state, true);

  try {
    const latest = await readState(client, adapter, getCapabilities);

    if (latest.status !== 'success') {
      showFailure(elements, latest);
      setState({ ...workingState, phase: 'error' });
      return;
    }

    workingState = applyState(
      elements,
      latest.state,
      latest.browser,
      false
    );

    if (!latest.state.webPushCapability.configured) {
      showError(elements, UNAVAILABLE_MESSAGE);
      setState({ ...workingState, phase: 'unavailable' });
      return;
    }

    if (!latest.browser.capabilities.supported) {
      showError(elements, BROWSER_NOTIFICATIONS_UNSUPPORTED_MESSAGE);
      setState({ ...workingState, phase: 'error' });
      return;
    }

    let permission = latest.browser.permission;

    if (permission === 'default') {
      permission = await adapter.requestPermission();
    }

    if (permission !== 'granted') {
      const browser = { ...latest.browser, permission };
      const nextState = applyState(
        elements,
        latest.state,
        browser,
        false
      );
      setState(nextState);
      return;
    }

    const registration = await adapter.registerServiceWorker(
      NOTIFICATION_SERVICE_WORKER_PATH,
      NOTIFICATION_SERVICE_WORKER_SCOPE
    );
    let subscription = await adapter.getSubscription(registration);
    let createdByThisAttempt = false;

    if (subscription === null) {
      const applicationServerKey = base64UrlToUint8Array(
        latest.state.webPushCapability.applicationServerKey as string
      );
      subscription = await adapter.subscribe(registration, applicationServerKey);
      createdByThisAttempt = true;
    }

    let registrationRequest: RegisterPushSubscriptionApiRequest;

    try {
      registrationRequest = adapter.toRegistrationRequest(subscription);
    } catch (_error) {
      if (createdByThisAttempt) {
        await bestEffortUnsubscribe(adapter, subscription);
      }
      showError(elements, ROLLBACK_FAILURE_MESSAGE);
      setState({ ...workingState, phase: 'error' });
      return;
    }

    const registrationResult = await client.registerPushSubscription(
      registrationRequest
    );

    if (registrationResult.status !== 'success') {
      if (createdByThisAttempt) {
        await bestEffortUnsubscribe(adapter, subscription);
      }
      showFailure(elements, registrationResult);
      setState({ ...workingState, phase: 'error' });
      return;
    }

    const connectedBrowser = {
      ...latest.browser,
      permission,
      registration,
      subscription
    };
    workingState = applyState(
      elements,
      latest.state,
      connectedBrowser,
      true
    );

    const preferenceResult = await client.setChannelPreference(true);

    if (preferenceResult.status !== 'success') {
      if (preferenceResult.status === 'unauthorized') {
        setState({ ...workingState, phase: 'error' });
        showFailure(elements, preferenceResult);
      } else {
        showError(elements, PARTIAL_ENABLE_MESSAGE);
        setState({ ...workingState, phase: 'ready' });
      }
      return;
    }

    const refreshed = await refresh(
      elements,
      workingState,
      client,
      adapter,
      getCapabilities,
      true
    );
    showStatus(elements, ENABLED_MESSAGE, 'nn-status--success');
    setState(refreshed);
  } catch (_error) {
    showError(elements, GENERIC_FAILURE_MESSAGE);
    setState({ ...workingState, phase: 'error' });
  }
}

async function disableNotifications(
  elements: NotificationSettingsElements,
  state: NotificationSettingsState,
  client: NotificationClient,
  adapter: BrowserNotificationAdapter,
  getCapabilities: () => BrowserNotificationCapabilities,
  setState: (nextState: NotificationSettingsState) => void
): Promise<void> {
  if (state.phase === 'working' || state.apiState === null) {
    return;
  }

  clearMessage(elements.status);
  clearMessage(elements.error);
  let workingState = setWorking(elements, state, true);

  try {
    const latest = await readState(client, adapter, getCapabilities);

    if (latest.status !== 'success') {
      showFailure(elements, latest);
      setState({ ...workingState, phase: 'error' });
      return;
    }

    workingState = applyState(
      elements,
      latest.state,
      latest.browser,
      state.connected && latest.browser.subscription !== null
    );

    let subscription = latest.browser.subscription;

    if (subscription !== null) {
      let registrationRequest: RegisterPushSubscriptionApiRequest;

      try {
        registrationRequest = adapter.toRegistrationRequest(subscription);
      } catch (_error) {
        showError(elements, GENERIC_FAILURE_MESSAGE);
        setState({ ...workingState, phase: 'error' });
        return;
      }

      const registrationResult = await client.registerPushSubscription(
        registrationRequest
      );

      if (registrationResult.status !== 'success') {
        showFailure(elements, registrationResult);
        setState({ ...workingState, phase: 'error' });
        return;
      }

      const removalResult = await client.removePushSubscription(
        registrationResult.subscription.subscriptionId
      );

      if (removalResult.status !== 'success') {
        showFailure(elements, removalResult);
        setState({ ...workingState, phase: 'error' });
        return;
      }

      let browserUnsubscribed = false;

      try {
        browserUnsubscribed = await adapter.unsubscribe(subscription);
      } catch (_error) {
        browserUnsubscribed = false;
      }

      const preferenceResult = await client.setChannelPreference(false);

      if (preferenceResult.status !== 'success') {
        if (preferenceResult.status === 'unauthorized') {
          setState({ ...workingState, phase: 'error', connected: false });
          showFailure(elements, preferenceResult);
        } else {
          showError(elements, PARTIAL_DISABLE_MESSAGE);
          setState({ ...workingState, phase: 'ready', connected: false });
        }
        return;
      }

      const refreshed = await refresh(
        elements,
        { ...workingState, connected: false },
        client,
        adapter,
        getCapabilities,
        false
      );

      if (!browserUnsubscribed) {
        showError(elements, PARTIAL_DISABLE_MESSAGE);
      } else {
        showStatus(elements, DISABLED_MESSAGE, 'nn-status--success');
      }
      setState(refreshed);
      return;
    }

    const preferenceResult = await client.setChannelPreference(false);

    if (preferenceResult.status !== 'success') {
      showFailure(elements, preferenceResult);
      setState({ ...workingState, phase: 'error' });
      return;
    }

    const refreshed = await refresh(
      elements,
      { ...workingState, connected: false },
      client,
      adapter,
      getCapabilities,
      false
    );
    showStatus(elements, DISABLED_MESSAGE, 'nn-status--success');
    setState(refreshed);
  } catch (_error) {
    showError(elements, GENERIC_FAILURE_MESSAGE);
    setState({ ...workingState, phase: 'error' });
  }
}

async function setCategoryPreference(
  elements: NotificationSettingsElements,
  state: NotificationSettingsState,
  control: NotificationCategoryControl,
  client: NotificationClient,
  adapter: BrowserNotificationAdapter,
  getCapabilities: () => BrowserNotificationCapabilities,
  setState: (nextState: NotificationSettingsState) => void
): Promise<void> {
  if (state.phase === 'working' || state.apiState === null) {
    return;
  }

  clearMessage(elements.status);
  clearMessage(elements.error);
  const desiredValue = control.input.checked;
  const workingState = setWorking(elements, state, true);
  control.state.textContent = CATEGORY_PENDING_LABEL;

  const result = await client.setCategoryPreference(
    control.category,
    desiredValue
  );

  if (result.status !== 'success') {
    showFailure(elements, result);
    const refreshed = await refresh(
      elements,
      workingState,
      client,
      adapter,
      getCapabilities,
      false
    );
    setState(refreshed);
    return;
  }

  const refreshed = await refresh(
    elements,
    workingState,
    client,
    adapter,
    getCapabilities,
    false
  );
  showStatus(elements, 'Notification category preference saved.', 'nn-status--success');
  setState(refreshed);
}

export function initializeNotificationSettings(
  elements: NotificationSettingsElements,
  dependencies: NotificationSettingsDependencies = {}
): void {
  const client = dependencies.client ?? createNotificationClient();
  const adapter = dependencies.browser ?? getDefaultBrowserAdapter();
  const getCapabilities =
    dependencies.getCapabilities ?? (() => detectBrowserNotificationCapabilities());
  let state = initialState(getCapabilities());

  const setState = (nextState: NotificationSettingsState): void => {
    state = nextState;
    render(elements, state);
  };

  render(elements, state);

  elements.enableButton.addEventListener('click', () => {
    void enableNotifications(
      elements,
      state,
      client,
      adapter,
      getCapabilities,
      setState
    );
  });

  elements.disableButton.addEventListener('click', () => {
    void disableNotifications(
      elements,
      state,
      client,
      adapter,
      getCapabilities,
      setState
    );
  });

  for (const control of elements.categoryControls) {
    control.input.addEventListener('change', () => {
      void setCategoryPreference(
        elements,
        state,
        control,
        client,
        adapter,
        getCapabilities,
        setState
      );
    });
  }

  void (async () => {
    const result = await readState(client, adapter, getCapabilities);

    if (result.status !== 'success') {
      const failureState: NotificationSettingsState = {
        phase: result.status === 'unavailable' ? 'unavailable' : 'error',
        apiState: null,
        browser: {
          ...unavailableBrowserSnapshot(getCapabilities()),
          permission: 'default'
        },
        connected: false
      };
      setState(failureState);
      showFailure(elements, result);
      return;
    }

    setState({
      phase: 'ready',
      apiState: result.state,
      browser: result.browser,
      connected: false
    });
  })();
}
