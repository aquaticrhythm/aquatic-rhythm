# Post-Deploy Security Header Validation (Production)

Dokumen ini digunakan setiap kali deploy ke production untuk mengesahkan finding berkaitan security header telah closed.

## Scope

- Domain production: `https://aquaticrhythm.com`
- Endpoint minimum: `/`
- Jika deploy melibatkan route/page tertentu, tambah endpoint tersebut dalam semakan.

## Tools

1. **Sucuri SiteCheck** — primary external scan.
2. **SecurityHeaders** (atau alat kedua setara) — cross-check independent.

## Steps Selepas Deploy

1. Re-run **Sucuri SiteCheck** pada domain production.
2. Semak response header menggunakan alat kedua (contoh: **SecurityHeaders**) untuk cross-check.
3. Simpan snapshot **sebelum/selepas** (status code + header) dalam dokumen ini.
4. Jika masih ada finding, catat **residual risk** dan **target date** untuk closure.

## Snapshot Log (Before/After)

> Gunakan format ini setiap deploy. Jangan padam rekod lama; tambah entri baharu mengikut tarikh.

### Release: `<release-id>`

- Tarikh deploy (UTC): `<YYYY-MM-DD HH:MM>`
- Owner: `<nama>`
- Perubahan berkaitan header: `<ringkasan pendek>`

#### A) Sucuri SiteCheck

- URL scan: `<https://sitecheck.sucuri.net/results/aquaticrhythm.com>`
- Ringkasan finding: `<pass / warning / fail + nota>`

| Timing | HTTP Status | Header Snapshot |
|---|---:|---|
| Before | `<status>` | ``<header utama + nilai>`` |
| After | `<status>` | ``<header utama + nilai>`` |

#### B) Cross-check Tool (SecurityHeaders)

- URL scan: `<https://securityheaders.com/?q=aquaticrhythm.com&followRedirects=on>`
- Ringkasan finding: `<grade + nota>`

| Timing | HTTP Status | Header Snapshot |
|---|---:|---|
| Before | `<status>` | ``<header utama + nilai>`` |
| After | `<status>` | ``<header utama + nilai>`` |

## Residual Risk Register

> Isi bahagian ini jika masih ada finding selepas deploy.

| ID | Finding | Impact | Compensating Control (Current) | Owner | Target Closure Date | Status |
|---|---|---|---|---|---|---|
| `<RISK-###>` | `<contoh: CSP terlalu longgar pada script-src>` | `<Low/Med/High>` | `<contoh: hanya domain trusted dibenarkan>` | `<nama>` | `<YYYY-MM-DD>` | `<Open/In Progress/Closed>` |

## Evidence Minimum

Lampirkan bukti berikut dalam commit/artefak operasi:

- Screenshot keputusan Sucuri SiteCheck.
- Screenshot keputusan SecurityHeaders (atau tool kedua).
- Nilai response header daripada production (boleh daripada browser devtools atau `curl -I`).

Contoh command verifikasi cepat:

```bash
curl -I https://aquaticrhythm.com/
```
