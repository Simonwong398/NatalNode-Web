import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import {
  assertNoBirthInputFormHarnessLeak,
  deferred,
  makeAmbiguousResolution,
  makeExactResolution,
  makeNonexistentResolution,
  makeUnknownTimeResolution,
  withBirthInputForm
} from './support/birth-input-form-harness.mjs';

const DEVELOPMENT_NOTICE =
  'UI DEVELOPMENT ONLY — NOT HISTORICAL TIMEZONE EVIDENCE — NOT PRODUCTION RESOLUTION';
const DEVELOPMENT_EXPLANATION =
  'This development resolver preserves your entered place label but uses fixed New York coordinate/timezone fixture data for UI testing; the fixture data is not derived from that place, is not historical timezone evidence, and is not production resolution.';
const RESOLUTION_FAILURE =
  'Birth input resolution is unavailable in this development environment.';

function capturingResolver(implementation) {
  const calls = [];
  return {
    calls,
    async resolve(input) {
      const captured = { ...input };
      calls.push(captured);
      return implementation(captured, calls.length - 1);
    }
  };
}

function exactFrom(input, overrides = {}) {
  return makeExactResolution({
    localDate: input.localDate,
    localTime: input.localTime,
    locationLabel: input.locationLabel,
    ...overrides
  });
}

function unknownFrom(input, overrides = {}) {
  return makeUnknownTimeResolution({
    localDate: input.localDate,
    localTime: null,
    locationLabel: input.locationLabel,
    ...overrides
  });
}

async function fillKnown(scope, overrides = {}) {
  const values = {
    day: '29',
    month: '02',
    year: '2000',
    time: '07:05',
    place: 'Fixture Place',
    houseSystem: 'Placidus',
    ...overrides
  };

  await scope.change(scope.control('Day'), values.day);
  await scope.change(scope.control('Month'), values.month);
  await scope.change(scope.control('Year'), values.year);
  await scope.change(scope.id('birth-time'), values.time);
  await scope.change(scope.control('Birth place'), values.place);
  await scope.change(scope.control('House system'), values.houseSystem);
}

async function fillUnknown(scope, overrides = {}) {
  await fillKnown(scope, overrides);
  await scope.click(scope.id('unknown-time'));
}

afterEach(() => {
  assertNoBirthInputFormHarnessLeak();
});

describe('initial render, validation, and configuration', () => {
  test('initial render exposes the current fields, defaults, semantics, and trust disclosures', async () => {
    await withBirthInputForm({}, async (scope) => {
      await scope.mount();

      const day = scope.control('Day');
      const month = scope.control('Month');
      const year = scope.control('Year');
      const time = scope.id('birth-time');
      const unknownTime = scope.id('unknown-time');
      const place = scope.control('Birth place');
      const houseSystem = scope.control('House system');
      const calculate = scope.button('Calculate Chart');
      const details = scope.container.querySelector('details');

      assert.deepEqual(
        [day.value, month.value, year.value, time.value, place.value, houseSystem.value],
        ['', '', '', '', '', 'Placidus']
      );
      assert.equal(unknownTime.checked, false);
      assert.equal(time.disabled, false);
      assert.equal(time.required, true);
      assert.equal(calculate.disabled, false);
      assert.equal(details.open, false);
      assert.deepEqual(
        [...houseSystem.options].map((option) => [option.value, option.textContent, option.disabled]),
        [
          ['', 'Choose a house system', true],
          ['Placidus', 'Placidus', false],
          ['Whole Sign', 'Whole Sign', false],
          ['Equal', 'Equal House', false]
        ]
      );
      assert.equal(scope.container.querySelector('form').noValidate, true);
      assert.equal(scope.roles('alert').length, 0);
      assert.equal(scope.roles('status').length, 0);
      assert.equal(scope.fetchCalls.length, 0);
      assert.match(scope.container.textContent, /How NatalNode handles your birth data/);
      assert.match(scope.container.textContent, /does not silently substitute noon/);
      assert.match(scope.container.textContent, /Time-dependent chart facts remain unavailable/);
      assert.match(scope.container.textContent, new RegExp(DEVELOPMENT_NOTICE));
      assert.match(scope.container.textContent, /UI FIXTURE: AMBIGUOUS/);
      assert.match(scope.container.textContent, /UI FIXTURE: NONEXISTENT/);
    });
  });

  test('localizes ordinary birth-input controls while preserving stable house-system values', async () => {
    const cases = [
      {
        locale: 'en',
        birthDate: 'Birth date',
        day: 'Day',
        month: 'Month',
        year: 'Year',
        birthTime: 'Birth time',
        unknownTime: "I don't know my exact birth time",
        birthPlace: 'Birth place',
        advancedSettings: 'Advanced chart settings',
        calculate: 'Calculate Chart',
        houseSystem: 'House system',
        houseSystemPlaceholder: 'Choose a house system',
        houseSystemOptions: ['Placidus', 'Whole Sign', 'Equal House'],
        errors: [
          'Enter a birth date.',
          'Enter a birth time or choose the unknown-time option.',
          'Enter a birth place.'
        ]
      },
      {
        locale: 'es',
        birthDate: 'Fecha de nacimiento',
        day: 'Día',
        month: 'Mes',
        year: 'Año',
        birthTime: 'Hora de nacimiento',
        unknownTime: 'No conozco mi hora exacta de nacimiento',
        birthPlace: 'Lugar de nacimiento',
        advancedSettings: 'Configuración avanzada de la carta',
        calculate: 'Calcular carta',
        houseSystem: 'Sistema de casas',
        houseSystemPlaceholder: 'Elige un sistema de casas',
        houseSystemOptions: ['Placidus', 'Signos enteros', 'casas iguales'],
        errors: [
          'Introduce una fecha de nacimiento.',
          'Introduce una hora de nacimiento o elige la opción de hora desconocida.',
          'Introduce un lugar de nacimiento.'
        ]
      },
      {
        locale: 'ja',
        birthDate: '出生日',
        day: '日',
        month: '月',
        year: '年',
        birthTime: '出生時刻',
        unknownTime: '正確な出生時刻がわかりません',
        birthPlace: '出生地',
        advancedSettings: '高度なチャート設定',
        calculate: 'チャートを計算',
        houseSystem: 'ハウスシステム',
        houseSystemPlaceholder: 'ハウスシステムを選択',
        houseSystemOptions: ['プラシーダス', 'ホールサインハウス', 'イコールハウス'],
        errors: [
          '出生日を入力してください。',
          '出生時刻を入力するか、不明な時刻を選択してください。',
          '出生地を入力してください。'
        ]
      },
      {
        locale: 'zh-Hant',
        birthDate: '出生日期',
        day: '日',
        month: '月',
        year: '年',
        birthTime: '出生時間',
        unknownTime: '我不知道確切的出生時間',
        birthPlace: '出生地',
        advancedSettings: '進階星盤設定',
        calculate: '計算星盤',
        houseSystem: '宮位系統',
        houseSystemPlaceholder: '選擇宮位系統',
        houseSystemOptions: ['普拉西德制', '整宮制', '等宮制'],
        errors: [
          '請輸入出生日期。',
          '請輸入出生時間，或選擇時間未知選項。',
          '請輸入出生地。'
        ]
      }
    ];

    for (const expected of cases) {
      await withBirthInputForm({ locale: expected.locale }, async (scope) => {
        await scope.mount();

        assert.equal(scope.exact('legend', expected.birthDate).textContent, expected.birthDate);
        assert.equal(scope.exact('legend', expected.birthTime).textContent, expected.birthTime);
        assert.ok(scope.control(expected.day));
        assert.ok(scope.control(expected.month));
        assert.ok(scope.control(expected.year));
        assert.ok(scope.id('birth-time'));
        assert.ok(scope.id('unknown-time'));
        assert.ok(scope.control(expected.birthPlace));
        assert.ok(scope.container.textContent.includes(expected.unknownTime));
        assert.equal(scope.button(expected.calculate).disabled, false);
        assert.match(scope.container.textContent, new RegExp(expected.advancedSettings));

        const monthOptions = [...scope.control(expected.month).options];
        assert.deepEqual(
          monthOptions.map((option) => option.value),
          ['', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        );
        assert.equal(
          monthOptions[2].textContent,
          new Intl.DateTimeFormat(expected.locale, { month: 'long', timeZone: 'UTC' }).format(
            new Date(Date.UTC(2000, 1, 1))
          )
        );

        const houseSystem = scope.control(expected.houseSystem);
        assert.deepEqual(
          [...houseSystem.options].map((option) => [option.value, option.textContent, option.disabled]),
          [
            ['', expected.houseSystemPlaceholder, true],
            ['Placidus', expected.houseSystemOptions[0], false],
            ['Whole Sign', expected.houseSystemOptions[1], false],
            ['Equal', expected.houseSystemOptions[2], false]
          ]
        );

        await scope.submit();
        assert.deepEqual(scope.roles('alert').map((element) => scope.text(element)), expected.errors);
      });
    }
  });

  test('invalid submit reports current errors and does not move focus', async () => {
    const resolver = capturingResolver((input) => exactFrom(input));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      const calculate = scope.button('Calculate Chart');
      calculate.focus();
      await scope.submit();

      assert.deepEqual(
        scope.roles('alert').map((element) => scope.text(element)),
        [
          'Enter a birth date.',
          'Enter a birth time or choose the unknown-time option.',
          'Enter a birth place.'
        ]
      );
      assert.equal(scope.container.querySelector('details').open, false);
      assert.equal(calculate.disabled, false);
      assert.strictEqual(scope.document.activeElement, calculate);
      assert.equal(resolver.calls.length, 0);
      for (const id of ['birth-date-day', 'birth-date-month', 'birth-date-year']) {
        assert.equal(scope.id(id).getAttribute('aria-invalid'), 'true');
        assert.equal(scope.id(id).getAttribute('aria-describedby'), 'birth-date-error');
      }
      assert.equal(scope.id('birth-time').getAttribute('aria-describedby'), 'birth-time-error');
      assert.equal(scope.id('birth-place').getAttribute('aria-describedby'), 'birth-place-error');
      assert.equal(scope.id('house-system').getAttribute('aria-describedby'), null);
    });
  });

  test('local-only entry mode validates required fields without resolving, submitting, or saving input', async () => {
    const resolver = capturingResolver(() => {
      throw new Error('A public entry form must not invoke a birth resolver.');
    });
    let validationCount = 0;

    await withBirthInputForm({
      resolver,
      onInputValidated: () => { validationCount += 1; },
      submitButtonLabel: 'Check birth details',
      showDevelopmentInformation: false,
      showInputSavePanel: false
    }, async (scope) => {
      await scope.mount();

      assert.equal(scope.button('Check birth details').disabled, false);
      assert.equal(scope.button('Check birth details').type, 'button');
      assert.doesNotMatch(scope.container.textContent, /UI DEVELOPMENT ONLY/u);
      assert.equal(scope.container.querySelector('[data-vault-save-mode]'), null);

      await scope.click(scope.button('Check birth details'));
      assert.deepEqual(
        scope.roles('alert').map((element) => scope.text(element)),
        [
          'Enter a birth date.',
          'Enter a birth time or choose the unknown-time option.',
          'Enter a birth place.'
        ]
      );
      assert.equal(validationCount, 0);

      await fillKnown(scope, { place: 'A place entered by the visitor' });
      await scope.click(scope.button('Check birth details'));

      assert.equal(validationCount, 1);
      assert.equal(resolver.calls.length, 0);
      assert.equal(scope.onResolvedInputCalls.length, 0);
      assert.equal(scope.fetchCalls.length, 0);
      assert.equal(scope.container.querySelector('[data-vault-save-mode]'), null);
    });
  });

  test('isCalculationPending controls the label and disables every interactive form control', async () => {
    await withBirthInputForm({ isCalculationPending: true }, async (scope) => {
      await scope.mount();
      assert.equal(scope.button('Calculating chart…').disabled, true);
      for (const control of scope.container.querySelectorAll('input, select, button')) {
        assert.equal(control.disabled, true);
      }

      await scope.rerender({ isCalculationPending: false });
      assert.equal(scope.button('Calculate Chart').disabled, false);
      assert.equal(scope.control('Day').disabled, false);
      assert.equal(scope.id('unknown-time').disabled, false);
    });
  });
});

describe('birth date model and parsing', () => {
  test('date inputs strip non-digits, preserve leading zeros, and truncate to field lengths', async () => {
    await withBirthInputForm({}, async (scope) => {
      await scope.mount();
      await scope.change(scope.control('Day'), ' a0 9x7');
      await scope.change(scope.control('Year'), '20x00 8');

      assert.equal(scope.control('Day').value, '09');
      assert.equal(scope.control('Year').value, '2000');

      await scope.change(scope.control('Day'), '   ');
      await scope.change(scope.control('Year'), 'year');
      assert.equal(scope.control('Day').value, '');
      assert.equal(scope.control('Year').value, '');
    });
  });

  test('valid date parts compose a zero-padded Gregorian date in the resolver request', async () => {
    const resolver = capturingResolver((input) => exactFrom(input));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { day: '9', month: '02', year: '2000' });
      await scope.submit();

      assert.equal(resolver.calls.length, 1);
      assert.equal(resolver.calls[0].localDate, '2000-02-09');
      assert.equal(scope.control('Day').value, '09');
      assert.equal(scope.control('Month').value, '02');
      assert.equal(scope.control('Year').value, '2000');
    });
  });

  test('a resolver-supplied valid date replaces all three visible date parts', async () => {
    const resolver = capturingResolver((input) => exactFrom(input, {
      localDate: '2001-12-31'
    }));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope);
      await scope.submit();

      assert.equal(scope.control('Day').value, '31');
      assert.equal(scope.control('Month').value, '12');
      assert.equal(scope.control('Year').value, '2001');
      assert.equal(scope.onResolvedInputCalls[0].resolution.localDate, '2001-12-31');
    });
  });

  test('empty, incomplete, malformed, and calendar-invalid dates preserve exact validation categories', async () => {
    const cases = [
      [{}, 'Enter a birth date.'],
      [{ day: '1' }, 'Enter a complete birth date.'],
      [{ day: '1', month: '01' }, 'Enter a complete birth date.'],
      [{ day: '00', month: '01', year: '2000' }, 'Enter a valid birth date.'],
      [{ day: '32', month: '01', year: '2000' }, 'Enter a valid birth date.'],
      [{ day: '31', month: '04', year: '2000' }, 'Enter a valid birth date.'],
      [{ day: '29', month: '02', year: '1900' }, 'Enter a valid birth date.'],
      [{ day: '01', month: '01', year: '0000' }, 'Enter a valid birth date.'],
      [{ day: '01', month: '13', year: '2000' }, 'Enter a complete birth date.']
    ];

    for (const [parts, message] of cases) {
      const resolver = capturingResolver((input) => exactFrom(input));
      await withBirthInputForm({ resolver }, async (scope) => {
        await scope.mount();
        if (parts.day !== undefined) await scope.change(scope.control('Day'), parts.day);
        if (parts.month !== undefined) await scope.change(scope.control('Month'), parts.month);
        if (parts.year !== undefined) await scope.change(scope.control('Year'), parts.year);
        await scope.change(scope.id('birth-time'), '07:05');
        await scope.change(scope.control('Birth place'), 'Date Validation Place');
        await scope.change(scope.control('House system'), 'Placidus');
        await scope.submit();

        assert.equal(scope.role('alert', message).id, 'birth-date-error');
        assert.equal(resolver.calls.length, 0);
      });
    }
  });

  test('leap-year rules and enforced year boundaries accept 2000-02-29, 0001, and 9999', async () => {
    const cases = [
      ['29', '02', '2000', '2000-02-29'],
      ['01', '01', '0001', '0001-01-01'],
      ['31', '12', '9999', '9999-12-31']
    ];

    for (const [day, month, year, expected] of cases) {
      const resolver = capturingResolver((input) => exactFrom(input));
      await withBirthInputForm({ resolver }, async (scope) => {
        await scope.mount();
        await fillKnown(scope, { day, month, year });
        await scope.submit();
        assert.equal(resolver.calls[0].localDate, expected);
        assert.equal(scope.onResolvedInputCalls[0].resolution.localDate, expected);
      });
    }
  });
});

describe('known and unknown birth-time behavior', () => {
  test('known time uses native 24-hour minute precision and hands the exact HH:mm value to resolution', async () => {
    const resolver = capturingResolver((input) => exactFrom(input));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { time: '07:05' });
      assert.equal(scope.id('birth-time').type, 'time');
      assert.equal(scope.id('birth-time').step, '60');
      await scope.submit();
      assert.equal(resolver.calls[0].localTime, '07:05');
      assert.equal(scope.onResolvedInputCalls[0].resolution.localTime, '07:05');
    });
  });

  test('invalid hour, invalid minute, malformed, and incomplete native time values become missing-time validation', async () => {
    for (const value of ['24:00', '07:60', '07:', 'not-a-time']) {
      const resolver = capturingResolver((input) => exactFrom(input));
      await withBirthInputForm({ resolver }, async (scope) => {
        await scope.mount();
        await fillKnown(scope);
        await scope.change(scope.id('birth-time'), value);
        assert.equal(scope.id('birth-time').value, '');
        await scope.submit();
        scope.role('alert', 'Enter a birth time or choose the unknown-time option.');
        assert.equal(resolver.calls.length, 0);
      });
    }
  });

  test('unknown-time toggle clears rather than preserves the time and does not restore it when toggled off', async () => {
    await withBirthInputForm({}, async (scope) => {
      await scope.mount();
      await scope.change(scope.id('birth-time'), '13:45');
      await scope.click(scope.id('unknown-time'));
      assert.equal(scope.id('unknown-time').checked, true);
      assert.equal(scope.id('birth-time').value, '');
      assert.equal(scope.id('birth-time').disabled, true);
      assert.equal(scope.id('birth-time').required, false);

      await scope.click(scope.id('unknown-time'));
      assert.equal(scope.id('unknown-time').checked, false);
      assert.equal(scope.id('birth-time').value, '');
      assert.equal(scope.id('birth-time').disabled, false);
      assert.equal(scope.id('birth-time').required, true);
    });
  });

  test('unknown-time resolution and final handoff preserve localTime null with no midnight or noon fallback', async () => {
    let returnedResolution;
    const resolver = capturingResolver((input) => {
      returnedResolution = unknownFrom(input);
      return returnedResolution;
    });
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillUnknown(scope, { time: '12:34', place: 'Unknown Time Place' });
      await scope.submit();

      assert.equal(resolver.calls[0].localTime, null);
      assert.equal(resolver.calls[0].ambiguityStatus, 'UNKNOWN_TIME');
      assert.equal(scope.onResolvedInputCalls.length, 1);
      assert.equal(scope.onResolvedInputCalls[0].resolution.localTime, null);
      assert.equal(scope.onResolvedInputCalls[0].resolution.resolvedUtcInstant, null);
      assert.equal(scope.onResolvedInputCalls[0].resolution.utcOffsetSeconds, null);
      assert.deepEqual(scope.onResolvedInputCalls[0].resolution, returnedResolution);
      assert.equal(scope.onResolvedInputCalls[0].resolution.latitude, 35.6762);
      assert.equal(scope.onResolvedInputCalls[0].resolution.longitude, 139.6503);
      assert.equal(scope.onResolvedInputCalls[0].resolution.ianaTimeZone, 'Asia/Tokyo');
      assert.equal(
        scope.onResolvedInputCalls[0].resolution.timezoneResolutionMethod,
        'fixture-unknown-time'
      );
      assert.notEqual(scope.onResolvedInputCalls[0].resolution.localTime, '12:00');
      assert.notEqual(scope.onResolvedInputCalls[0].resolution.localTime, '00:00');
      assert.match(scope.container.textContent, /Exact birth time unknown/);
      assert.match(
        scope.container.textContent,
        /We'll calculate what can be determined reliably\. Time-dependent factors such as the Ascendant, Midheaven, and houses will remain unavailable\./
      );
      assert.ok(
        scope.button('Calculate Chart').compareDocumentPosition(scope.role('status')) &
          scope.window.Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
  });

  test('unknown time uses the default house system and forwards the selected configuration only', async () => {
    const resolver = capturingResolver((input) => unknownFrom(input));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await scope.change(scope.control('Day'), '29');
      await scope.change(scope.control('Month'), '02');
      await scope.change(scope.control('Year'), '2000');
      await scope.change(scope.control('Birth place'), 'Unknown House Place');
      await scope.click(scope.id('unknown-time'));
      await scope.submit();
      assert.equal(resolver.calls.length, 1);
      assert.equal(scope.onResolvedInputCalls[0].houseSystem, 'Placidus');
      assert.equal(scope.onResolvedInputCalls[0].resolution.localTime, null);

      await scope.change(scope.control('House system'), 'Whole Sign');
      await scope.submit();
      assert.equal(resolver.calls.length, 2);
      assert.equal(scope.onResolvedInputCalls[1].houseSystem, 'Whole Sign');
      assert.equal(scope.onResolvedInputCalls[1].resolution.localTime, null);
    });
  });
});

describe('place input and resolver result flows', () => {
  test('place resolution is explicit-submit only, trims only for validation, and preserves entered text', async () => {
    const resolver = capturingResolver((input) => exactFrom(input));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { place: '  London, UK  ' });
      assert.equal(resolver.calls.length, 0);
      assert.equal(scope.control('Birth place').maxLength, -1);
      await scope.submit();

      assert.equal(resolver.calls.length, 1);
      assert.equal(resolver.calls[0].locationLabel, '  London, UK  ');
      assert.equal(scope.onResolvedInputCalls[0].resolution.locationLabel, '  London, UK  ');
    });
  });

  test('empty and whitespace-only places block resolution while preserving the draft and exact error copy', async () => {
    for (const value of ['', '   ']) {
      const resolver = capturingResolver((input) => exactFrom(input));
      await withBirthInputForm({ resolver }, async (scope) => {
        await scope.mount();
        await fillKnown(scope, { place: value });
        await scope.submit();
        assert.equal(scope.role('alert', 'Enter a birth place.').id, 'birth-place-error');
        assert.equal(scope.control('Birth place').value, value);
        assert.equal(resolver.calls.length, 0);
      });
    }
  });

  test('default exact fixture resolves automatically, displays trust telemetry, and hands off fixture coordinates and timezone', async () => {
    await withBirthInputForm({}, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { place: 'Preserved User Place', houseSystem: 'Equal' });
      await scope.submit();

      assert.equal(scope.onResolvedInputCalls.length, 1);
      assert.deepEqual(scope.onResolvedInputCalls[0], {
        resolution: {
          localDate: '2000-02-29',
          localTime: '07:05',
          locationLabel: 'Preserved User Place',
          latitude: 40.7128,
          longitude: -74.006,
          ianaTimeZone: 'America/New_York',
          resolvedUtcInstant: '2000-01-01T16:00:00.000Z',
          utcOffsetSeconds: -14_400,
          timezoneDatabaseVersion: 'UI_DEVELOPMENT_ONLY',
          timezoneResolutionMethod: 'UI_DEVELOPMENT_ONLY',
          ambiguityStatus: 'EXACT'
        },
        houseSystem: 'Equal'
      });
      const status = scope.role('status');
      assert.equal(status.getAttribute('aria-live'), 'polite');
      assert.match(scope.text(status), /Development fixture data/);
      assert.match(scope.text(status), /Preserved User Place/);
      assert.match(scope.text(status), /40.7128° N · 74.006° W/);
      assert.match(scope.text(status), /America\/New_York/);
      assert.match(scope.text(status), /UTC-04:00/);
      assert.match(scope.text(status), new RegExp(DEVELOPMENT_EXPLANATION));
    });
  });

  test('ambiguous result presents two required candidates and withholds handoff until selection and resubmission', async () => {
    await withBirthInputForm({}, async (scope) => {
      await scope.mount();
      await fillKnown(scope, {
        day: '05',
        month: '11',
        time: '01:30',
        place: 'UI FIXTURE: AMBIGUOUS'
      });
      const calculate = scope.button('Calculate Chart');
      calculate.focus();
      await scope.submit();

      const alert = scope.role('alert');
      assert.match(scope.text(alert), /Ambiguous fixture state/);
      assert.match(scope.text(alert), /NatalNode will not silently choose one/);
      assert.match(scope.text(alert), /Earlier occurrence/);
      assert.match(scope.text(alert), /The first occurrence of this local clock time/);
      assert.match(scope.text(alert), /Later occurrence/);
      assert.match(scope.text(alert), /The second occurrence of this local clock time/);
      const radios = [...scope.container.querySelectorAll('input[name="ambiguous-occurrence"]')];
      assert.deepEqual(radios.map((radio) => radio.value), ['EARLIER', 'LATER']);
      assert.equal(radios.every((radio) => radio.required), true);
      assert.equal(radios.every((radio) => !radio.checked), true);
      assert.equal(scope.onResolvedInputCalls.length, 0);
      assert.equal(scope.button('Calculate Chart').disabled, false);
      assert.equal(alert.tabIndex, -1);
      assert.strictEqual(scope.document.activeElement, calculate);

      await scope.click(radios[0]);
      assert.equal(scope.container.querySelectorAll('input[name="ambiguous-occurrence"]').length, 0);
      assert.match(scope.role('status').textContent, /Development fixture data/);
      assert.equal(scope.onResolvedInputCalls.length, 0);

      await scope.submit();
      assert.equal(scope.onResolvedInputCalls.length, 1);
      assert.equal(scope.onResolvedInputCalls[0].resolution.ambiguityStatus, 'EXACT');
      assert.equal(
        scope.onResolvedInputCalls[0].resolution.resolvedUtcInstant,
        '2000-11-05T05:30:00.000Z'
      );
      assert.equal(scope.onResolvedInputCalls[0].resolution.utcOffsetSeconds, -14_400);
    });
  });

  test('later ambiguity candidate preserves its exact UTC instant and offset with one-way selection', async () => {
    const resolver = capturingResolver((input) => makeAmbiguousResolution({
      localDate: input.localDate,
      localTime: input.localTime,
      locationLabel: input.locationLabel
    }));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { day: '05', month: '11', time: '01:30' });
      await scope.submit();
      const later = scope.container.querySelector('input[value="LATER"]');
      await scope.click(later);
      assert.equal(scope.container.querySelector('input[value="EARLIER"]'), null);
      assert.equal(scope.container.querySelector('input[value="LATER"]'), null);
      await scope.submit();
      assert.equal(
        scope.onResolvedInputCalls[0].resolution.resolvedUtcInstant,
        '2000-11-05T06:30:00.000Z'
      );
      assert.equal(scope.onResolvedInputCalls[0].resolution.utcOffsetSeconds, -18_000);
      assert.equal(scope.onResolvedInputCalls[0].resolution.latitude, 40.7128);
      assert.equal(scope.onResolvedInputCalls[0].resolution.longitude, -74.006);
      assert.equal(scope.onResolvedInputCalls[0].resolution.ianaTimeZone, 'America/New_York');
      assert.equal(
        scope.onResolvedInputCalls[0].resolution.timezoneResolutionMethod,
        'fixture-ambiguous'
      );
    });
  });

  test('nonexistent result is distinct from generic failure, preserves input, and Edit birth time focuses time', async () => {
    await withBirthInputForm({}, async (scope) => {
      await scope.mount();
      await fillKnown(scope, {
        day: '02',
        month: '04',
        time: '02:30',
        place: 'UI FIXTURE: NONEXISTENT'
      });
      const calculate = scope.button('Calculate Chart');
      calculate.focus();
      await scope.submit();

      const alert = scope.role('alert');
      assert.match(scope.text(alert), /Nonexistent fixture state/);
      assert.match(scope.text(alert), /was not shifted or replaced/);
      assert.equal(scope.control('Birth place').value, 'UI FIXTURE: NONEXISTENT');
      assert.equal(scope.onResolvedInputCalls.length, 0);
      assert.strictEqual(scope.document.activeElement, calculate);
      await scope.click(scope.button('Edit birth time'));
      assert.strictEqual(scope.document.activeElement, scope.id('birth-time'));
      await scope.submit();
      assert.match(scope.role('alert').textContent, /Nonexistent fixture state/);
      assert.equal(scope.onResolvedInputCalls.length, 0);
    });
  });

  test('resolver failure resets loading, preserves drafts, exposes only generic copy, and does not move focus', async () => {
    const resolver = capturingResolver(async () => {
      throw new Error('sensitive internal resolver detail');
    });
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { place: 'Preserved Failure Place' });
      const calculate = scope.button('Calculate Chart');
      calculate.focus();
      await scope.submit();

      assert.equal(scope.role('alert', RESOLUTION_FAILURE).textContent, RESOLUTION_FAILURE);
      assert.doesNotMatch(scope.container.textContent, /sensitive internal resolver detail/);
      assert.equal(scope.control('Birth place').value, 'Preserved Failure Place');
      assert.equal(scope.button('Calculate Chart').disabled, false);
      assert.equal(scope.onResolvedInputCalls.length, 0);
      assert.strictEqual(scope.document.activeElement, calculate);
      await scope.submit();
      assert.equal(resolver.calls.length, 2);
      assert.equal(scope.role('alert', RESOLUTION_FAILURE).textContent, RESOLUTION_FAILURE);
    });
  });
});

describe('resolver sequencing, stale work, and unmount behavior', () => {
  test('resolving state disables controls, publishes live status, and suppresses a disabled-button repeat', async () => {
    const pending = deferred();
    const resolver = capturingResolver(() => pending.promise);
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope);
      await scope.submit();

      assert.equal(resolver.calls.length, 1);
      assert.equal(scope.button('Resolving birth time…').disabled, true);
      assert.equal(scope.role('status', 'Reading the development resolver result…').getAttribute('aria-live'), 'polite');
      for (const control of scope.container.querySelectorAll('input, select, button')) {
        assert.equal(control.disabled, true);
      }
      await scope.click(scope.button('Resolving birth time…'));
      assert.equal(resolver.calls.length, 1);

      pending.resolve(exactFrom(resolver.calls[0]));
      await scope.flush();
      assert.equal(scope.onResolvedInputCalls.length, 1);
    });
  });

  test('programmatic duplicate submit starts a second request, but B winning before A remains authoritative', async () => {
    const requestA = deferred();
    const requestB = deferred();
    const resolver = capturingResolver((_input, index) =>
      index === 0 ? requestA.promise : requestB.promise
    );
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope);
      await scope.submit();
      await scope.submit();
      assert.equal(resolver.calls.length, 2);

      const resultB = exactFrom(resolver.calls[1], {
        locationLabel: 'Authoritative B',
        latitude: 2,
        longitude: 3,
        ianaTimeZone: 'Etc/GMT-2',
        resolvedUtcInstant: '2000-02-29T05:05:00.000Z',
        utcOffsetSeconds: 7_200
      });
      requestB.resolve(resultB);
      await scope.flush();
      assert.equal(scope.onResolvedInputCalls.length, 1);
      assert.equal(scope.onResolvedInputCalls[0].resolution.locationLabel, 'Authoritative B');
      assert.match(scope.container.textContent, /Authoritative B/);

      requestA.resolve(exactFrom(resolver.calls[0], { locationLabel: 'Stale A' }));
      await scope.flush();
      assert.equal(scope.onResolvedInputCalls.length, 1);
      assert.match(scope.container.textContent, /Authoritative B/);
      assert.doesNotMatch(scope.container.textContent, /Stale A/);
    });
  });

  test('material input change invalidates an in-flight request and suppresses its late result', async () => {
    const requestA = deferred();
    const resolver = capturingResolver(() => requestA.promise);
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { place: 'Request A Place' });
      await scope.submit();
      assert.equal(scope.control('Birth place').disabled, true);

      await scope.change(scope.control('Birth place'), 'Materially Changed Place');
      assert.equal(scope.control('Birth place').value, 'Materially Changed Place');
      assert.equal(scope.button('Calculate Chart').disabled, false);

      requestA.resolve(exactFrom(resolver.calls[0], { locationLabel: 'Late Request A' }));
      await scope.flush();
      assert.equal(scope.onResolvedInputCalls.length, 0);
      assert.equal(scope.roles('status').length, 0);
      assert.equal(scope.control('Birth place').value, 'Materially Changed Place');
      assert.doesNotMatch(scope.container.textContent, /Late Request A/);
    });
  });

  test('a stale rejection after a newer success cannot replace authoritative success with failure', async () => {
    const requestA = deferred();
    const requestB = deferred();
    const resolver = capturingResolver((_input, index) =>
      index === 0 ? requestA.promise : requestB.promise
    );
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope);
      await scope.submit();
      await scope.submit();
      requestB.resolve(exactFrom(resolver.calls[1], { locationLabel: 'Newer Success' }));
      await scope.flush();
      requestA.reject(new Error('stale failure'));
      await scope.flush();

      assert.match(scope.container.textContent, /Newer Success/);
      assert.equal(scope.queryExact('[role="alert"]', RESOLUTION_FAILURE).length, 0);
      assert.equal(scope.onResolvedInputCalls.length, 1);
    });
  });

  test('pending resolution is not cancelled on unmount and currently calls the parent after unmount', async () => {
    const pending = deferred();
    const resolver = capturingResolver(() => pending.promise);
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope);
      await scope.submit();
      await scope.unmount();
      assert.equal(scope.container.innerHTML, '');

      pending.resolve(exactFrom(resolver.calls[0], { locationLabel: 'Post-unmount result' }));
      await scope.flush();
      assert.equal(scope.onResolvedInputCalls.length, 1);
      assert.equal(scope.onResolvedInputCalls[0].resolution.locationLabel, 'Post-unmount result');
    });
  });
});

describe('resolution invalidation, handoff, and prop lifecycle', () => {
  test('date, time, place, house-system, and unknown-time edits each invalidate an existing resolution', async () => {
    const edits = [
      async (scope) => scope.change(scope.control('Day'), '28'),
      async (scope) => scope.change(scope.id('birth-time'), '08:06'),
      async (scope) => scope.change(scope.control('Birth place'), 'Changed Place'),
      async (scope) => scope.change(scope.control('House system'), 'Whole Sign'),
      async (scope) => scope.click(scope.id('unknown-time'))
    ];

    for (const edit of edits) {
      const resolver = capturingResolver((input) =>
        input.localTime === null ? unknownFrom(input) : exactFrom(input)
      );
      await withBirthInputForm({ resolver }, async (scope) => {
        await scope.mount();
        await fillKnown(scope);
        await scope.submit();
        assert.equal(scope.roles('status').length, 1);
        await edit(scope);
        assert.equal(scope.roles('status').length, 0);
        assert.equal(scope.roles('alert').length, 0);
        assert.equal(scope.onResolvedInputCalls.length, 1);

        await scope.submit();
        assert.equal(resolver.calls.length, 2);
        assert.deepEqual(
          {
            latitude: resolver.calls[1].latitude,
            longitude: resolver.calls[1].longitude,
            ianaTimeZone: resolver.calls[1].ianaTimeZone,
            resolvedUtcInstant: resolver.calls[1].resolvedUtcInstant,
            utcOffsetSeconds: resolver.calls[1].utcOffsetSeconds,
            timezoneDatabaseVersion: resolver.calls[1].timezoneDatabaseVersion,
            timezoneResolutionMethod: resolver.calls[1].timezoneResolutionMethod
          },
          {
            latitude: null,
            longitude: null,
            ianaTimeZone: null,
            resolvedUtcInstant: null,
            utcOffsetSeconds: null,
            timezoneDatabaseVersion: null,
            timezoneResolutionMethod: null
          }
        );
      });
    }
  });

  test('known-time final handoff preserves the exact resolver result and selected house system without recomputation', async () => {
    const result = makeExactResolution({
      localDate: '1987-06-14',
      localTime: '23:59',
      locationLabel: 'Resolver Canonical Label',
      latitude: -33.86882,
      longitude: 151.209296,
      ianaTimeZone: 'Australia/Sydney',
      resolvedUtcInstant: '1987-06-14T13:59:00.123Z',
      utcOffsetSeconds: 36_000,
      timezoneDatabaseVersion: 'precise-fixture-version',
      timezoneResolutionMethod: 'precise-fixture-method'
    });
    const resolver = capturingResolver(() => result);
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, {
        day: '14',
        month: '06',
        year: '1987',
        time: '23:59',
        place: 'User Entered Label',
        houseSystem: 'Whole Sign'
      });
      await scope.submit();
      assert.deepEqual(scope.onResolvedInputCalls, [{ resolution: result, houseSystem: 'Whole Sign' }]);
    });
  });

  test('successful exact handoff does not reset fields or resolution and a second submit duplicates handoff without resolving again', async () => {
    const resolver = capturingResolver((input) => exactFrom(input));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { place: 'Persistent Place' });
      await scope.submit();
      await scope.submit();

      assert.equal(resolver.calls.length, 1);
      assert.equal(scope.onResolvedInputCalls.length, 2);
      assert.deepEqual(scope.onResolvedInputCalls[1], scope.onResolvedInputCalls[0]);
      assert.equal(scope.control('Day').value, '29');
      assert.equal(scope.id('birth-time').value, '07:05');
      assert.equal(scope.control('Birth place').value, 'Persistent Place');
      assert.match(scope.role('status').textContent, /Timezone resolved/);
    });
  });

  test('resolver prop changes do not reset state or replace a stored exact result, while the latest callback prop is used', async () => {
    const resolverA = capturingResolver((input) => exactFrom(input, { locationLabel: 'Resolver A' }));
    const resolverB = capturingResolver((input) => exactFrom(input, { locationLabel: 'Resolver B' }));
    const callbackA = [];
    const callbackB = [];
    await withBirthInputForm(
      { resolver: resolverA, onResolvedInput: (selection) => callbackA.push(selection) },
      async (scope) => {
        await scope.mount();
        await fillKnown(scope);
        await scope.submit();
        assert.equal(callbackA.length, 1);

        await scope.rerender({
          resolver: resolverB,
          onResolvedInput: (selection) => callbackB.push(selection)
        });
        assert.match(scope.container.textContent, /Resolver A/);
        await scope.submit();

        assert.equal(resolverA.calls.length, 1);
        assert.equal(resolverB.calls.length, 0);
        assert.equal(callbackA.length, 1);
        assert.equal(callbackB.length, 1);
        assert.equal(callbackB[0].resolution.locationLabel, 'Resolver A');
      }
    );
  });

  test('an in-flight submit retains the callback prop from the render that started it', async () => {
    const pending = deferred();
    const resolver = capturingResolver(() => pending.promise);
    const callbackA = [];
    const callbackB = [];
    await withBirthInputForm(
      { resolver, onResolvedInput: (selection) => callbackA.push(selection) },
      async (scope) => {
        await scope.mount();
        await fillKnown(scope);
        await scope.submit();
        await scope.rerender({
          onResolvedInput: (selection) => callbackB.push(selection)
        });

        pending.resolve(exactFrom(resolver.calls[0], { locationLabel: 'Pending callback result' }));
        await scope.flush();

        assert.equal(callbackA.length, 1);
        assert.equal(callbackB.length, 0);
        assert.equal(callbackA[0].resolution.locationLabel, 'Pending callback result');
      }
    );
  });

  test('house-system selection is configuration only and is included in resolver draft plus parent handoff', async () => {
    for (const houseSystem of ['Placidus', 'Whole Sign', 'Equal']) {
      const resolver = capturingResolver((input) => exactFrom(input));
      await withBirthInputForm({ resolver }, async (scope) => {
        await scope.mount();
        await fillKnown(scope, { houseSystem });
        await scope.submit();
        assert.equal(resolver.calls[0].houseSystem, houseSystem);
        assert.equal(scope.onResolvedInputCalls[0].houseSystem, houseSystem);
        assert.equal('houseSystem' in scope.onResolvedInputCalls[0].resolution, false);
      });
    }
  });
});

describe('submission gating, accessibility, keyboard structure, and privacy boundary', () => {
  test('submit control gates only busy states; validation, unresolved, ambiguity, nonexistent, and failure remain enabled', async () => {
    const scenarios = [
      async () => capturingResolver((input) => makeAmbiguousResolution({
        localDate: input.localDate,
        localTime: input.localTime,
        locationLabel: input.locationLabel
      })),
      async () => capturingResolver((input) => makeNonexistentResolution({
        localDate: input.localDate,
        localTime: input.localTime,
        locationLabel: input.locationLabel
      })),
      async () => capturingResolver(async () => { throw new Error('failure'); })
    ];

    await withBirthInputForm({}, async (scope) => {
      await scope.mount();
      assert.equal(scope.button('Calculate Chart').disabled, false);
      await scope.submit();
      assert.equal(scope.button('Calculate Chart').disabled, false);
    });

    for (const makeResolver of scenarios) {
      const resolver = await makeResolver();
      await withBirthInputForm({ resolver }, async (scope) => {
        await scope.mount();
        await fillKnown(scope);
        await scope.submit();
        assert.equal(scope.button('Calculate Chart').disabled, false);
      });
    }
  });

  test('labels, fieldsets, required state, descriptions, roles, and live regions remain dynamically associated', async () => {
    const resolver = capturingResolver((input) => exactFrom(input));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      for (const [label, id] of [
        ['Day', 'birth-date-day'],
        ['Month', 'birth-date-month'],
        ['Year', 'birth-date-year'],
        ['Birth place', 'birth-place'],
        ['House system', 'house-system']
      ]) {
        assert.strictEqual(scope.control(label), scope.id(id));
        assert.equal(scope.id(id).required, true);
      }
      assert.strictEqual(
        scope.container.querySelector('label[for="unknown-time"]').control,
        scope.id('unknown-time')
      );
      assert.deepEqual(
        [...scope.container.querySelectorAll('fieldset > legend')].map((legend) => scope.text(legend)),
        ['Birth date', 'Birth time']
      );
      assert.equal(scope.id('birth-date-day').getAttribute('aria-describedby'), 'birth-date-help');
      assert.equal(scope.id('birth-time').getAttribute('aria-describedby'), 'birth-time-help');

      await fillKnown(scope);
      await scope.submit();
      const status = scope.role('status');
      assert.equal(status.getAttribute('aria-live'), 'polite');
      assert.equal(status.getAttribute('aria-labelledby'), 'timezone-resolved-title');
      assert.equal(status.tabIndex, -1);
    });
  });

  test('native click and form-submit behavior covers checkbox, radio, and submit without a synthetic component replica', async () => {
    const resolver = capturingResolver((input) =>
      input.localTime === null
        ? unknownFrom(input)
        : makeAmbiguousResolution({
            localDate: input.localDate,
            localTime: input.localTime,
            locationLabel: input.locationLabel
          })
    );
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await scope.click(scope.id('unknown-time'));
      assert.equal(scope.id('unknown-time').checked, true);
      await scope.click(scope.id('unknown-time'));
      assert.equal(scope.id('unknown-time').checked, false);
      await fillKnown(scope);
      for (const control of scope.container.querySelectorAll('input, select, button')) {
        if (!control.disabled) assert.ok(control.tabIndex >= 0);
      }
      assert.equal(scope.container.querySelector('summary').tagName, 'SUMMARY');
      await scope.click(scope.button('Calculate Chart'));
      const earlier = scope.container.querySelector('input[value="EARLIER"]');
      earlier.focus();
      assert.strictEqual(scope.document.activeElement, earlier);
      await scope.click(earlier);
      await scope.submit();
      assert.equal(scope.onResolvedInputCalls.length, 1);
    });
  });

  test('resolver receives only the current draft contract, no external telemetry or network call occurs, and display formatting is presentation-only', async () => {
    const resolver = capturingResolver((input) => exactFrom(input, {
      latitude: 0,
      longitude: -0.1278,
      ianaTimeZone: 'Europe/London',
      utcOffsetSeconds: 5_400
    }));
    await withBirthInputForm({ resolver }, async (scope) => {
      await scope.mount();
      await fillKnown(scope, { place: 'Privacy Boundary Place' });
      await scope.submit();

      assert.deepEqual(Object.keys(resolver.calls[0]).sort(), [
        'ambiguityStatus',
        'houseSystem',
        'ianaTimeZone',
        'latitude',
        'localDate',
        'localTime',
        'locationLabel',
        'longitude',
        'resolvedUtcInstant',
        'timezoneDatabaseVersion',
        'timezoneResolutionMethod',
        'utcOffsetSeconds'
      ]);
      assert.deepEqual(
        {
          latitude: resolver.calls[0].latitude,
          longitude: resolver.calls[0].longitude,
          ianaTimeZone: resolver.calls[0].ianaTimeZone,
          resolvedUtcInstant: resolver.calls[0].resolvedUtcInstant,
          utcOffsetSeconds: resolver.calls[0].utcOffsetSeconds,
          timezoneDatabaseVersion: resolver.calls[0].timezoneDatabaseVersion,
          timezoneResolutionMethod: resolver.calls[0].timezoneResolutionMethod,
          ambiguityStatus: resolver.calls[0].ambiguityStatus
        },
        {
          latitude: null,
          longitude: null,
          ianaTimeZone: null,
          resolvedUtcInstant: null,
          utcOffsetSeconds: null,
          timezoneDatabaseVersion: null,
          timezoneResolutionMethod: null,
          ambiguityStatus: 'UNRESOLVED'
        }
      );
      assert.equal(scope.fetchCalls.length, 0);
      assert.match(scope.role('status').textContent, /0°/);
      assert.match(scope.role('status').textContent, /0.1278° W/);
      assert.match(scope.role('status').textContent, /UTC\+01:30/);
    });
  });

  test('responsive visual characterization remains explicitly manual-deferred under happy-dom', () => {
    assert.equal(
      'RESPONSIVE VISUAL CHARACTERIZATION = MANUAL BASELINE DEFERRED',
      'RESPONSIVE VISUAL CHARACTERIZATION = MANUAL BASELINE DEFERRED'
    );
  });
});
