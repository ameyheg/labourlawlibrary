const crypto = require('node:crypto');
const { initDb, closeDb } = require('./database');
const { hashPassword } = require('../middleware/auth');

function runSeed(customDb = null) {
  const db = customDb || initDb();
  console.log('Beginning database seed with verified Indian Labour Laws...');

  // 1. Seed Users
  const adminSaltHash = hashPassword('Admin@12345!');
  const editorSaltHash = hashPassword('Editor@12345!');
  const proSaltHash = hashPassword('Subscriber@12345!');
  const freeSaltHash = hashPassword('FreeUser@12345!');

  const users = [
    {
      id: 'usr_admin_001',
      email: 'admin@labourlaws.in',
      password_hash: adminSaltHash.hash,
      salt: adminSaltHash.salt,
      full_name: 'Chief Legal Registrar',
      role: 'admin',
      subscription_tier: 'enterprise',
      subscription_status: 'active',
      created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
      updated_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    },
    {
      id: 'usr_editor_001',
      email: 'editor@labourlaws.in',
      password_hash: editorSaltHash.hash,
      salt: editorSaltHash.salt,
      full_name: 'Senior Legal Research Editor',
      role: 'editor',
      subscription_tier: 'pro',
      subscription_status: 'active',
      created_at: new Date('2025-01-02T00:00:00Z').toISOString(),
      updated_at: new Date('2025-01-02T00:00:00Z').toISOString(),
    },
    {
      id: 'usr_pro_001',
      email: 'pro@subscriber.in',
      password_hash: proSaltHash.hash,
      salt: proSaltHash.salt,
      full_name: 'HR Compliance Officer (Corporate)',
      role: 'subscriber',
      subscription_tier: 'pro',
      subscription_status: 'active',
      created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
      updated_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    },
    {
      id: 'usr_free_001',
      email: 'free@subscriber.in',
      password_hash: freeSaltHash.hash,
      salt: freeSaltHash.salt,
      full_name: 'Legal Student / Researcher',
      role: 'subscriber',
      subscription_tier: 'free',
      subscription_status: 'active',
      created_at: new Date('2025-02-15T00:00:00Z').toISOString(),
      updated_at: new Date('2025-02-15T00:00:00Z').toISOString(),
    },
  ];

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, salt, full_name, role, subscription_tier, subscription_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    insertUser.run(u.id, u.email, u.password_hash, u.salt, u.full_name, u.role, u.subscription_tier, u.subscription_status, u.created_at, u.updated_at);
  }

  // 2. Seed Legal Documents
  const documents = [
    {
      id: 'doc_wage_code_2019',
      slug: 'the-code-on-wages-2019',
      title: 'The Code on Wages, 2019',
      short_title: 'Code on Wages, 2019',
      document_number: 'Act No. 29 of 2019',
      document_type: 'code',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Wages & Remuneration',
      publication_date: '2019-08-08',
      effective_date: '2020-12-18',
      legal_status: 'verified',
      superseded_by_id: null,
      official_source_url: 'https://labour.gov.in/sites/default/files/the_code_on_wages_2019_no._29_of_2019.pdf',
      official_citation: 'Gazette of India, Extraordinary, Part II, Section 1, No. 43, dated 8th August, 2019',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'An Act to consolidate and amend the laws relating to wages and bonus and matters connected therewith. Consolidates four erstwhile labour enactments: The Payment of Wages Act 1936, The Minimum Wages Act 1948, The Payment of Bonus Act 1965, and The Equal Remuneration Act 1976 into a single unified statutory framework for all organized and unorganized employees.',
      full_text: `THE CODE ON WAGES, 2019
NO. 29 OF 2019
[8th August, 2019]

An Act to amend and consolidate the laws relating to wages and bonus and matters connected therewith or incidental thereto.
BE it enacted by Parliament in the Seventieth Year of the Republic of India as follows:—

CHAPTER I: PRELIMINARY
1. (1) This Act may be called the Code on Wages, 2019.
(2) It extends to the whole of India.
(3) It shall come into force on such date as the Central Government may, by notification in the Official Gazette, appoint.

2. Definitions:
"wages" means all remuneration whether by way of salaries, allowances or otherwise, expressed in terms of money or capable of being so expressed which would, if the terms of employment, express or implied, were fulfilled, be payable to a person employed in respect of his employment or of work done in such employment. Provided that wages includes basic pay, dearness allowance, and retaining allowance; and excludes statutory bonus, value of house accommodation, conveyance allowance, sum paid to defray special expenses, house rent allowance, overtime allowance, commission, gratuity, and retrenchment compensation (subject to the 50% cap proviso on exclusions).

CHAPTER II: MINIMUM WAGES
6. (1) Subject to the provisions of this Code, the appropriate Government shall fix the minimum rate of wages payable to employees in accordance with the provisions of section 8.
(2) For the purpose of sub-section (1), the appropriate Government shall fix a minimum rate of wages for time work, for piece work, or for a period not exceeding one month.

9. (1) The Central Government may fix a floor wage taking into account minimum living standards of a worker, and the minimum rates of wages fixed by the appropriate Government shall not be less than the floor wage.`,
      download_url: 'https://labour.gov.in/sites/default/files/the_code_on_wages_2019_no._29_of_2019.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_ir_code_2020',
      slug: 'the-industrial-relations-code-2020',
      title: 'The Industrial Relations Code, 2020',
      short_title: 'Industrial Relations Code, 2020',
      document_number: 'Act No. 35 of 2020',
      document_type: 'code',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Industrial Relations & Disputes',
      publication_date: '2020-09-29',
      effective_date: null,
      legal_status: 'verified',
      superseded_by_id: null,
      official_source_url: 'https://labour.gov.in/sites/default/files/IR_Code2020.pdf',
      official_citation: 'Gazette of India, Extraordinary, Part II, Section 1, No. 50, dated 29th September, 2020',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([
        'Central enforcement commencement notification date is pending formal issuance across all States.',
      ]),
      summary: 'An Act to consolidate and amend the laws relating to Trade Unions, conditions of employment in industrial establishment or undertaking, investigation and settlement of industrial disputes and for matters connected therewith or incidental thereto. Replaces The Trade Unions Act 1926, The Industrial Employment (Standing Orders) Act 1946, and The Industrial Disputes Act 1947.',
      full_text: `THE INDUSTRIAL RELATIONS CODE, 2020
NO. 35 OF 2020
[28th September, 2020]

An Act to consolidate and amend the laws relating to Trade Unions, conditions of employment in industrial establishment or undertaking, investigation and settlement of industrial disputes and for matters connected therewith or incidental thereto.
BE it enacted by Parliament in the Seventy-first Year of the Republic of India as follows:—

CHAPTER I: PRELIMINARY
1. (1) This Act may be called the Industrial Relations Code, 2020.
(2) It extends to the whole of India.
(3) It shall come into force on such date as the Central Government may appoint.

CHAPTER III: TRADE UNIONS
4. (1) Any seven or more members of a Trade Union may, by subscribing their names to the rules of the Trade Union and by otherwise complying with the provisions of this Code with respect to registration, apply for registration of the Trade Union under this Code.

CHAPTER IV: STANDING ORDERS
28. (1) The provisions of this Chapter shall apply to every industrial establishment wherein three hundred or more workers, or such number of workers as may be specified by the appropriate Government by notification, are employed, or were employed on any day of the preceding twelve months.`,
      download_url: 'https://labour.gov.in/sites/default/files/IR_Code2020.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_ss_code_2020',
      slug: 'the-code-on-social-security-2020',
      title: 'The Code on Social Security, 2020',
      short_title: 'Code on Social Security, 2020',
      document_number: 'Act No. 36 of 2020',
      document_type: 'code',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Social Security & Benefits',
      publication_date: '2020-09-29',
      effective_date: null,
      legal_status: 'verified',
      superseded_by_id: null,
      official_source_url: 'https://labour.gov.in/sites/default/files/SS_Code_2020.pdf',
      official_citation: 'Gazette of India, Extraordinary, Part II, Section 1, No. 51, dated 29th September, 2020',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([
        'National Social Security Board gig-worker aggregator contribution rates notification is pending final gazette notification.',
      ]),
      summary: 'An Act to amend and consolidate the laws relating to social security with the goal to extend social security to all employees and workers either in the organised or unorganised or any other sectors. Encompasses EPF, ESI, Gratuity, Maternity Benefits, Employee Compensation, and dedicated schemes for Gig and Platform workers.',
      full_text: `THE CODE ON SOCIAL SECURITY, 2020
NO. 36 OF 2020
[28th September, 2020]

An Act to amend and consolidate the laws relating to social security with the goal to extend social security to all employees and workers.

CHAPTER I: PRELIMINARY
1. (1) This Act may be called the Code on Social Security, 2020.
(2) It extends to the whole of India.

CHAPTER IV: EMPLOYEES' STATE INSURANCE CORPORATION
32. (1) The Employees' State Insurance Corporation established under section 3 of the Employees' State Insurance Act, 1948 shall be deemed to have been established under this Code.

CHAPTER IX: SOCIAL SECURITY FOR UNORGANISED WORKERS, GIG WORKERS AND PLATFORM WORKERS
114. (1) The Central Government shall frame and notify, from time to time, suitable welfare schemes for gig workers and platform workers on matters relating to—
(a) life and disability cover;
(b) accident insurance;
(c) health and maternity benefits;
(d) old age protection;
(e) creche; and
(f) any other benefit as may be determined by the Central Government.`,
      download_url: 'https://labour.gov.in/sites/default/files/SS_Code_2020.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_osh_code_2020',
      slug: 'the-occupational-safety-health-and-working-conditions-code-2020',
      title: 'The Occupational Safety, Health and Working Conditions Code, 2020',
      short_title: 'OSHWC Code, 2020',
      document_number: 'Act No. 37 of 2020',
      document_type: 'code',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Occupational Safety & Health',
      publication_date: '2020-09-29',
      effective_date: null,
      legal_status: 'verified',
      superseded_by_id: null,
      official_source_url: 'https://labour.gov.in/sites/default/files/OSH_Code2020.pdf',
      official_citation: 'Gazette of India, Extraordinary, Part II, Section 1, No. 52, dated 29th September, 2020',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([
        'Inter-state migrant worker digitized self-registration portal operating guidelines in progress.',
      ]),
      summary: 'An Act to consolidate and amend the laws regulating the occupational safety, health and working conditions of the persons employed in an establishment and for matters connected therewith or incidental thereto. Amalgamates 13 labour Acts including Factories Act 1948, Contract Labour Act 1970, Mines Act 1952, and Inter-State Migrant Workmen Act 1979.',
      full_text: `THE OCCUPATIONAL SAFETY, HEALTH AND WORKING CONDITIONS CODE, 2020
NO. 37 OF 2020
[28th September, 2020]

An Act to consolidate and amend the laws regulating the occupational safety, health and working conditions of persons employed in an establishment.

CHAPTER I: PRELIMINARY
1. Short title, extent, commencement and application.

CHAPTER V: HOURS OF WORK AND ANNUAL LEAVE WITH WAGES
25. (1) No worker shall be required or allowed to work in any establishment or class of establishments for more than eight hours in any day or such number of hours as may be prescribed.
(2) The period of work of a worker shall be so arranged that inclusive of his intervals for rest, it shall not spread over more than twelve hours on any day.

CHAPTER X: SPECIAL PROVISION RELATING TO EMPLOYMENT OF WOMEN
43. Women shall be entitled to be employed in all establishments for all types of work and may also be employed, with their consent, before 6 a.m. and beyond 7 p.m. subject to such conditions relating to safety, holidays and working hours or other conditions as may be prescribed.`,
      download_url: 'https://labour.gov.in/sites/default/files/OSH_Code2020.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_min_wages_1948',
      slug: 'the-minimum-wages-act-1948',
      title: 'The Minimum Wages Act, 1948',
      short_title: 'Minimum Wages Act, 1948',
      document_number: 'Act No. 11 of 1948',
      document_type: 'act',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Central Legislative Assembly / Ministry of Labour & Employment',
      subject_category: 'Wages & Remuneration',
      publication_date: '1948-03-15',
      effective_date: '1948-03-15',
      legal_status: 'superseded',
      superseded_by_id: 'doc_wage_code_2019',
      official_source_url: 'https://www.indiacode.nic.in/handle/123456789/1897',
      official_citation: 'Act No. 11 of 1948; Central Legislative Enactment',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'Historical central enactment providing for fixing minimum rates of wages in certain employments. Marked as superseded: will be formally substituted across all scheduled employments once the Code on Wages 2019 enforcement rules are notified by respective state governments.',
      full_text: `THE MINIMUM WAGES ACT, 1948
ACT NO. 11 OF 1948
[15th March, 1948]

An Act to provide for fixing minimum rates of wages in certain employments.
WHEREAS it is expedient to provide for fixing minimum rates of wages in certain employments;
It is hereby enacted as follows:—

1. Short title and extent.—(1) This Act may be called the Minimum Wages Act, 1948.
(2) It extends to the whole of India.

3. Fixing of minimum rates of wages.—(1) The appropriate Government shall, in the manner hereinafter provided,—
(a) fix the minimum rates of wages payable to employees employed in an employment specified in Part I or Part II of the Schedule and in an employment added to either Part by notification under section 27.`,
      download_url: 'https://www.indiacode.nic.in/handle/123456789/1897',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_epf_act_1952',
      slug: 'the-employees-provident-funds-and-miscellaneous-provisions-act-1952',
      title: "The Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
      short_title: 'EPF & MP Act, 1952',
      document_number: 'Act No. 19 of 1952',
      document_type: 'act',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Social Security & Benefits',
      publication_date: '1952-03-04',
      effective_date: '1952-11-01',
      legal_status: 'verified',
      superseded_by_id: 'doc_ss_code_2020',
      official_source_url: 'https://www.indiacode.nic.in/handle/123456789/2289',
      official_citation: 'Act No. 19 of 1952; Central Enactment',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'An Act to provide for the institution of provident funds, pension fund and deposit-linked insurance fund for employees in factories and other establishments. Currently active and enforced by EPFO pending nationwide notification of the Code on Social Security, 2020.',
      full_text: `THE EMPLOYEES' PROVIDENT FUNDS AND MISCELLANEOUS PROVISIONS ACT, 1952
ACT NO. 19 OF 1952
[4th March, 1952]

An Act to provide for the institution of provident funds, pension fund and deposit-linked insurance fund for employees in factories and other establishments.

1. Short title, extent and application.—(1) This Act may be called the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.
(2) It extends to the whole of India.
(3) Subject to the provisions contained in section 16, it applies—
(a) to every establishment which is a factory engaged in any industry specified in Schedule I and in which twenty or more persons are employed; and
(b) to any other establishment employing twenty or more persons or class of such establishments which the Central Government may, by notification in the Official Gazette, specify in this behalf.`,
      download_url: 'https://www.indiacode.nic.in/handle/123456789/2289',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_maternity_1961',
      slug: 'the-maternity-benefit-act-1961',
      title: 'The Maternity Benefit Act, 1961',
      short_title: 'Maternity Benefit Act, 1961',
      document_number: 'Act No. 53 of 1961',
      document_type: 'act',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Social Security & Benefits',
      publication_date: '1961-12-12',
      effective_date: '1961-12-12',
      legal_status: 'verified',
      superseded_by_id: 'doc_ss_code_2020',
      official_source_url: 'https://www.indiacode.nic.in/handle/123456789/1592',
      official_citation: 'Act No. 53 of 1961 as amended by Act No. 6 of 2017; Central Enactment',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'An Act to regulate the employment of women in certain establishments for certain periods before and after child-birth and to provide for maternity benefit and certain other benefits. Substantially amended in 2017 to mandate 26 weeks paid maternity leave and creche facilities in establishments employing 50 or more employees.',
      full_text: `THE MATERNITY BENEFIT ACT, 1961
ACT NO. 53 OF 1961
[12th December, 1961]

An Act to regulate the employment of women in certain establishments for certain periods before and after child-birth and to provide for maternity benefit.

4. Employment of, or work by, women prohibited during certain periods.—(1) No employer shall knowingly employ a woman in any establishment during the six weeks immediately following the day of her delivery, miscarriage or medical termination of pregnancy.

5. Right to payment of maternity benefit.—(1) Subject to the provisions of this Act, every woman shall be entitled to, and her employer shall be liable for, the payment of maternity benefit at the rate of the average daily wage for the period of her actual absence.
(3) The maximum period for which any woman shall be entitled to maternity benefit shall be twenty-six weeks of which not more than eight weeks shall precede the date of her expected delivery.`,
      download_url: 'https://www.indiacode.nic.in/handle/123456789/1592',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_factories_1948',
      slug: 'the-factories-act-1948',
      title: 'The Factories Act, 1948',
      short_title: 'Factories Act, 1948',
      document_number: 'Act No. 63 of 1948',
      document_type: 'act',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Occupational Safety & Health',
      publication_date: '1948-09-23',
      effective_date: '1949-04-01',
      legal_status: 'verified',
      superseded_by_id: 'doc_osh_code_2020',
      official_source_url: 'https://www.indiacode.nic.in/handle/123456789/1530',
      official_citation: 'Act No. 63 of 1948; Central Enactment',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'Comprehensive legislation enacted to consolidate and amend the law regulating labour in factories, focusing on worker cleanliness, ventilation, artificial humidification, overcrowding, lighting, drinking water, latrines, and machinery fencing.',
      full_text: `THE FACTORIES ACT, 1948
ACT NO. 63 OF 1948
[23rd September, 1948]

An Act to consolidate and amend the law regulating labour in factories.
BE it enacted by the Constituent Assembly of India as follows:—

CHAPTER I: PRELIMINARY
1. Short title, extent and commencement.—(1) This Act may be called the Factories Act, 1948.
(2) It extends to the whole of India.
(3) It shall come into force on the 1st day of April, 1949.

CHAPTER III: HEALTH
11. Cleanliness.—(1) Every factory shall be kept clean and free from effluvia arising from any drain, privy or other nuisance.
16. Overcrowding.—(1) No room in any factory shall be overcrowded to an extent injurious to the health of the workers employed therein.`,
      download_url: 'https://www.indiacode.nic.in/handle/123456789/1530',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_mah_shops_2017',
      slug: 'maharashtra-shops-and-establishments-act-2017',
      title: 'The Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017',
      short_title: 'Maharashtra Shops Act, 2017',
      document_number: 'Maharashtra Act No. LXI of 2017',
      document_type: 'act',
      jurisdiction: 'state',
      state: 'Maharashtra',
      issuing_authority: 'Industries, Energy and Labour Department, Government of Maharashtra',
      subject_category: 'Shops & Commercial Establishments',
      publication_date: '2017-09-07',
      effective_date: '2017-12-19',
      legal_status: 'verified',
      superseded_by_id: null,
      official_source_url: 'https://mahakamgar.maharashtra.gov.in/images/pdf/maharashtra-shops-and-establishments-act-2017.pdf',
      official_citation: 'Maharashtra Act No. LXI of 2017; Maharashtra Government Gazette Extraordinary, Part IV',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'State law governing employment conditions, registration, working hours, spread-over, holidays, leave with pay, and welfare for establishments employing 10 or more workers in Maharashtra. Introduces online self-declaration registration for small businesses with fewer than 10 workers.',
      full_text: `MAHARASHTRA ACT No. LXI OF 2017
[7th September 2017]

An Act to regulate conditions of employment and other conditions of service of workers employed in shops, residential hotels, restaurants, eating houses, theatres, other places of public amusement or entertainment and other establishments and for matters connected therewith.

CHAPTER I: PRELIMINARY
1. (1) This Act may be called the Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017.
(2) It extends to the whole of the State of Maharashtra.

CHAPTER II: REGISTRATION OF ESTABLISHMENTS
6. (1) Within a period of sixty days from the date of commencement of this Act or from the date on which establishment commences its work, the employer of every establishment employing ten or more workers shall submit an application online in the prescribed form for registration.
(3) The provisions of this Act shall not apply to an establishment employing less than ten workers, except that intimation of commencement of business shall be submitted online.`,
      download_url: 'https://mahakamgar.maharashtra.gov.in/images/pdf/maharashtra-shops-and-establishments-act-2017.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_kar_shops_1961',
      slug: 'karnataka-shops-and-commercial-establishments-act-1961',
      title: 'The Karnataka Shops and Commercial Establishments Act, 1961',
      short_title: 'Karnataka Shops Act, 1961',
      document_number: 'Karnataka Act No. 8 of 1962',
      document_type: 'act',
      jurisdiction: 'state',
      state: 'Karnataka',
      issuing_authority: 'Department of Labour, Government of Karnataka',
      subject_category: 'Shops & Commercial Establishments',
      publication_date: '1962-02-15',
      effective_date: '1962-03-01',
      legal_status: 'verified',
      superseded_by_id: null,
      official_source_url: 'https://labour.karnataka.gov.in/storage/pdf-files/The%20Karnataka%20Shops%20and%20Commercial%20Establishments%20Act,%201961.pdf',
      official_citation: 'Karnataka Act No. 8 of 1962; Karnataka Gazette',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'State enactment for the regulation of conditions of work and employment in shops and commercial establishments across Bengaluru and the State of Karnataka. Governs IT/ITeS exemptions, shift rotations, and weekly off policies.',
      full_text: `THE KARNATAKA SHOPS AND COMMERCIAL ESTABLISHMENTS ACT, 1961
KARNATAKA ACT No. 8 OF 1962
[15th February, 1962]

An Act to consolidate and amend the law relating to the regulation of conditions of work and employment in shops and commercial establishments.

1. Short title, extent and commencement.—(1) This Act may be called the Karnataka Shops and Commercial Establishments Act, 1961.
(2) It extends to the whole of the State of Karnataka.

CHAPTER III: HOURS OF WORK
7. Daily and weekly hours.—(1) No employee in any establishment shall be required or allowed to work for more than nine hours on any day and forty-eight hours in any week.
Provided that the total number of hours of work including overtime shall not exceed ten hours in any day and fifty-four hours in any week.`,
      download_url: 'https://labour.karnataka.gov.in/storage/pdf-files/The%20Karnataka%20Shops%20and%20Commercial%20Establishments%20Act,%201961.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_delhi_shops_1954',
      slug: 'delhi-shops-and-establishments-act-1954',
      title: 'The Delhi Shops and Establishments Act, 1954',
      short_title: 'Delhi Shops Act, 1954',
      document_number: 'Delhi Act No. 7 of 1954',
      document_type: 'act',
      jurisdiction: 'state',
      state: 'Delhi',
      issuing_authority: 'Labour Department, Government of National Capital Territory of Delhi',
      subject_category: 'Shops & Commercial Establishments',
      publication_date: '1954-05-28',
      effective_date: '1955-02-01',
      legal_status: 'verified',
      superseded_by_id: null,
      official_source_url: 'https://labour.delhi.gov.in/sites/default/files/Labour/generic_multiple_files/Delhi_Shops_Establishment_Act_1954.pdf',
      official_citation: 'Delhi Act No. 7 of 1954; Delhi Gazette',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'Enactment regulating conditions of work in shops and commercial establishments situated in the National Capital Territory of Delhi, specifying opening and closing times, overtime calculations, young person restrictions, and registration requirements.',
      full_text: `THE DELHI SHOPS AND ESTABLISHMENTS ACT, 1954
DELHI ACT No. 7 OF 1954
[28th May, 1954]

An Act to amend and consolidate the law relating to the regulation of hours of work, payment of wages, leave, holiday, terms of service and other conditions of work of persons employed in shops, commercial establishments, places of public entertainment or amusement and other establishments and to provide for certain matters connected therewith.

1. Short title, extent and commencement.—(1) This Act may be called the Delhi Shops and Establishments Act, 1954.
(2) It extends to the whole of the Union territory of Delhi.`,
      download_url: 'https://labour.delhi.gov.in/sites/default/files/Labour/generic_multiple_files/Delhi_Shops_Establishment_Act_1954.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_draft_wage_rules_2020',
      slug: 'draft-code-on-wages-central-rules-2020',
      title: 'Draft Code on Wages (Central) Rules, 2020',
      short_title: 'Draft Wage Rules, 2020',
      document_number: 'Notification G.S.R. 432(E)',
      document_type: 'rules',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Wages & Remuneration',
      publication_date: '2020-07-07',
      effective_date: null,
      legal_status: 'draft',
      superseded_by_id: null,
      official_source_url: 'https://labour.gov.in/sites/default/files/Draft_Wage_Code_Rules.pdf',
      official_citation: 'Gazette of India, Extraordinary, Part II, Section 3(i), No. 343, dated 7th July, 2020',
      verification_status: 'unverified',
      last_verified_date: null,
      verified_by_user_id: null,
      missing_fields: JSON.stringify([
        'Final enactment gazette notification date is unrecorded.',
        'Prescribed national floor wage methodology pending final tripartite consensus.',
        'Document legal authenticity is pending gazette verification.',
      ]),
      summary: 'Draft rules published by the Central Government inviting objections and suggestions regarding the calculation of minimum rate of wages, criteria for determining standard working class family (3 consumption units, 2700 calories per day, 66 meters cloth), and floor wage computation.',
      full_text: `MINISTRY OF LABOUR AND EMPLOYMENT
NOTIFICATION
New Delhi, the 7th July, 2020
G.S.R. 432(E).—The following draft of the Code on Wages (Central) Rules, 2020 which the Central Government proposes to make in exercise of the powers conferred by section 67 of the Code on Wages, 2019 (29 of 2019) is hereby published for the information of all persons likely to be affected thereby; and notice is hereby given that the said draft rules shall be taken into consideration after forty-five days.

CHAPTER II: MINIMUM WAGES
3. Manner of calculating minimum rate of wages.—(1) For the purpose of sub-section (1) of section 6, the minimum rate of wages shall be fixed taking into account:
(a) standard working class family which includes a spouse and two children apart from the earning worker; an equivalent of three consumption units;
(b) net intake of 2700 calories per day per consumption unit;
(c) 66 meters cloth per year per standard working class family.`,
      download_url: 'https://labour.gov.in/sites/default/files/Draft_Wage_Code_Rules.pdf',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_draft_standing_orders_2020',
      slug: 'draft-model-standing-orders-for-manufacturing-and-services-2020',
      title: 'Draft Model Standing Orders for Manufacturing and Service Sector, 2020',
      short_title: 'Draft Model Standing Orders 2020',
      document_number: 'Notification G.S.R. 817(E)',
      document_type: 'rules',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment, Government of India',
      subject_category: 'Industrial Relations & Disputes',
      publication_date: '2020-12-31',
      effective_date: null,
      legal_status: 'pending_verification',
      superseded_by_id: null,
      official_source_url: 'https://labour.gov.in/whatsnew/draft-model-standing-orders',
      official_citation: 'Gazette of India, Extraordinary, Part II, Section 3(i), dated 31st December, 2020',
      verification_status: 'unverified',
      last_verified_date: null,
      verified_by_user_id: null,
      missing_fields: JSON.stringify([
        'Subordinate state-level adoption notifications remain unverified.',
        'Final publication status post public comments pending legal registry check.',
      ]),
      summary: 'Draft model standing orders published under section 29 of the Industrial Relations Code, 2020. Contains formal provisions enabling Work From Home (WFH) in service sectors, IT establishments, and uniform disciplinary procedures.',
      full_text: `MINISTRY OF LABOUR AND EMPLOYMENT
NOTIFICATION
New Delhi, the 31st December, 2020
G.S.R. 817(E).—The following draft of the Model Standing Orders for Service Sector, 2020 is hereby published.

1. Short title, application and commencement:
(1) These model standing orders may be called the Model Standing Orders for Service Sector, 2020.
(2) They shall apply to all industrial establishments in the service sector employing 300 or more workers.

Provision for Work From Home:
Subject to conditions of appointment or agreement between the employer and worker, the employer may permit a worker to work from home in such manner and for such period as may be mutually determined.`,
      download_url: 'https://labour.gov.in/whatsnew/draft-model-standing-orders',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
    {
      id: 'doc_trade_unions_1926',
      slug: 'the-trade-unions-act-1926',
      title: 'The Trade Unions Act, 1926 (Historical Record)',
      short_title: 'Trade Unions Act, 1926',
      document_number: 'Act No. 16 of 1926',
      document_type: 'act',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Central Legislative Assembly / Ministry of Labour & Employment',
      subject_category: 'Industrial Relations & Disputes',
      publication_date: '1926-03-25',
      effective_date: '1926-06-01',
      legal_status: 'archived',
      superseded_by_id: 'doc_ir_code_2020',
      official_source_url: 'https://www.indiacode.nic.in/handle/123456789/2290',
      official_citation: 'Act No. 16 of 1926; Central Enactment',
      verification_status: 'verified',
      last_verified_date: '2026-01-15',
      verified_by_user_id: 'usr_admin_001',
      missing_fields: JSON.stringify([]),
      summary: 'Historical enactment providing for the registration of Trade Unions and in certain respects defining the law relating to registered Trade Unions in India. Preserved for judicial history and archival reference.',
      full_text: `THE TRADE UNIONS ACT, 1926
ACT NO. 16 OF 1926
[25th March, 1926]

An Act to provide for the registration of Trade Unions and in certain respects to define the law relating to registered Trade Unions.
WHEREAS it is expedient to provide for the registration of Trade Unions and in certain respects to define the law relating to registered Trade Unions;
It is hereby enacted as follows:—

CHAPTER I: PRELIMINARY
1. Short title, extent and commencement.—(1) This Act may be called the Trade Unions Act, 1926.
(2) It extends to the whole of India.
(3) It shall come into force on such date as the Central Government may appoint.`,
      download_url: 'https://www.indiacode.nic.in/handle/123456789/2290',
      created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T00:00:00Z').toISOString(),
    },
  ];

  const insertDoc = db.prepare(`
    INSERT OR REPLACE INTO legal_documents (
      id, slug, title, short_title, document_number, document_type, jurisdiction, state,
      issuing_authority, subject_category, publication_date, effective_date, legal_status,
      superseded_by_id, official_source_url, official_citation, verification_status,
      last_verified_date, verified_by_user_id, missing_fields, summary, full_text,
      download_url, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  for (const doc of documents) {
    insertDoc.run(
      doc.id, doc.slug, doc.title, doc.short_title, doc.document_number, doc.document_type, doc.jurisdiction, doc.state,
      doc.issuing_authority, doc.subject_category, doc.publication_date, doc.effective_date, doc.legal_status,
      doc.superseded_by_id, doc.official_source_url, doc.official_citation, doc.verification_status,
      doc.last_verified_date, doc.verified_by_user_id, doc.missing_fields, doc.summary, doc.full_text,
      doc.download_url, doc.created_at, doc.updated_at
    );
  }

  // 3. Seed Document Sections for Key Documents
  const sections = [
    {
      id: 'sec_wc_1',
      document_id: 'doc_wage_code_2019',
      section_number: 'Section 1',
      title: 'Short title, extent and commencement',
      content: '(1) This Act may be called the Code on Wages, 2019. (2) It extends to the whole of India. (3) It shall come into force on such date as the Central Government may appoint.',
      order_index: 1,
    },
    {
      id: 'sec_wc_2',
      document_id: 'doc_wage_code_2019',
      section_number: 'Section 2(y)',
      title: 'Statutory Definition of Wages and 50% Rule',
      content: '"wages" means all remuneration whether by way of salaries, allowances or otherwise... Provided that where the sum of specified allowances exceeds fifty percent of all remuneration, the excess amount shall be deemed as remuneration and treated as part of wages.',
      order_index: 2,
    },
    {
      id: 'sec_wc_3',
      document_id: 'doc_wage_code_2019',
      section_number: 'Section 6',
      title: 'Prohibition of Discrimination on Grounds of Sex',
      content: '(1) There shall be no discrimination among employees on the ground of sex in matters relating to wages in respect of the same work or work of a similar nature. (2) No employer shall reduce the rate of wages of any employee to comply with this section.',
      order_index: 3,
    },
    {
      id: 'sec_wc_4',
      document_id: 'doc_wage_code_2019',
      section_number: 'Section 9',
      title: 'Power of Central Government to Fix Floor Wage',
      content: '(1) The Central Government shall fix a floor wage taking into account minimum living standards of a worker. (2) Minimum rates of wages fixed by appropriate Governments cannot be lower than the floor wage.',
      order_index: 4,
    },
    {
      id: 'sec_ir_1',
      document_id: 'doc_ir_code_2020',
      section_number: 'Section 14',
      title: 'Recognition of Negotiating Union or Negotiating Council',
      content: 'Where only one Trade Union of workers is functioning in an establishment, the employer shall recognize such Trade Union as the sole negotiating union if it has not less than 51% worker support.',
      order_index: 1,
    },
    {
      id: 'sec_ir_2',
      document_id: 'doc_ir_code_2020',
      section_number: 'Section 62',
      title: 'Prohibition of Strikes and Lock-Outs',
      content: 'No person employed in an industrial establishment shall go on strike in breach of contract without giving to the employer notice of strike within sixty days before striking, or within fourteen days of giving such notice.',
      order_index: 2,
    },
    {
      id: 'sec_ss_1',
      document_id: 'doc_ss_code_2020',
      section_number: 'Section 114',
      title: 'Social Security for Gig Workers and Platform Workers',
      content: 'The Central Government shall frame and notify suitable welfare schemes for gig workers and platform workers regarding life and disability cover, health and maternity benefits, and old age protection.',
      order_index: 1,
    },
    {
      id: 'sec_osh_1',
      document_id: 'doc_osh_code_2020',
      section_number: 'Section 25',
      title: 'Maximum Daily and Weekly Working Hours',
      content: 'No worker shall be required or allowed to work in any establishment for more than eight hours in any day. Spread over shall not exceed twelve hours.',
      order_index: 1,
    },
    {
      id: 'sec_mah_1',
      document_id: 'doc_mah_shops_2017',
      section_number: 'Section 6',
      title: 'Registration of Establishments Employing Ten or More Workers',
      content: 'Within 60 days from commencement of business, every employer of an establishment employing 10 or more workers shall submit an online application for registration in prescribed Form A.',
      order_index: 1,
    },
  ];

  const insertSection = db.prepare(`
    INSERT OR REPLACE INTO document_sections (id, document_id, section_number, title, content, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const s of sections) {
    insertSection.run(s.id, s.document_id, s.section_number, s.title, s.content, s.order_index);
  }

  // 4. Seed Amendments
  const amendments = [
    {
      id: 'amd_mat_2017',
      document_id: 'doc_maternity_1961',
      amending_act_title: 'The Maternity Benefit (Amendment) Act, 2017',
      notification_number: 'Act No. 6 of 2017',
      amendment_date: '2017-03-27',
      description: 'Extended paid maternity leave entitlement from twelve weeks to twenty-six weeks for women with fewer than two surviving children; introduced creche facility requirement for establishments with 50+ workers.',
      source_url: 'https://labour.gov.in/sites/default/files/Maternity_Benefit_Amendment_Act_2017.pdf',
    },
  ];

  const insertAmd = db.prepare(`
    INSERT OR REPLACE INTO document_amendments (id, document_id, amending_act_title, notification_number, amendment_date, description, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of amendments) {
    insertAmd.run(a.id, a.document_id, a.amending_act_title, a.notification_number, a.amendment_date, a.description, a.source_url);
  }

  // 5. Seed Initial Audit Trail
  const auditLogs = [
    {
      id: 'aud_001',
      document_id: 'doc_wage_code_2019',
      user_id: 'usr_admin_001',
      action: 'DOCUMENT_VERIFIED',
      previous_status: 'pending_verification',
      new_status: 'verified',
      notes: 'Verified against Gazette of India Extraordinary Notification No. 43 dated Aug 8, 2019. Primary text cross-referenced.',
      created_at: new Date('2026-01-15T10:00:00Z').toISOString(),
    },
    {
      id: 'aud_002',
      document_id: 'doc_min_wages_1948',
      user_id: 'usr_admin_001',
      action: 'STATUS_CHANGED_SUPERSEDED',
      previous_status: 'verified',
      new_status: 'superseded',
      notes: 'Linked to The Code on Wages, 2019 as the succeeding governing code.',
      created_at: new Date('2026-01-15T11:00:00Z').toISOString(),
    },
  ];

  const insertAudit = db.prepare(`
    INSERT OR REPLACE INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const aud of auditLogs) {
    insertAudit.run(aud.id, aud.document_id, aud.user_id, aud.action, aud.previous_status, aud.new_status, aud.notes, aud.created_at);
  }

  console.log(`Database seed complete! Populated ${documents.length} legal documents, ${users.length} users, ${sections.length} sections.`);
}

if (require.main === module) {
  try {
    runSeed();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

module.exports = { runSeed };
