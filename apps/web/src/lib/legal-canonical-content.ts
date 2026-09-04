import type {
  LegalBlock,
  LegalDocumentDefinition,
  LegalPageId,
  LegalSection
} from './legal-content.js';

const paragraph = (text: string): LegalBlock => Object.freeze({ kind: 'paragraph', text });
const list = (...items: string[]): LegalBlock => Object.freeze({
  kind: 'list',
  items: Object.freeze(items)
});
const section = (
  number: string,
  heading: string,
  ...blocks: LegalBlock[]
): LegalSection => Object.freeze({ number, heading, blocks: Object.freeze(blocks) });

/**
 * Canonical English semantic authority for the approved pre-commercial legal
 * baseline. Unresolved values are intentionally retained as explicit tokens.
 */
export const CANONICAL_LEGAL_DOCUMENTS = Object.freeze({
  privacy: Object.freeze({
    page: 'privacy',
    locale: 'en',
    title: 'Privacy Policy',
    description: 'This Privacy Policy explains what personal information NatalNode collects, why it is processed, how it is used and disclosed, how long it may be retained, and the choices and rights available to you.',
    canonicalSourceId: 'NATALNODE_PRIVACY_POLICY_V1',
    effectiveDate: '[EFFECTIVE_DATE]',
    introduction: Object.freeze([
      'NatalNode provides astrological charting, educational, informational, and interpretive tools through natalnode.com and related services (the “Service”).',
      'This Privacy Policy explains what personal information NatalNode collects, why it is processed, how it is used and disclosed, how long it may be retained, and the choices and rights available to you.',
      'For purposes of applicable data protection law, the operator identified below is the controller or responsible business for personal information processed through the Service.',
      'Operator: [OPERATOR_LEGAL_NAME]\nRegistered address: [OPERATOR_ADDRESS]\nPrivacy contact: [PRIVACY_CONTACT_EMAIL]',
      'These operator details must be completed before public commercial launch.'
    ]),
    sections: Object.freeze([
      section(
        '1',
        'Information We Collect',
        paragraph('1.1 Account information'),
        paragraph('If you create or use an account, we may process information such as:'),
        list(
          'email address;',
          'authentication identifiers;',
          'account status;',
          'authentication and security records;',
          'account preferences and settings.'
        ),
        paragraph('Where third-party sign-in is offered, we receive only the information necessary to authenticate or operate the account as permitted by that provider and your settings.'),
        paragraph('1.2 Birth and chart information'),
        paragraph('To provide chart-related features, you may provide information including:'),
        list(
          'birth date;',
          'birth time, where known;',
          'birthplace or location query;',
          'selected canonical birthplace;',
          'geographic coordinates derived from the selected location;',
          'IANA timezone identity;',
          'time-resolution information required to establish the relevant instant;',
          'chart configuration choices;',
          'resulting chart data and related interpretations.'
        ),
        paragraph('NatalNode treats birth and chart information as privacy-sensitive product information even where a particular law does not classify every component as legally sensitive personal information.'),
        paragraph('If birth time is unknown, NatalNode may preserve that state as unknown rather than inventing a substitute time.'),
        paragraph('1.3 Saved charts and Vault information'),
        paragraph('If you choose to save charts or related material to a Vault or similar account feature, we may store:'),
        list(
          'chart inputs;',
          'chart results;',
          'labels or names you assign;',
          'associated notes or settings;',
          'timestamps and account relationships necessary to operate the saved feature.'
        ),
        paragraph('Saving information is separate from merely entering information for a calculation where the product architecture permits transient use.'),
        paragraph('1.4 Information about other people'),
        paragraph('The Service may allow you to enter information relating to another person, for example when creating or comparing charts.'),
        paragraph('You are responsible for ensuring that you have an appropriate lawful basis or permission to provide another person’s personal information to NatalNode.'),
        paragraph('You should not submit information about another person when you do not have a legitimate reason or appropriate authority to do so.'),
        paragraph('1.5 Community, practitioner, feedback, and other submissions'),
        paragraph('Where these features are available, we may process information you voluntarily submit through:'),
        list(
          'community questions or discussions;',
          'practitioner profiles or applications;',
          'moderation processes;',
          'feedback forms;',
          'support communications;',
          'reports or other user-generated submissions.'
        ),
        paragraph('Public submissions may be visible to other users as indicated by the relevant feature.'),
        paragraph('1.6 Technical and security information'),
        paragraph('When you use the Service, servers and security systems may automatically process information such as:'),
        list(
          'IP address;',
          'request timestamps;',
          'browser and device information;',
          'operating-system information;',
          'requested routes;',
          'session and authentication events;',
          'security events;',
          'diagnostic and error information;',
          'coarse network or regional information when required for security or service delivery.'
        ),
        paragraph('NatalNode does not require precise device geolocation merely to infer your birthplace. Birthplace authority is established through explicit location input and candidate selection.'),
        paragraph('1.7 Cookies and similar technologies'),
        paragraph('NatalNode may use cookies or equivalent local technologies that are necessary to:'),
        list(
          'maintain authentication sessions;',
          'preserve security;',
          'prevent abuse;',
          'remember essential preferences;',
          'provide core Service functionality.'
        ),
        paragraph('Non-essential analytics, advertising, or cross-site tracking technologies will not be introduced without the disclosures and controls required by applicable law.')
      ),
      section(
        '2',
        'How We Use Personal Information',
        paragraph('We may process personal information to:'),
        list(
          'provide requested charting and related Service functionality;',
          'resolve user-entered places into canonical locations;',
          'establish the time information required for requested chart calculations;',
          'create and manage accounts;',
          'operate saved-chart and Vault functionality;',
          'provide community, practitioner, feedback, or support features;',
          'authenticate users and maintain sessions;',
          'secure the Service and detect fraud, abuse, attacks, or technical failures;',
          'diagnose and improve reliability, accessibility, and performance;',
          'communicate with you about your account or the Service;',
          'comply with legal obligations and enforce our Terms;',
          'protect the rights, safety, and integrity of users, NatalNode, and others.'
        ),
        paragraph('NatalNode does not use personal birth information to fabricate astronomical facts when authoritative calculation inputs or services are unavailable.')
      ),
      section(
        '3',
        'Legal Bases for Processing',
        paragraph('Where laws such as the GDPR require a legal basis, NatalNode relies as appropriate on:'),
        paragraph('Performance of a contract or steps requested by you — for example, providing an account, generating a requested chart, resolving a requested location, or maintaining content you choose to save.'),
        paragraph('Legitimate interests — for example, operating and securing the Service, detecting abuse, debugging failures, maintaining network and information security, and improving reliability where those interests are not overridden by your rights.'),
        paragraph('Consent — where consent is legally required, including for optional communications or non-essential technologies.'),
        paragraph('Legal obligations — where processing is necessary to comply with applicable law, valid legal process, accounting requirements, or regulatory duties.')
      ),
      section(
        '4',
        'Location Resolution and GeoNames',
        paragraph('NatalNode may use GeoNames or another approved location-information provider to help convert place searches into structured location candidates.'),
        paragraph('Location-resolution information may include:'),
        list(
          'the place query you submit;',
          'canonical place name;',
          'country and administrative-region information;',
          'latitude and longitude;',
          'timezone identity;',
          'provider record identifiers.'
        ),
        paragraph('NatalNode requires explicit selection where multiple plausible locations exist and does not treat raw user text as authoritative location identity.'),
        paragraph('GeoNames data and web services are provided under an attribution license and GeoNames describes its data as provided “as is.” NatalNode therefore maintains provider attribution where applicable.'),
        paragraph('A location provider establishes place identity and related geographic metadata. It does not by itself establish authoritative historical birth-time offsets or astronomical chart facts.')
      ),
      section(
        '5',
        'Astronomy and Technical Service Providers',
        paragraph('NatalNode may use authorized third-party infrastructure, data, communications, hosting, database, security, email, and astronomy-related providers where necessary to operate the Service.'),
        paragraph('NatalNode seeks to limit data disclosed to service providers to information reasonably necessary for their function.'),
        paragraph('The production astronomy provider will be commercially authorized before relevant production features are launched.'),
        paragraph('A current list of material third-party services or subprocessors may be maintained separately and updated when providers change.'),
        paragraph('Changing an infrastructure or astronomy provider does not authorize NatalNode to use your information for an unrelated purpose.')
      ),
      section(
        '6',
        'How We Disclose Personal Information',
        paragraph('NatalNode may disclose personal information to the following categories of recipients where necessary:'),
        paragraph('Service providers'),
        paragraph('Companies that provide infrastructure or operational services such as:'),
        list(
          'hosting;',
          'databases;',
          'authentication;',
          'email delivery;',
          'security;',
          'diagnostics;',
          'location resolution;',
          'authorized astronomical-data infrastructure;',
          'payment processing if paid products are offered.'
        ),
        paragraph('They receive information only for the relevant operational purpose and are subject to applicable contractual or legal obligations.'),
        paragraph('Other users'),
        paragraph('Information is disclosed to other users only when you intentionally use a public or collaborative feature, such as public community content or a public practitioner profile.'),
        paragraph('Private Vault information is not made public merely because it is saved.'),
        paragraph('Legal and safety disclosures'),
        paragraph('Information may be disclosed where reasonably necessary to:'),
        list(
          'comply with applicable law or valid legal process;',
          'respond to lawful government requests;',
          'investigate fraud or abuse;',
          'protect the security of the Service;',
          'protect legal rights or safety.'
        ),
        paragraph('Business transfers'),
        paragraph('If NatalNode or substantially all relevant assets are reorganized, financed, acquired, merged, transferred, or sold, personal information may be transferred as part of that transaction subject to applicable law and appropriate protections.'),
        paragraph('If the Service moves from an individual founder-held development structure to a later operating entity, required notices and controller information will be updated before or as required by that transition.')
      ),
      section(
        '7',
        'Sale and Advertising Use of Personal Information',
        paragraph('NatalNode does not sell personal information for money.'),
        paragraph('NatalNode does not use birth or chart information for third-party cross-context behavioral advertising.'),
        paragraph('If NatalNode later introduces advertising or data practices that constitute “sale,” “sharing,” or targeted advertising under applicable privacy law, those practices will not begin without updating the applicable notice and providing any required consent or opt-out controls.')
      ),
      section(
        '8',
        'Data Retention',
        paragraph('NatalNode retains personal information only for as long as reasonably necessary for the purpose for which it was collected, including:'),
        list(
          'operating an active account;',
          'maintaining information you have chosen to save;',
          'providing requested services;',
          'maintaining security and abuse-prevention records;',
          'resolving disputes;',
          'enforcing agreements;',
          'meeting legal, accounting, or regulatory obligations.'
        ),
        paragraph('When an account or saved item is deleted, associated information will be deleted or de-identified according to the applicable deletion process, subject to legitimate backup, security, fraud-prevention, legal, or compliance retention requirements.'),
        paragraph('Backups may retain information for a limited period until normal backup rotation completes.'),
        paragraph('NatalNode will maintain an internal retention schedule appropriate to the production architecture rather than retain information indefinitely without purpose.')
      ),
      section(
        '9',
        'International Data Transfers',
        paragraph('NatalNode is intended as an international service and its infrastructure or service providers may operate in countries different from the country in which you live.'),
        paragraph('Where applicable law requires safeguards for international transfers, NatalNode will use legally recognized mechanisms appropriate to the transfer, such as:'),
        list(
          'adequacy decisions;',
          'contractual safeguards;',
          'approved standard contractual clauses;',
          'other lawful transfer mechanisms.'
        ),
        paragraph('Specific production hosting regions and relevant subprocessors must be reviewed before launch.')
      ),
      section(
        '10',
        'Your Privacy Rights',
        paragraph('Depending on where you live and applicable law, you may have rights to:'),
        list(
          'request access to personal information;',
          'obtain information about its processing;',
          'correct inaccurate information;',
          'request deletion;',
          'restrict certain processing;',
          'object to certain processing;',
          'receive certain information in a portable form;',
          'withdraw consent where processing is based on consent;',
          'opt out of certain sale, sharing, or targeted-advertising practices where applicable;',
          'appeal certain privacy decisions where applicable;',
          'lodge a complaint with an appropriate data-protection authority.'
        ),
        paragraph('To exercise an applicable privacy right, contact:'),
        paragraph('[PRIVACY_CONTACT_EMAIL]'),
        paragraph('NatalNode may need to verify your identity before fulfilling certain requests and will use verification information only as appropriate for that process.'),
        paragraph('We will not unlawfully discriminate against you for exercising applicable privacy rights.')
      ),
      section(
        '11',
        'Security',
        paragraph('NatalNode will use reasonable technical and organizational measures designed to protect personal information against:'),
        list(
          'unauthorized access;',
          'unauthorized disclosure;',
          'alteration;',
          'accidental loss;',
          'destruction;',
          'misuse.'
        ),
        paragraph('Security measures will be proportionate to the nature of the information and production architecture.'),
        paragraph('No system, storage mechanism, network transmission, or online service can be guaranteed absolutely secure.')
      ),
      section(
        '12',
        'Children',
        paragraph('NatalNode is not directed to children under 13.'),
        paragraph('You must be at least 13 years old to use the Service.'),
        paragraph('Where applicable law requires a higher age for a person to consent independently to the processing of personal information or use an online service, that higher minimum applies.'),
        paragraph('NatalNode does not knowingly seek to collect personal information from children under 13. If we learn that such information has been collected contrary to applicable requirements, we will take appropriate steps to delete or otherwise address it.')
      ),
      section(
        '13',
        'Automated and Interpretive Outputs',
        paragraph('NatalNode may generate or present astrological interpretations based on structured chart information.'),
        paragraph('Such interpretation does not mean that NatalNode makes legally significant decisions about you.'),
        paragraph('NatalNode does not use astrological interpretation to determine eligibility for employment, credit, housing, insurance, healthcare, education, or similar high-impact decisions.'),
        paragraph('If materially different automated decision-making is introduced in the future, this Policy will be updated as required before that use begins.')
      ),
      section(
        '14',
        'Changes to This Privacy Policy',
        paragraph('NatalNode may update this Policy as the Service, law, infrastructure, or data practices change.'),
        paragraph('Material changes will be communicated in an appropriate manner.'),
        paragraph('The effective date at the top of the Policy will identify the current version.'),
        paragraph('Changes will not retroactively authorize materially incompatible uses of personal information where additional consent or another legal basis is required.')
      ),
      section(
        '15',
        'Contact',
        paragraph('Privacy questions and requests:'),
        paragraph('[PRIVACY_CONTACT_EMAIL]'),
        paragraph('General support:'),
        paragraph('[SUPPORT_CONTACT_EMAIL]'),
        paragraph('Operator:'),
        paragraph('[OPERATOR_LEGAL_NAME]\n[OPERATOR_ADDRESS]'),
        paragraph('These production identity fields must be finalized before public commercial launch.')
      )
    ])
  }),
  terms: Object.freeze({
    page: 'terms',
    locale: 'en',
    title: 'Terms of Service',
    description: 'These Terms of Service govern your access to and use of natalnode.com and related NatalNode services, software, features, content, and tools.',
    canonicalSourceId: 'NATALNODE_TERMS_OF_SERVICE_V1',
    effectiveDate: '[EFFECTIVE_DATE]',
    introduction: Object.freeze([
      'These Terms of Service (“Terms”) govern your access to and use of natalnode.com and related NatalNode services, software, features, content, and tools (collectively, the “Service”).',
      'The Service is operated under the NatalNode name by:',
      '[OPERATOR_LEGAL_NAME]\n[OPERATOR_ADDRESS]',
      'By using the Service, you agree to these Terms.',
      'If you do not agree, do not use the Service.'
    ]),
    sections: Object.freeze([
      section(
        '1',
        'Eligibility',
        paragraph('You must be at least 13 years old to use NatalNode.'),
        paragraph('If applicable law requires you to be older to enter into these Terms or consent independently to relevant data processing, the higher age requirement applies.'),
        paragraph('If you use NatalNode on behalf of an organization, you represent that you have authority to bind that organization.')
      ),
      section(
        '2',
        'What NatalNode Provides',
        paragraph('NatalNode provides astrological charting, educational, informational, analytical, and interpretive tools.'),
        paragraph('Features may include:'),
        list(
          'natal chart tools;',
          'chart visualization;',
          'educational astrology content;',
          'structured chart facts;',
          'location and time-resolution tools;',
          'saved charts or Vault functionality;',
          'Discover and Learn experiences;',
          'community or practitioner features;',
          'other related tools introduced over time.'
        ),
        paragraph('Not every feature is necessarily available at every time or in every region.')
      ),
      section(
        '3',
        'Astronomy and Astrological Interpretation',
        paragraph('NatalNode distinguishes between:'),
        list(
          'astronomical and chart-calculation correctness, and',
          'astrological interpretation.'
        ),
        paragraph('NatalNode is designed to use authoritative calculation and data pipelines for astronomical and chart facts when such facts are presented as authoritative.'),
        paragraph('NatalNode does not intentionally fabricate authoritative chart facts when required information or an authorized calculation source is unavailable.'),
        paragraph('However, astrology is an interpretive framework. NatalNode does not represent astrological interpretations as scientifically established predictions of an individual’s personality, behavior, relationships, health, future events, or life outcomes.'),
        paragraph('Outputs should be understood as educational, informational, and interpretive material.')
      ),
      section(
        '4',
        'No Professional Advice',
        paragraph('NatalNode is not a substitute for qualified professional judgment.'),
        paragraph('The Service does not provide:'),
        list(
          'medical advice;',
          'mental-health or psychological diagnosis or treatment;',
          'legal advice;',
          'financial or investment advice;',
          'tax advice;',
          'emergency or crisis services.'
        ),
        paragraph('Do not delay, replace, or disregard professional care or professional advice based on an astrological interpretation.'),
        paragraph('Do not use NatalNode as the sole basis for decisions that could materially affect health, safety, legal rights, finances, employment, housing, education, or other high-impact matters.')
      ),
      section(
        '5',
        'Birth Information and Accuracy of Inputs',
        paragraph('Chart results depend on the information supplied and the applicable calculation configuration.'),
        paragraph('You are responsible for the accuracy of information you provide, including:'),
        list(
          'birth date;',
          'birth time;',
          'birthplace;',
          'selected location;',
          'other requested configuration.'
        ),
        paragraph('A small difference in birth time, location, timezone resolution, calculation configuration, or source data may affect a chart.'),
        paragraph('If birth time is unknown, NatalNode may restrict or omit results that cannot truthfully be established without it rather than substitute an invented time.'),
        paragraph('NatalNode does not guarantee that user-supplied birth information is accurate.')
      ),
      section(
        '6',
        'Information About Other People',
        paragraph('You may use NatalNode only with personal information that you are lawfully entitled to provide.'),
        paragraph('If you submit another person’s birth information or other personal information, you represent that you have an appropriate lawful basis, legitimate reason, or permission to do so.'),
        paragraph('You may not use NatalNode to collect, expose, harass, stalk, profile, or exploit another person without lawful justification.')
      ),
      section(
        '7',
        'Location and Third-Party Data',
        paragraph('NatalNode may use third-party geographic or infrastructure services, including GeoNames or successor providers, to support location resolution.'),
        paragraph('Third-party data may contain errors, omissions, delays, or ambiguities.'),
        paragraph('NatalNode may require you to choose explicitly between multiple candidate places rather than guessing the intended location.'),
        paragraph('Third-party geographic data does not itself establish every aspect of historical time authority or astronomical calculation.')
      ),
      section(
        '8',
        'Accounts',
        paragraph('Some features may require an account.'),
        paragraph('You are responsible for:'),
        list(
          'maintaining control of your authentication method;',
          'providing accurate account information;',
          'protecting account access;',
          'notifying NatalNode of suspected unauthorized access;',
          'activity performed through your account except to the extent caused by NatalNode or circumstances for which applicable law places responsibility elsewhere.'
        ),
        paragraph('You may not transfer, sell, rent, or misuse an account in violation of these Terms.')
      ),
      section(
        '9',
        'Vault and Saved Content',
        paragraph('If NatalNode offers saved charts, notes, or Vault functionality, you control whether to save eligible information.'),
        paragraph('Storage is not guaranteed to be permanent.'),
        paragraph('You should keep independent copies of information that is important to you where appropriate.'),
        paragraph('NatalNode may impose reasonable technical limits, storage limits, or product-tier limits, but scientific or calculation accuracy will not intentionally be degraded based on subscription tier.')
      ),
      section(
        '10',
        'Community and User Content',
        paragraph('Where NatalNode permits you to submit text, profiles, questions, feedback, practitioner information, or other content (“User Content”), you retain ownership of rights you already hold in that User Content.'),
        paragraph('You grant NatalNode a non-exclusive, worldwide, royalty-free license to host, store, reproduce, format, display, distribute, and technically process User Content only as reasonably necessary to:'),
        list(
          'operate the feature in which you submitted it;',
          'display public content you intended to publish;',
          'moderate and secure the Service;',
          'maintain backups;',
          'comply with law;',
          'enforce these Terms.'
        ),
        paragraph('This license ends when the relevant content is deleted, except to the extent continued retention is reasonably required for backups, legal obligations, security records, disputes, or content that has already been lawfully shared or incorporated into interactions with others.'),
        paragraph('You represent that you have the necessary rights to submit User Content.')
      ),
      section(
        '11',
        'Feedback',
        paragraph('If you voluntarily provide suggestions, ideas, bug reports, or product feedback, NatalNode may use that feedback to develop and improve the Service without an obligation to compensate you.'),
        paragraph('This does not transfer ownership of unrelated confidential information or personal information.')
      ),
      section(
        '12',
        'Acceptable Use',
        paragraph('You may not use NatalNode to:'),
        list(
          'violate applicable law;',
          'violate another person’s privacy or intellectual-property rights;',
          'submit information you are not entitled to provide;',
          'harass, threaten, stalk, exploit, or deceive another person;',
          'publish unlawful, abusive, or malicious content;',
          'impersonate another person or organization;',
          'gain unauthorized access to accounts, systems, networks, or data;',
          'bypass security, rate limits, access controls, or technical restrictions;',
          'distribute malware or malicious code;',
          'interfere with availability or integrity of the Service;',
          'scrape or harvest personal information contrary to applicable law or product controls;',
          'reverse engineer protected portions of the Service except where applicable law expressly permits it;',
          'use automated methods in a manner that materially burdens or disrupts the Service;',
          'misrepresent NatalNode output as guaranteed professional, scientific, medical, legal, or financial advice;',
          'use NatalNode outputs to make unauthorized high-impact decisions about another person.'
        ),
        paragraph('NatalNode may take proportionate action against abuse, including limiting access, removing content, or suspending accounts.')
      ),
      section(
        '13',
        'NatalNode Intellectual Property',
        paragraph('Except for User Content and third-party materials, NatalNode and its licensors retain all rights in the Service, including:'),
        list(
          'software;',
          'source and object code;',
          'interfaces;',
          'visual design;',
          'trademarks;',
          'branding;',
          'documentation;',
          'original educational content;',
          'data structures and compilations to the extent protected by law.'
        ),
        paragraph('Subject to these Terms, NatalNode grants you a limited, non-exclusive, non-transferable, revocable right to use the Service for lawful personal or authorized organizational purposes.'),
        paragraph('No ownership rights are transferred to you.')
      ),
      section(
        '14',
        'Third-Party Services and Content',
        paragraph('NatalNode may depend on or link to third-party products, data sources, websites, platforms, or infrastructure.'),
        paragraph('Third-party services are governed by their own terms and policies where applicable.'),
        paragraph('NatalNode is not responsible for a third party’s independent acts, services, availability, policies, or content except where applicable law provides otherwise.'),
        paragraph('The presence of a third-party integration does not imply endorsement of every statement or service offered by that provider.')
      ),
      section(
        '15',
        'Free and Paid Services',
        paragraph('NatalNode may offer free functionality and may later offer paid products or subscriptions.'),
        paragraph('The existence of these Terms does not mean that a paid plan is currently available.'),
        paragraph('If paid services are offered, price, billing period, renewal terms, cancellation rights, taxes, and other transaction-specific terms will be disclosed before purchase as required by applicable law.'),
        paragraph('Nothing in a paid tier permits NatalNode to intentionally provide less accurate authoritative astronomical calculations than those supplied to free users under the same scientific configuration.'),
        paragraph('Consumer rights that cannot lawfully be waived remain unaffected.')
      ),
      section(
        '16',
        'Service Changes and Availability',
        paragraph('NatalNode is an evolving service.'),
        paragraph('We may:'),
        list(
          'add, modify, suspend, or remove features;',
          'update content;',
          'change technical infrastructure;',
          'replace third-party providers;',
          'improve calculation or presentation systems;',
          'impose reasonable operational limits.'
        ),
        paragraph('Where a change materially affects paid contractual rights, personal-data practices, or rights protected by applicable law, NatalNode will provide any notice or remedy required by law.'),
        paragraph('NatalNode does not promise uninterrupted or error-free availability.')
      ),
      section(
        '17',
        'Experimental and Development Features',
        paragraph('Features explicitly labelled as:'),
        list(
          'development;',
          'preview;',
          'beta;',
          'fixture;',
          'experimental;',
          'incomplete research;'
        ),
        paragraph('are not representations that the feature is production-authoritative.'),
        paragraph('Development fixtures must not be treated as real personal astronomical results.'),
        paragraph('Public commercial production must not silently substitute fixture data for unavailable authoritative data.')
      ),
      section(
        '18',
        'Suspension and Termination',
        paragraph('You may stop using the Service at any time.'),
        paragraph('Where account deletion is available, you may request or perform deletion subject to the Privacy Policy and lawful retention requirements.'),
        paragraph('NatalNode may suspend or terminate access where reasonably necessary because of:'),
        list(
          'material violation of these Terms;',
          'unlawful activity;',
          'fraud or abuse;',
          'security threats;',
          'risk to other users or infrastructure;',
          'non-payment of an applicable paid service;',
          'legal requirements.'
        ),
        paragraph('Where appropriate and reasonably possible, NatalNode may provide notice or an opportunity to remedy a violation.')
      ),
      section(
        '19',
        'Disclaimers',
        paragraph('To the maximum extent permitted by applicable law, the Service is provided on an “as available” basis.'),
        paragraph('NatalNode does not warrant that:'),
        list(
          'the Service will always be uninterrupted;',
          'every third-party data source will always be available;',
          'all user-entered information is accurate;',
          'an astrological interpretation will predict or explain an individual outcome;',
          'use of the Service will produce a particular personal, professional, financial, health, relationship, or other result.'
        ),
        paragraph('Nothing in these Terms excludes warranties or consumer rights that cannot legally be excluded.')
      ),
      section(
        '20',
        'Limitation of Liability',
        paragraph('To the maximum extent permitted by applicable law, NatalNode and the applicable operator will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from use of the Service where such exclusion is legally permitted.'),
        paragraph('NatalNode is not responsible for decisions you make solely on the basis of astrological interpretation.'),
        paragraph('For claims where liability may lawfully be limited, aggregate liability arising from the Service will not exceed the greater of:'),
        list(
          'the amount you paid directly to NatalNode for the Service during the 12 months preceding the event giving rise to the claim; or',
          'US$100.'
        ),
        paragraph('This limitation does not apply where liability cannot lawfully be excluded or limited, including any mandatory consumer protections or other non-waivable rights.'),
        paragraph('The final dollar cap remains subject to review when the U.S. operating entity and governing jurisdiction are established.')
      ),
      section(
        '21',
        'Indemnity',
        paragraph('To the extent permitted by applicable law, you agree to indemnify and hold harmless the operator of NatalNode from third-party claims arising from:'),
        list(
          'User Content you unlawfully submit;',
          'your material violation of these Terms;',
          'your unlawful misuse of another person’s information;',
          'your infringement of another person’s rights.'
        ),
        paragraph('This provision does not require you to indemnify NatalNode for conduct for which applicable law makes NatalNode responsible.')
      ),
      section(
        '22',
        'Privacy',
        paragraph('NatalNode’s collection and use of personal information is described in the NatalNode Privacy Policy.'),
        paragraph('The Privacy Policy forms an important part of your understanding of the Service but is not intended to waive rights granted by applicable privacy law.')
      ),
      section(
        '23',
        'Changes to These Terms',
        paragraph('NatalNode may update these Terms as the Service or applicable law changes.'),
        paragraph('Material changes will be communicated in an appropriate manner.'),
        paragraph('If applicable law requires affirmative agreement to a change, the change will not bind you merely because a page was silently updated.'),
        paragraph('The effective date identifies the current version.')
      ),
      section(
        '24',
        'Governing Law and Disputes',
        paragraph('[GOVERNING_LAW_AND_FORUM_CLAUSE]'),
        paragraph('This provision is intentionally deferred until the production operating entity and jurisdiction are established.'),
        paragraph('Before public commercial launch, it must be replaced with a final clause reviewed against:'),
        list(
          'the state in which the U.S. operating entity is organized;',
          'the operator’s actual business nexus;',
          'consumer-protection laws applicable to target markets;',
          'any arbitration or court-forum decision adopted by the Product Owner.'
        ),
        paragraph('Until then, no fictitious jurisdiction is stated.'),
        paragraph('Mandatory consumer rights under applicable law cannot be waived by this placeholder.')
      ),
      section(
        '25',
        'Contact',
        paragraph('General support:'),
        paragraph('[SUPPORT_CONTACT_EMAIL]'),
        paragraph('Legal notices:'),
        paragraph('[LEGAL_CONTACT_EMAIL]'),
        paragraph('Operator:'),
        paragraph('[OPERATOR_LEGAL_NAME]\n[OPERATOR_ADDRESS]'),
        paragraph('These fields must be finalized before public commercial launch.')
      )
    ])
  })
}) satisfies Readonly<Record<LegalPageId, LegalDocumentDefinition>>;
