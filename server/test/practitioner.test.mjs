import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createApp } from '../dist/app/create-app.js';
import {
  addPractitionerRetentionDays,
  PRACTITIONER_FINAL_APPLICATION_RETENTION_DAYS,
  PRACTITIONER_REJECTED_REAPPLICATION_COOLDOWN_DAYS,
  PRACTITIONER_REVOKED_REAPPLICATION_COOLDOWN_DAYS,
  PRACTITIONER_PROFILE_HISTORY_RETENTION_DAYS,
  PRACTITIONER_REVIEW_AUDIT_RETENTION_DAYS,
  PRACTITIONER_REVIEW_QUEUE_STATUSES,
  containsDisallowedProfessionalClaim,
  practitionerApplicationTransitionIsAllowed
} from '../dist/practitioner/practitioner-domain.js';
import {
  normalizeCreatePractitionerReportRequest,
  normalizePractitionerApplicationRequest,
  normalizePractitionerProfileRevisionRequest,
  normalizePractitionerProfileRevisionReviewRequest,
  parsePractitionerReviewQueueStatus
} from '../dist/app/validation/practitioner.js';
import {
  InMemoryP0StagingRateLimiter,
  P0_STAGING_RATE_LIMIT_POLICIES
} from '../dist/app/security/api-rate-limiting.js';
import { runPractitionerRetentionMaintenanceWithRuntime } from '../dist/maintenance/practitioner-retention-maintenance.js';

const PUBLIC_WEB_ORIGIN = 'https://natalnode.test';
const NOW = '2026-08-31T12:00:00.000Z';

function validApplication(overrides = {}) {
  return {
    requestedDisplayName: 'Aster Vale',
    professionalHeadline: 'Natal astrology educator',
    bio: 'I explain chart symbolism through clear, careful educational writing.',
    practiceAreas: ['NATAL_ASTROLOGY'],
    languages: ['en'],
    countryOrRegion: 'Canada',
    websiteUrl: 'https://example.test/practice',
    practiceStatement: 'My practice is descriptive, reflective, and educational.',
    evidenceUrls: ['https://example.test/about'],
    consentToPublicProfile: true,
    ...overrides
  };
}

function validRevision(overrides = {}) {
  return {
    displayName: 'Aster Vale',
    professionalHeadline: 'Natal astrology educator',
    bio: 'I explain chart symbolism through clear, careful educational writing.',
    practiceAreas: ['NATAL_ASTROLOGY'],
    languages: ['en'],
    countryOrRegion: 'Canada',
    websiteUrl: 'https://example.test/practice',
    ...overrides
  };
}

function cloneApplication(application) {
  return {
    ...application,
    practiceAreas: [...application.practiceAreas],
    languages: [...application.languages],
    evidenceUrls: [...application.evidenceUrls]
  };
}

function cloneProfile(profile) {
  return {
    ...profile,
    practiceAreas: [...profile.practiceAreas],
    languages: [...profile.languages]
  };
}

class InMemoryPractitionerRepository {
  constructor() {
    this.applications = new Map();
    this.profiles = new Map();
    this.revisions = new Map();
    this.events = [];
    this.reports = new Map();
    this.reviewers = new Set(['reviewer-user']);
    this.contributions = new Map();
  }

  async getApplicationForUser(userId) {
    return [...this.applications.values()]
      .filter((application) => application.userId === userId)
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0] ?? null;
  }

  async createApplication({ applicationId, userId, application, submittedAt }) {
    const active = [...this.applications.values()].some(
      (candidate) => candidate.userId === userId &&
        ['SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED'].includes(candidate.status)
    );
    if (active) {
      return { outcome: 'duplicate' };
    }

    const latestFinal = [...this.applications.values()]
      .filter((candidate) => candidate.userId === userId &&
        ['REJECTED', 'WITHDRAWN', 'REVOKED'].includes(candidate.status))
      .sort((left, right) => right.finalizedAt.localeCompare(left.finalizedAt))[0];
    if (latestFinal !== undefined) {
      if (latestFinal.retentionHold !== 'NONE') {
        return { outcome: 'duplicate' };
      }
      const days = latestFinal.status === 'REJECTED'
        ? PRACTITIONER_REJECTED_REAPPLICATION_COOLDOWN_DAYS
        : latestFinal.status === 'REVOKED'
          ? PRACTITIONER_REVOKED_REAPPLICATION_COOLDOWN_DAYS
          : 0;
      const availableAt = addPractitionerRetentionDays(latestFinal.finalizedAt, days);
      if (submittedAt < availableAt) {
        return { outcome: 'cooldown', availableAt };
      }
    }

    const record = {
      ...cloneApplication(application),
      applicationId,
      userId,
      submittedAt,
      status: 'SUBMITTED',
      version: 1,
      finalizedAt: null,
      purgeEligibleAt: null,
      retentionHold: 'NONE',
      accountDeletedAt: null
    };
    this.applications.set(applicationId, record);
    return { outcome: 'created', application: cloneApplication(record) };
  }

  async resubmitApplication({ applicationId, userId, application, submittedAt }) {
    const existing = this.applications.get(applicationId);
    if (existing === undefined || existing.userId !== userId) {
      return { outcome: 'not-found' };
    }
    if (existing.status !== 'CHANGES_REQUESTED') {
      return { outcome: 'not-found' };
    }
    const updated = {
      ...cloneApplication(application),
      applicationId,
      userId,
      submittedAt,
      status: 'SUBMITTED',
      version: existing.version + 1,
      finalizedAt: null,
      purgeEligibleAt: null,
      retentionHold: existing.retentionHold,
      accountDeletedAt: existing.accountDeletedAt
    };
    this.applications.set(applicationId, updated);
    return { outcome: 'updated', application: cloneApplication(updated) };
  }

  async withdrawApplication({ applicationId, userId, finalizedAt, purgeEligibleAt }) {
    const existing = this.applications.get(applicationId);
    if (existing === undefined || existing.userId !== userId) {
      return { outcome: 'not-found' };
    }
    if (!['SUBMITTED', 'CHANGES_REQUESTED'].includes(existing.status)) {
      return { outcome: 'not-found' };
    }
    const updated = {
      ...existing,
      status: 'WITHDRAWN',
      version: existing.version + 1,
      finalizedAt,
      purgeEligibleAt
    };
    this.applications.set(applicationId, updated);
    return { outcome: 'updated', application: cloneApplication(updated) };
  }

  async isReviewer(userId) {
    return this.reviewers.has(userId);
  }

  async listReviewApplications(status) {
    const statuses = status === null
      ? ['SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED']
      : [status];
    return [...this.applications.values()]
      .filter((application) => statuses.includes(application.status))
      .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt))
      .map(cloneApplication);
  }

  async listReviewEvents(applicationId) {
    return this.events
      .filter((event) => event.applicationId === applicationId)
      .map((event) => ({ ...event }));
  }

  async listPendingProfileRevisions() {
    return [...this.revisions.values()]
      .filter((revision) => revision.status === 'PENDING')
      .map((revision) => ({
        ...revision,
        applicationVersion: this.applications.get(revision.applicationId)?.version ?? 1
      }));
  }

  async reviewApplication({
    reviewerUserId,
    applicationId,
    action,
    reasonCode,
    note,
    version,
    reviewEventId,
    practitionerId,
    reviewedAt,
    purgeEligibleAt
  }) {
    if (!this.reviewers.has(reviewerUserId)) {
      return { outcome: 'forbidden' };
    }
    const existing = this.applications.get(applicationId);
    if (existing === undefined) {
      return { outcome: 'not-found' };
    }
    if (existing.userId === reviewerUserId) {
      return { outcome: 'forbidden' };
    }
    if (existing.version !== version) {
      return { outcome: 'stale' };
    }

    const nextStatus = action === 'APPROVE'
      ? 'APPROVED'
      : action === 'REQUEST_CHANGES'
        ? 'CHANGES_REQUESTED'
        : action === 'REJECT'
          ? 'REJECTED'
          : 'REVOKED';
    if (!practitionerApplicationTransitionIsAllowed(existing.status, nextStatus)) {
      return { outcome: 'invalid-transition' };
    }

    if (action === 'APPROVE') {
      this.profiles.set(practitionerId, {
        practitionerId,
        applicationId,
        userId: existing.userId,
        displayName: existing.requestedDisplayName,
        professionalHeadline: existing.professionalHeadline,
        bio: existing.bio,
        practiceAreas: [...existing.practiceAreas],
        languages: [...existing.languages],
        countryOrRegion: existing.countryOrRegion,
        ...(existing.websiteUrl === undefined ? {} : { websiteUrl: existing.websiteUrl }),
        foundingPractitioner: false,
        approvedAt: reviewedAt,
        profileStatus: 'APPROVED',
        endedAt: null,
        createdAt: reviewedAt,
        updatedAt: reviewedAt
      });
    }
    if (action === 'REVOKE') {
      const profile = [...this.profiles.values()].find(
        (candidate) => candidate.applicationId === applicationId && candidate.profileStatus === 'APPROVED'
      );
      if (profile === undefined) {
        return { outcome: 'invalid-transition' };
      }
      this.profiles.set(profile.practitionerId, {
        ...profile,
        profileStatus: 'REVOKED',
        endedAt: reviewedAt,
        updatedAt: reviewedAt
      });
    }

    const updated = {
      ...existing,
      status: nextStatus,
      version: existing.version + 1,
      finalizedAt: ['REJECTED', 'WITHDRAWN', 'REVOKED'].includes(nextStatus) ? reviewedAt : null,
      purgeEligibleAt: ['REJECTED', 'WITHDRAWN', 'REVOKED'].includes(nextStatus)
        ? purgeEligibleAt
        : null
    };
    this.applications.set(applicationId, updated);
    this.events.push({
      reviewEventId,
      reviewerUserId,
      applicationId,
      revisionId: null,
      action,
      reasonCode,
      note,
      applicationVersion: version,
      createdAt: reviewedAt,
      purgeEligibleAt: ['REJECTED', 'WITHDRAWN', 'REVOKED'].includes(nextStatus)
        ? purgeEligibleAt
        : null,
      retentionHold: 'NONE'
    });
    return { outcome: 'updated', application: cloneApplication(updated) };
  }

  async getProfileForUser(userId) {
    const profile = [...this.profiles.values()].find(
      (candidate) => candidate.userId === userId && candidate.profileStatus === 'APPROVED'
    );
    return profile === undefined ? null : cloneProfile(profile);
  }

  async getPublicProfile(practitionerId) {
    const profile = this.profiles.get(practitionerId);
    return profile === undefined || profile.profileStatus !== 'APPROVED'
      ? null
      : cloneProfile(profile);
  }

  async listPublicProfiles({ limit, cursor }) {
    const profiles = [...this.profiles.values()]
      .filter((profile) => profile.profileStatus === 'APPROVED')
      .sort((left, right) => left.displayName.localeCompare(right.displayName) || left.practitionerId.localeCompare(right.practitionerId));
    let start = 0;
    if (cursor !== null) {
      const position = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      start = profiles.findIndex((profile) =>
        profile.displayName > position.displayName ||
        (profile.displayName === position.displayName && profile.practitionerId > position.practitionerId)
      );
      if (start === -1) start = profiles.length;
    }
    const page = profiles.slice(start, start + limit);
    return {
      profiles: page.map(cloneProfile),
      nextCursor: start + limit < profiles.length && page.length > 0
        ? Buffer.from(JSON.stringify({
            displayName: page.at(-1).displayName,
            practitionerId: page.at(-1).practitionerId
          }), 'utf8').toString('base64url')
        : null
    };
  }

  async listVisibleContributions(userId) {
    return (this.contributions.get(userId) ?? [])
      .filter((contribution) => contribution.status === undefined || contribution.status === 'VISIBLE')
      .map((contribution) => ({
        kind: contribution.kind,
        contributionId: contribution.contributionId,
        title: contribution.title,
        href: contribution.href,
        createdAt: contribution.createdAt
      }));
  }

  async getPendingProfileRevision(userId) {
    const profile = await this.getProfileForUser(userId);
    if (profile === null) return null;
    const revision = [...this.revisions.values()].find(
      (candidate) => candidate.practitionerId === profile.practitionerId && candidate.status === 'PENDING'
    );
    return revision === undefined ? null : { ...revision };
  }

  async createProfileRevision({ revisionId, userId, profile, submittedAt, purgeEligibleAt }) {
    const current = await this.getProfileForUser(userId);
    if (current === null) return { outcome: 'not-found' };
    if ([...this.revisions.values()].some((revision) =>
      revision.practitionerId === current.practitionerId && revision.status === 'PENDING'
    )) {
      return { outcome: 'conflict' };
    }
    const revision = {
      ...validRevision(profile),
      revisionId,
      practitionerId: current.practitionerId,
      submittedByUserId: userId,
      status: 'PENDING',
      submittedAt,
      reviewedAt: null,
      purgeEligibleAt,
      retentionHold: 'NONE',
      applicationId: current.applicationId,
      userId,
      applicationVersion: this.applications.get(current.applicationId).version
    };
    this.revisions.set(revisionId, revision);
    return { outcome: 'created', revision: { ...revision } };
  }

  async reviewProfileRevision({
    reviewerUserId,
    revisionId,
    applicationId,
    action,
    reasonCode,
    note,
    version,
    reviewEventId,
    reviewedAt
  }) {
    if (!this.reviewers.has(reviewerUserId)) return { outcome: 'forbidden' };
    const revision = this.revisions.get(revisionId);
    if (revision === undefined) return { outcome: 'not-found' };
    if (revision.userId === reviewerUserId) return { outcome: 'forbidden' };
    if (revision.applicationId !== applicationId || revision.status !== 'PENDING' || revision.applicationVersion !== version) {
      return { outcome: 'stale' };
    }
    if (action === 'APPROVE') {
      const current = this.profiles.get(revision.practitionerId);
      this.profiles.set(revision.practitionerId, {
        ...current,
        displayName: revision.displayName,
        professionalHeadline: revision.professionalHeadline,
        bio: revision.bio,
        practiceAreas: [...revision.practiceAreas],
        languages: [...revision.languages],
        countryOrRegion: revision.countryOrRegion,
        ...(revision.websiteUrl === undefined ? {} : { websiteUrl: revision.websiteUrl }),
        updatedAt: reviewedAt
      });
    }
    const updated = { ...revision, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewedAt };
    this.revisions.set(revisionId, updated);
    this.events.push({
      reviewEventId,
      reviewerUserId,
      applicationId,
      revisionId,
      action,
      reasonCode,
      note,
      applicationVersion: version,
      createdAt: reviewedAt,
      purgeEligibleAt: null,
      retentionHold: 'NONE'
    });
    return { outcome: 'updated', revision: { ...updated } };
  }

  async setFoundingPractitioner({ reviewerUserId, practitionerId }) {
    if (!this.reviewers.has(reviewerUserId)) return { outcome: 'forbidden' };
    const profile = this.profiles.get(practitionerId);
    if (profile === undefined || profile.profileStatus !== 'APPROVED') return { outcome: 'not-found' };
    this.profiles.set(practitionerId, { ...profile, foundingPractitioner: true });
    return { outcome: 'updated' };
  }

  async createProfileReport({ reportId, reporterUserId, practitionerId, category, details, createdAt }) {
    const profile = await this.getPublicProfile(practitionerId);
    if (profile === null) return { outcome: 'invalid-target' };
    if ([...this.reports.values()].some((report) =>
      report.reporterUserId === reporterUserId && report.practitionerId === practitionerId && report.state === 'OPEN'
    )) return { outcome: 'duplicate' };
    const report = {
      reportId,
      reporterUserId,
      practitionerId,
      category,
      details,
      state: 'OPEN',
      createdAt,
      resolvedAt: null,
      purgeEligibleAt: null,
      retentionHold: 'NONE'
    };
    this.reports.set(reportId, report);
    return { outcome: 'created', report: { ...report } };
  }

  async listOpenProfileReports() {
    return [...this.reports.values()]
      .filter((report) => report.state === 'OPEN')
      .map((report) => ({ ...report }));
  }

  async resolveProfileReport({ reviewerUserId, reportId, state, resolvedAt, purgeEligibleAt }) {
    if (!this.reviewers.has(reviewerUserId)) return { outcome: 'forbidden' };
    const report = this.reports.get(reportId);
    if (report === undefined) return { outcome: 'not-found' };
    if (report.state !== 'OPEN') return { outcome: 'conflict' };
    const updated = { ...report, state, resolvedAt, purgeEligibleAt };
    this.reports.set(reportId, updated);
    return { outcome: 'updated', report: { ...updated } };
  }

  async purgeExpiredRetention() {
    return {
      deletedApplications: 0,
      deletedProfiles: 0,
      deletedRevisions: 0,
      deletedReviewEvents: 0,
      deletedReports: 0
    };
  }
}

function createDependencies(repository) {
  let id = 0;
  return {
    publicWebOrigin: PUBLIC_WEB_ORIGIN,
    authenticator: {
      async authenticate(request) {
        const userId = request.headers.get('x-test-user');
        return userId === null ? null : { userId, sessionCreatedAt: NOW };
      }
    },
    accountErasure: {},
    accountDataExport: {},
    emailMagicLinkAuthLifecycle: {},
    idGenerator: {
      generate() {
        id += 1;
        return `generated-${id}`;
      }
    },
    persistence: {
      users: {},
      authIdentities: {},
      authIdentityProvisioning: {},
      authSessions: {},
      emailMagicLinkChallenges: {},
      feedbackSubmissions: {},
      vaultCharts: {},
      chartNotes: {},
      notificationPreferences: {},
      pushSubscriptions: {},
      community: {},
      practitioner: repository
    },
    engineClient: {},
    chartCalculator: {},
    clock: { now: () => new Date(NOW) },
    secureTokenGenerator: {},
    tokenHasher: {},
    authenticationExpirationPolicy: {},
    emailMagicLinkDelivery: {},
    magicLinkUrlBuilder: {},
    sessionCookiePolicy: { name: 'nn_session', secure: true }
  };
}

function createHarness() {
  const repository = new InMemoryPractitionerRepository();
  return { repository, app: createApp(createDependencies(repository)) };
}

async function request(app, path, { method = 'GET', userId, body } = {}) {
  const headers = { Origin: PUBLIC_WEB_ORIGIN };
  if (userId !== undefined) headers['X-Test-User'] = userId;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  return app.request(path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

async function responseJson(response) {
  return response.json();
}

async function submitApplication(app, userId, overrides = {}) {
  const response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId,
    body: validApplication(overrides)
  });
  assert.equal(response.status, 201);
  return (await responseJson(response)).application;
}

async function reviewApplication(app, applicationId, body) {
  const response = await request(app, `/api/practitioner/review/applications/${applicationId}`, {
    method: 'PATCH',
    userId: 'reviewer-user',
    body
  });
  return { response, value: await responseJson(response) };
}

test('Practitioner domain and request validation preserve the frozen boundaries', () => {
  const normalized = normalizePractitionerApplicationRequest(validApplication());
  assert.ok(normalized);
  assert.equal('userId' in normalized, false);
  assert.equal(normalized.websiteUrl, 'https://example.test/practice');
  assert.equal(normalizePractitionerApplicationRequest({}), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), requestedDisplayName: 'A' }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), userId: 'attacker' }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), status: 'APPROVED' }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), practiceAreas: ['UNKNOWN'] }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), languages: ['zh-Hans'] }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), evidenceUrls: [] }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), evidenceUrls: Array.from({ length: 6 }, (_, index) => `https://example.test/${index}`) }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), evidenceUrls: ['not-a-url'] }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), websiteUrl: 'http://example.test' }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), bio: '\uD800'.repeat(20) }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), bio: '<script>unsafe</script>' }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), consentToPublicProfile: false }), null);
  assert.equal(normalizePractitionerApplicationRequest({ ...validApplication(), practiceStatement: 'I guarantee a certain outcome.' }), null);
  assert.equal(containsDisallowedProfessionalClaim('I will cure every condition.'), true);

  assert.ok(normalizePractitionerProfileRevisionRequest(validRevision()));
  assert.equal(normalizePractitionerProfileRevisionRequest({ ...validRevision(), foundingPractitioner: true }), null);
  assert.equal(normalizePractitionerProfileRevisionReviewRequest({
    applicationId: 'application-1',
    action: 'APPROVE',
    reasonCode: 'POLICY',
    version: 1,
    foundingPractitioner: true
  }), null);
  assert.equal(normalizePractitionerProfileRevisionReviewRequest({
    applicationId: 'application-1',
    action: 'APPROVE',
    reasonCode: 'POLICY',
    version: 1
  }).applicationId, 'application-1');

  assert.deepEqual([...PRACTITIONER_REVIEW_QUEUE_STATUSES], [
    'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'REVOKED'
  ]);
  assert.equal(parsePractitionerReviewQueueStatus(undefined), null);
  assert.equal(parsePractitionerReviewQueueStatus('WITHDRAWN'), null);
  assert.equal(parsePractitionerReviewQueueStatus('APPROVED'), 'APPROVED');
  assert.equal(practitionerApplicationTransitionIsAllowed('SUBMITTED', 'APPROVED'), true);
  assert.equal(practitionerApplicationTransitionIsAllowed('APPROVED', 'REJECTED'), false);
  assert.equal(practitionerApplicationTransitionIsAllowed('APPROVED', 'REVOKED'), true);
});

test('Practitioner routes enforce account ownership, reviewer authority, public privacy, and revocation', async () => {
  const { app, repository } = createHarness();

  let response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    body: validApplication()
  });
  assert.equal(response.status, 401);

  response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'user-a',
    body: { ...validApplication(), userId: 'user-b' }
  });
  assert.equal(response.status, 400);

  response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'user-a',
    body: validApplication()
  });
  assert.equal(response.status, 201);
  const created = await responseJson(response);
  const applicationId = created.application.applicationId;
  assert.equal(created.application.userId, undefined);

  response = await request(app, '/api/practitioner/application', {
    method: 'GET',
    userId: 'user-b'
  });
  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).application, null);

  response = await request(app, `/api/practitioner/application/${applicationId}`, {
    method: 'PATCH',
    userId: 'user-b',
    body: validApplication({ requestedDisplayName: 'Other User' })
  });
  assert.equal(response.status, 404);

  response = await request(app, '/api/practitioner/review/applications', {
    method: 'GET',
    userId: 'user-a'
  });
  assert.equal(response.status, 403);

  response = await request(app, '/api/practitioner/review/applications?status=INVALID', {
    method: 'GET',
    userId: 'reviewer-user'
  });
  assert.equal(response.status, 400);

  response = await request(app, '/api/practitioner/review/applications?status=SUBMITTED', {
    method: 'GET',
    userId: 'reviewer-user'
  });
  assert.equal(response.status, 200);
  let queue = await responseJson(response);
  assert.equal(queue.applications.length, 1);
  assert.deepEqual(queue.applications[0].reviewHistory, []);

  response = await request(app, `/api/practitioner/review/applications/${applicationId}`, {
    method: 'PATCH',
    userId: 'user-a',
    body: { action: 'APPROVE', reasonCode: 'ELIGIBILITY', version: 1 }
  });
  assert.equal(response.status, 403);

  response = await request(app, `/api/practitioner/review/applications/${applicationId}`, {
    method: 'PATCH',
    userId: 'reviewer-user',
    body: { action: 'APPROVE', reasonCode: 'ELIGIBILITY', version: 1, note: 'Reviewed manually.' }
  });
  assert.equal(response.status, 200);
  const practitionerId = [...repository.profiles.keys()][0];

  response = await request(app, '/api/practitioner/review/applications?status=APPROVED', {
    method: 'GET',
    userId: 'reviewer-user'
  });
  assert.equal(response.status, 200);
  queue = await responseJson(response);
  assert.equal(queue.applications[0].reviewHistory[0].action, 'APPROVE');
  assert.equal(queue.applications[0].reviewHistory[0].note, 'Reviewed manually.');
  assert.equal(queue.applications[0].userId, 'user-a');

  response = await request(app, `/api/practitioners/${practitionerId}`, { method: 'GET' });
  assert.equal(response.status, 200);
  const publicValue = await responseJson(response);
  assert.equal(publicValue.profile.practitionerId, practitionerId);
  for (const privateField of ['userId', 'applicationId', 'evidenceUrls', 'practiceStatement', 'reviewHistory']) {
    assert.equal(privateField in publicValue.profile, false, privateField);
  }

  response = await request(app, '/api/practitioner/reports', {
    method: 'POST',
    userId: 'user-b',
    body: { practitionerId, category: 'MISLEADING_CLAIM', details: 'Please review this claim.' }
  });
  assert.equal(response.status, 201);
  const report = await responseJson(response);

  response = await request(app, '/api/practitioner/reports', {
    method: 'POST',
    userId: 'user-b',
    body: { practitionerId, category: 'MISLEADING_CLAIM' }
  });
  assert.equal(response.status, 409);

  response = await request(app, '/api/practitioner/reports', {
    method: 'POST',
    body: { practitionerId, category: 'PRIVACY' }
  });
  assert.equal(response.status, 401);

  response = await request(app, '/api/practitioner/review/reports', {
    method: 'GET',
    userId: 'reviewer-user'
  });
  assert.equal(response.status, 200);
  const openReports = await responseJson(response);
  assert.equal(openReports.reports.length, 1);
  assert.equal('reporterUserId' in openReports.reports[0], false);

  response = await request(app, `/api/practitioners/${practitionerId}`, { method: 'GET' });
  assert.equal(response.status, 200);

  response = await request(app, `/api/practitioner/review/reports/${report.reportId}`, {
    method: 'PATCH',
    userId: 'user-a',
    body: { state: 'DISMISSED' }
  });
  assert.equal(response.status, 403);

  response = await request(app, `/api/practitioner/review/reports/${report.reportId}`, {
    method: 'PATCH',
    userId: 'reviewer-user',
    body: { state: 'DISMISSED' }
  });
  assert.equal(response.status, 200);

  response = await request(app, `/api/practitioner/review/applications/${applicationId}`, {
    method: 'PATCH',
    userId: 'reviewer-user',
    body: { action: 'REVOKE', reasonCode: 'POLICY', version: 2 }
  });
  assert.equal(response.status, 200);

  response = await request(app, `/api/practitioners/${practitionerId}`, { method: 'GET' });
  assert.equal(response.status, 404);
});

test('Practitioner lifecycle covers review outcomes, withdrawal, cooldowns, and hold protection', async () => {
  const { app, repository } = createHarness();

  const changesRequested = await submitApplication(app, 'changes-user');
  let reviewed = await reviewApplication(app, changesRequested.applicationId, {
    action: 'REQUEST_CHANGES',
    reasonCode: 'INCOMPLETE',
    version: 1,
    note: 'Please clarify the practice scope.'
  });
  assert.equal(reviewed.response.status, 200);
  assert.equal(reviewed.value.status, 'CHANGES_REQUESTED');
  assert.equal(repository.events[0].action, 'REQUEST_CHANGES');

  let response = await request(app, `/api/practitioner/application/${changesRequested.applicationId}`, {
    method: 'PATCH',
    userId: 'changes-user',
    body: validApplication({ requestedDisplayName: 'Aster Vale Revised' })
  });
  assert.equal(response.status, 200);
  let resubmitted = (await responseJson(response)).application;
  assert.equal(resubmitted.status, 'SUBMITTED');
  assert.equal(resubmitted.version, 3);

  reviewed = await reviewApplication(app, changesRequested.applicationId, {
    action: 'REJECT',
    reasonCode: 'POLICY',
    version: 3
  });
  assert.equal(reviewed.response.status, 200);
  assert.equal(reviewed.value.status, 'REJECTED');
  const rejectedRecord = repository.applications.get(changesRequested.applicationId);
  assert.equal(rejectedRecord.purgeEligibleAt, addPractitionerRetentionDays(NOW, 365));

  response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'changes-user',
    body: validApplication()
  });
  assert.equal(response.status, 409);

  const postCooldown = await repository.createApplication({
    applicationId: 'after-rejected-cooldown',
    userId: 'changes-user',
    application: validApplication(),
    submittedAt: addPractitionerRetentionDays(NOW, 30)
  });
  assert.equal(postCooldown.outcome, 'created');

  const withdrawn = await submitApplication(app, 'withdrawn-user');
  response = await request(app, `/api/practitioner/application/${withdrawn.applicationId}/withdraw`, {
    method: 'POST',
    userId: 'withdrawn-user'
  });
  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).application.status, 'WITHDRAWN');
  assert.equal(repository.applications.get(withdrawn.applicationId).purgeEligibleAt, addPractitionerRetentionDays(NOW, 365));
  response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'withdrawn-user',
    body: validApplication({ requestedDisplayName: 'Withdrawn User Reapplied' })
  });
  assert.equal(response.status, 201);

  const revoked = await submitApplication(app, 'revoked-user');
  reviewed = await reviewApplication(app, revoked.applicationId, {
    action: 'APPROVE',
    reasonCode: 'ELIGIBILITY',
    version: 1
  });
  assert.equal(reviewed.response.status, 200);
  reviewed = await reviewApplication(app, revoked.applicationId, {
    action: 'REVOKE',
    reasonCode: 'POLICY',
    version: 2
  });
  assert.equal(reviewed.response.status, 200);
  assert.equal(reviewed.value.status, 'REVOKED');
  assert.equal(repository.applications.get(revoked.applicationId).purgeEligibleAt, addPractitionerRetentionDays(NOW, 365));
  response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'revoked-user',
    body: validApplication()
  });
  assert.equal(response.status, 409);

  const held = await submitApplication(app, 'held-user');
  reviewed = await reviewApplication(app, held.applicationId, {
    action: 'REJECT',
    reasonCode: 'POLICY',
    version: 1
  });
  assert.equal(reviewed.response.status, 200);
  repository.applications.get(held.applicationId).retentionHold = 'LEGAL';
  response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'held-user',
    body: validApplication()
  });
  assert.equal(response.status, 409);

  repository.reviewers.add('self-reviewer');
  const selfReview = await submitApplication(app, 'self-reviewer');
  response = await request(app, `/api/practitioner/review/applications/${selfReview.applicationId}`, {
    method: 'PATCH',
    userId: 'self-reviewer',
    body: { action: 'APPROVE', reasonCode: 'ELIGIBILITY', version: 1 }
  });
  assert.equal(response.status, 403);

  response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'spoof-user',
    body: validApplication({ status: 'APPROVED' })
  });
  assert.equal(response.status, 400);
});

test('profile revisions remain private until reviewer promotion and founding is reviewer-only', async () => {
  const { app, repository } = createHarness();
  let response = await request(app, '/api/practitioner/application', {
    method: 'POST',
    userId: 'user-a',
    body: validApplication()
  });
  const application = await responseJson(response);
  const applicationId = application.application.applicationId;
  response = await request(app, `/api/practitioner/review/applications/${applicationId}`, {
    method: 'PATCH',
    userId: 'reviewer-user',
    body: { action: 'APPROVE', reasonCode: 'ELIGIBILITY', version: 1 }
  });
  assert.equal(response.status, 200);
  const practitionerId = [...repository.profiles.keys()][0];

  response = await request(app, '/api/practitioner/profile/revision', {
    method: 'POST',
    userId: 'user-a',
    body: validRevision({ displayName: 'Aster Vale Updated' })
  });
  assert.equal(response.status, 201);
  const revision = await responseJson(response);

  response = await request(app, `/api/practitioners/${practitionerId}`, { method: 'GET' });
  assert.equal((await responseJson(response)).profile.displayName, 'Aster Vale');

  response = await request(app, '/api/practitioner/profile/revision', {
    method: 'POST',
    userId: 'user-a',
    body: validRevision({ displayName: 'Second Pending Revision' })
  });
  assert.equal(response.status, 409);

  response = await request(app, `/api/practitioner/review/revisions/${revision.revision.revisionId}`, {
    method: 'PATCH',
    userId: 'reviewer-user',
    body: {
      applicationId,
      action: 'APPROVE',
      reasonCode: 'POLICY',
      version: 1
    }
  });
  assert.equal(response.status, 409);

  response = await request(app, `/api/practitioner/review/revisions/${revision.revision.revisionId}`, {
    method: 'PATCH',
    userId: 'reviewer-user',
    body: {
      applicationId,
      action: 'APPROVE',
      reasonCode: 'POLICY',
      version: 2
    }
  });
  assert.equal(response.status, 200);

  response = await request(app, `/api/practitioners/${practitionerId}`, { method: 'GET' });
  assert.equal((await responseJson(response)).profile.displayName, 'Aster Vale Updated');

  response = await request(app, `/api/practitioner/review/profiles/${practitionerId}/founding`, {
    method: 'POST',
    userId: 'user-a'
  });
  assert.equal(response.status, 403);

  response = await request(app, `/api/practitioner/review/profiles/${practitionerId}/founding`, {
    method: 'POST',
    userId: 'reviewer-user'
  });
  assert.equal(response.status, 200);

  response = await request(app, `/api/practitioners/${practitionerId}`, { method: 'GET' });
  assert.equal((await responseJson(response)).profile.foundingPractitioner, true);
});

test('approved Practitioner profiles expose safe visible contributions with deterministic directory pagination', async () => {
  const { app, repository } = createHarness();
  const later = await submitApplication(app, 'directory-z', {
    requestedDisplayName: 'Zoe Vale'
  });
  let reviewed = await reviewApplication(app, later.applicationId, {
    action: 'APPROVE',
    reasonCode: 'ELIGIBILITY',
    version: 1
  });
  assert.equal(reviewed.response.status, 200);

  const earlier = await submitApplication(app, 'directory-a', {
    requestedDisplayName: 'Avery Vale'
  });
  reviewed = await reviewApplication(app, earlier.applicationId, {
    action: 'APPROVE',
    reasonCode: 'ELIGIBILITY',
    version: 1
  });
  assert.equal(reviewed.response.status, 200);

  const profileByUser = new Map(
    [...repository.profiles.values()].map((profile) => [profile.userId, profile])
  );
  const laterProfile = profileByUser.get('directory-z');
  const earlierProfile = profileByUser.get('directory-a');
  assert.ok(laterProfile);
  assert.ok(earlierProfile);
  repository.contributions.set('directory-a', [
    {
      kind: 'QUESTION',
      contributionId: 'question-visible',
      title: 'A visible question',
      href: '/community/question?id=question-visible',
      createdAt: NOW,
      status: 'VISIBLE'
    },
    {
      kind: 'ANSWER',
      contributionId: 'answer-hidden',
      title: 'A hidden answer',
      href: '/community/question?id=answer-hidden',
      createdAt: NOW,
      status: 'HIDDEN'
    },
    {
      kind: 'QUESTION',
      contributionId: 'question-deleted',
      title: 'A deleted question',
      href: '/community/question?id=question-deleted',
      createdAt: NOW,
      status: 'DELETED'
    }
  ]);

  let response = await request(app, '/api/practitioners?limit=1');
  assert.equal(response.status, 200);
  const firstPage = await responseJson(response);
  assert.equal(firstPage.profiles.length, 1);
  assert.equal(firstPage.profiles[0].displayName, 'Avery Vale');
  assert.notEqual(firstPage.nextCursor, null);

  response = await request(app, `/api/practitioners?limit=1&cursor=${encodeURIComponent(firstPage.nextCursor)}`);
  assert.equal(response.status, 200);
  const secondPage = await responseJson(response);
  assert.equal(secondPage.profiles.length, 1);
  assert.equal(secondPage.profiles[0].displayName, 'Zoe Vale');
  assert.equal(secondPage.nextCursor, null);

  const publicProfile = firstPage.profiles[0];
  assert.deepEqual(publicProfile.contributions, [{
    kind: 'QUESTION',
    contributionId: 'question-visible',
    title: 'A visible question',
    href: '/community/question?id=question-visible',
    createdAt: NOW
  }]);
  for (const privateField of ['userId', 'applicationId', 'evidenceUrls', 'practiceStatement', 'reviewHistory', 'retentionHold']) {
    assert.equal(privateField in publicProfile, false, privateField);
  }

  response = await request(app, `/api/practitioners/${earlierProfile.practitionerId}`);
  assert.equal(response.status, 200);
  const profileValue = await responseJson(response);
  assert.equal(profileValue.profile.bio, earlierProfile.bio);
  assert.equal(profileValue.profile.countryOrRegion, earlierProfile.countryOrRegion);
  assert.deepEqual(profileValue.profile.practiceAreas, ['NATAL_ASTROLOGY']);
  assert.deepEqual(profileValue.profile.languages, ['en']);
  assert.match(profileValue.disclosure, /does not constitute professional certification/u);

  response = await request(app, '/api/practitioners?cursor=not*safe');
  assert.equal(response.status, 400);

  const founding = await request(app, `/api/practitioner/review/profiles/${laterProfile.practitionerId}/founding`, {
    method: 'POST',
    userId: 'reviewer-user'
  });
  assert.equal(founding.status, 200);
  response = await request(app, '/api/practitioners?limit=2');
  assert.equal(response.status, 200);
  const afterFounding = await responseJson(response);
  assert.deepEqual(afterFounding.profiles.map((profile) => profile.displayName), ['Avery Vale', 'Zoe Vale']);
  assert.equal(afterFounding.profiles[1].foundingPractitioner, true);
});

test('Practitioner report validation and deterministic rate limits remain bounded', () => {
  assert.equal(normalizeCreatePractitionerReportRequest({
    practitionerId: 'practitioner-1',
    category: 'NOT_A_CATEGORY'
  }), null);
  assert.ok(normalizeCreatePractitionerReportRequest({
    practitionerId: 'practitioner-1',
    category: 'PRIVACY',
    details: 'A bounded report.'
  }));

  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.practitionerApplicationSubmitDay.limit, 3);
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.practitionerApplicationSubmitDay.windowMs, 24 * 60 * 60 * 1_000);
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.practitionerApplicationUpdateDay.limit, 10);
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.practitionerProfileRevisionDay.limit, 10);
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.practitionerProfileReportHour.limit, 10);
  assert.equal(P0_STAGING_RATE_LIMIT_POLICIES.practitionerProfileReportDay.limit, 30);

  const limiter = new InMemoryP0StagingRateLimiter();
  const submitPolicy = P0_STAGING_RATE_LIMIT_POLICIES.practitionerApplicationSubmitDay;
  assert.equal(limiter.attempt(submitPolicy, 'user-a', 0).allowed, true);
  assert.equal(limiter.attempt(submitPolicy, 'user-a', 1).allowed, true);
  assert.equal(limiter.attempt(submitPolicy, 'user-a', 2).allowed, true);
  assert.equal(limiter.attempt(submitPolicy, 'user-a', 3).allowed, false);
  assert.equal(limiter.attempt(submitPolicy, 'user-b', 3).allowed, true);
});

test('Practitioner retention maintenance delegates one bounded purge and always closes runtime', async () => {
  let purgeAt = null;
  let closed = 0;
  const runtime = {
    practitionerRepository: {
      async purgeExpiredRetention(now) {
        purgeAt = now;
        return {
          deletedApplications: 1,
          deletedProfiles: 1,
          deletedRevisions: 1,
          deletedReviewEvents: 1,
          deletedReports: 1
        };
      }
    },
    async close() {
      closed += 1;
    }
  };
  const result = await runPractitionerRetentionMaintenanceWithRuntime(runtime, {
    now: () => new Date(NOW)
  });
  assert.equal(result.status, 'ok');
  assert.equal(purgeAt, NOW);
  assert.equal(closed, 1);

  const failedRuntime = {
    practitionerRepository: {
      async purgeExpiredRetention() {
        throw new Error('database unavailable');
      }
    },
    async close() {
      closed += 1;
    }
  };
  const failed = await runPractitionerRetentionMaintenanceWithRuntime(failedRuntime, {
    now: () => new Date(NOW)
  });
  assert.deepEqual(failed, {
    status: 'error',
    failedPhase: 'purge',
    error: 'purge_failed'
  });
  assert.equal(closed, 2);
});

test('Practitioner migration and SQL freeze the required privacy, retention, and authority constraints', async () => {
  const migration = await readFile(new URL('../db/migrations/0019_practitioner_contributor_v1.sql', import.meta.url), 'utf8');
  const queries = await readFile(new URL('../src/practitioner/practitioner-queries.ts', import.meta.url), 'utf8');
  assert.match(migration, /practitioner_reviewers/);
  assert.match(migration, /practitioner_applications_public_consent_check/u);
  assert.match(migration, /practitioner_reviewers/u);
  assert.match(migration, /'SUBMITTED'/u);
  assert.match(migration, /'CHANGES_REQUESTED'/u);
  assert.match(migration, /'APPROVED'/u);
  assert.match(migration, /'REJECTED'/u);
  assert.match(migration, /'WITHDRAWN'/u);
  assert.match(migration, /'REVOKED'/u);
  assert.match(migration, /Practitioner review events are append-only/u);
  assert.match(migration, /users_practitioner_anonymization_guard/u);
  assert.match(migration, /INTERVAL '365 days'/u);
  assert.match(migration, /practitioner_profile_revisions_one_pending_idx/u);
  assert.match(migration, /practitioner_review_events_revision_fk/u);
  assert.doesNotMatch(migration, /0017/u);
  assert.match(queries, /display_name ASC, practitioner_id ASC/u);
  assert.match(queries, /profile_status = 'APPROVED'/u);
  assert.match(queries, /r\.retention_hold = 'NONE'/u);
  assert.match(queries, /practitioner_profile_reports AS r[\s\S]*r\.practitioner_id = p\.practitioner_id/u);
  assert.match(queries, /WHERE application_id = \$1/u);
});

test('Practitioner retention thresholds remain the frozen values', () => {
  assert.equal(PRACTITIONER_FINAL_APPLICATION_RETENTION_DAYS, 365);
  assert.equal(PRACTITIONER_PROFILE_HISTORY_RETENTION_DAYS, 90);
  assert.equal(PRACTITIONER_REVIEW_AUDIT_RETENTION_DAYS, 365);
  assert.equal(addPractitionerRetentionDays(NOW, 30), '2026-09-30T12:00:00.000Z');
});
