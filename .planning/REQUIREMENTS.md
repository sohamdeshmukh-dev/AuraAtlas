# Requirements: AuraAtlas

**Defined:** 2026-03-22
**Core Value:** Universities get a real-time early warning system for campus mental health — students get an anonymous outlet with AI support.

## v1 Requirements (Hackathon Sprint)

### Demo Stability

- [ ] **DEMO-01**: New user can sign up → college auto-detected → first check-in in under 60 seconds
- [ ] **DEMO-02**: Map displays realistic mood data without requiring real users (demo mode)
- [ ] **DEMO-03**: All pages render without errors, crashes, or blank states

### Real-Time

- [ ] **RT-01**: New mood check-ins appear on the 3D skyline within 3 seconds without page reload
- [ ] **RT-02**: Skyline building heights animate when new data arrives

### Counselor Dashboard

- [ ] **COUN-01**: `/counselor` page exists and is accessible
- [ ] **COUN-02**: Dashboard shows real-time campus mood index per college
- [ ] **COUN-03**: Dashboard shows crisis threshold alert when campus mood drops critically
- [ ] **COUN-04**: Dashboard shows mood trend (24h, 7d, 30d) per campus
- [ ] **COUN-05**: Dashboard shows participant counts (anonymized)
- [ ] **COUN-06**: Dashboard shows top stressed zones / buildings (if AR data available)

### Crisis System

- [ ] **CRISIS-01**: When AI therapist detects suicidal/self-harm language, an email is sent to a configurable counselor address via Resend
- [ ] **CRISIS-02**: Email is anonymized — no student PII, only timestamp + college + general signal
- [ ] **CRISIS-03**: Student receives in-app 988 prompt (already built — verify it works)

### Email Digest

- [ ] **EMAIL-01**: User can trigger a "Send my weekly report" action from profile
- [ ] **EMAIL-02**: Report email includes Smile Score, streak, dominant mood, campus comparison

## v2 Requirements (Post-Hackathon)

### Sharing

- **SHARE-01**: User can generate a shareable Aura Card image (PNG)
- **SHARE-02**: User can share their mood report link

### Forecasting

- **FORE-01**: System shows "predicted stress spike" based on historical weekly patterns (rule-based)

### AR Expansion

- **AR-01**: AR building dataset expanded to 3+ campuses beyond UVA

### Research Export

- **RESEARCH-01**: Counselor dashboard has IRB-compliant anonymized CSV export

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first, hackathon constraint |
| OAuth / social login | Supabase email auth sufficient for demo |
| Remotion video generation | Not needed for hackathon |
| Real ML mood forecasting | Rule-based is sufficient for demo |
| Multi-tenant counselor auth | Single admin view sufficient for demo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEMO-01 | Phase 1 | Pending |
| DEMO-02 | Phase 1 | Pending |
| DEMO-03 | Phase 1 | Pending |
| RT-01 | Phase 1 | Pending |
| RT-02 | Phase 1 | Pending |
| COUN-01 | Phase 2 | Pending |
| COUN-02 | Phase 2 | Pending |
| COUN-03 | Phase 2 | Pending |
| COUN-04 | Phase 2 | Pending |
| COUN-05 | Phase 2 | Pending |
| COUN-06 | Phase 2 | Pending |
| CRISIS-01 | Phase 3 | Pending |
| CRISIS-02 | Phase 3 | Pending |
| CRISIS-03 | Phase 3 | Pending |
| EMAIL-01 | Phase 3 | Pending |
| EMAIL-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initialization*
