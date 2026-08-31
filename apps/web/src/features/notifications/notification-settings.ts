import type {
  NotificationCategory,
  NotificationStateApiResponse,
  RegisterPushSubscriptionApiRequest
} from '@natalnode/contracts';
import { getLocalizedCurrentPath } from '../../lib/localization.js';
import { getDocumentUiMessage } from '../../lib/ui-catalog.js';
import type { UiMessageKey } from '../../lib/ui-catalog.js';

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

function ui(key: UiMessageKey): string {
  return getDocumentUiMessage(key);
}

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
    ? ui('account.notifications.conflict')
    : failure.status === 'unavailable'
      ? ui('account.notifications.unavailable')
      : failure.status === 'invalid-request'
        ? ui('account.notifications.invalidRequest')
        : failure.status === 'rate-limited'
          ? ui('account.notifications.rateLimited')
          : ui('account.notifications.genericError');

  if (failure.status === 'unauthorized') {
    elements.content.hidden = true;
    window.location.replace(getLocalizedCurrentPath(window.location.pathname, SIGN_IN_PATH));
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
    elements.permissionStatus.textContent = ui('account.notifications.browserUnsupported');
    return;
  }

  if (permission === 'granted') {
    elements.permissionStatus.textContent =
      ui('account.notifications.permissionGranted');
  } else if (permission === 'denied') {
    elements.permissionStatus.textContent =
      ui('account.notifications.permissionBlocked');
  } else {
    elements.permissionStatus.textContent =
      ui('account.notifications.permissionNotRequested');
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
      ? ui('account.notifications.category.notSet')
      : preference
        ? ui('account.notifications.category.on')
        : ui('account.notifications.category.off');
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
    elements.connectionStatus.textContent = ui('account.notifications.unavailable');
  } else if (!configured) {
    elements.connectionStatus.textContent = ui('account.notifications.browserUnavailable');
  } else if (!browserSupported) {
    elements.connectionStatus.textContent = ui('account.notifications.browserUnsupported');
  } else if (state.connected) {
    elements.connectionStatus.textContent =
      ui('account.notifications.connected');
  } else if (permission === 'denied') {
    elements.connectionStatus.textContent =
      ui('account.notifications.connectionBlocked');
  } else if (apiState.channelPreferences.WEB_PUSH === true) {
    elements.connectionStatus.textContent =
      ui('account.notifications.preferenceOnNotConnected');
  } else {
    elements.connectionStatus.textContent =
      ui('account.notifications.notConnected');
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
    ? ui('account.notifications.enabling')
    : ui('account.notifications.enable');
  elements.enableButton.title = permission === 'denied'
    ? ui('account.notifications.permissionBlocked')
    : '';

  const canDisable =
    apiState !== null &&
    (state.connected ||
      apiState.channelPreferences.WEB_PUSH === true ||
      state.browser.subscription !== null);
  elements.disableButton.hidden = !canDisable;
  elements.disableButton.disabled = !ready || working;
  elements.disableButton.textContent = working
    ? ui('account.notifications.disabling')
    : ui('account.notifications.disable');

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
      showError(elements, ui('account.notifications.unavailable'));
      setState({ ...workingState, phase: 'unavailable' });
      return;
    }

    if (!latest.browser.capabilities.supported) {
      showError(elements, ui('account.notifications.browserUnsupported'));
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
      showError(elements, ui('account.notifications.rollbackFailure'));
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
        showError(elements, ui('account.notifications.partialEnable'));
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
    showStatus(elements, ui('account.notifications.enabled'), 'nn-status--success');
    setState(refreshed);
  } catch (_error) {
    showError(elements, ui('account.notifications.genericError'));
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
        showError(elements, ui('account.notifications.genericError'));
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
          showError(elements, ui('account.notifications.partialDisable'));
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
        showError(elements, ui('account.notifications.partialDisable'));
      } else {
        showStatus(elements, ui('account.notifications.disabled'), 'nn-status--success');
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
    showStatus(elements, ui('account.notifications.disabled'), 'nn-status--success');
    setState(refreshed);
  } catch (_error) {
    showError(elements, ui('account.notifications.genericError'));
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
  control.state.textContent = ui('account.notifications.category.saving');

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
  showStatus(elements, ui('account.notifications.categorySaved'), 'nn-status--success');
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
