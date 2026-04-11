# Implementation Plan: Book a Call Frontend

**Based on:** `docs/superpowers/specs/2026-04-11-admin-events-design.md`

**Goal:** Build complete React frontend with Admin Panel (Event Management) and Public Pages (Guest Booking Flow).

**Stack:** React 18 + TypeScript + Mantine UI + Vite + React Router v6

---

## Phase 1: Project Setup & Dependencies

**Duration:** 30-45 minutes

### Tasks

1. **Create Vite project**
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   ```

2. **Install Mantine dependencies**
   ```bash
   npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications @mantine/dates dayjs
   ```

3. **Install React Router**
   ```bash
   npm install react-router-dom
   ```

4. **Setup project structure**
   ```
   src/
   ├── components/
   ├── pages/
   ├── api/
   ├── utils/
   ├── hooks/
   └── main.tsx
   ```

5. **Configure Mantine theme** in `main.tsx`
   - Primary color: blue
   - Default radius: md
   - Notifications provider
   - Dates provider with dayjs

6. **Setup environment variables**
   - `.env.development`: `VITE_API_URL=http://localhost:3000/api/v1`

### Deliverables
- Vite project scaffolded
- Mantine configured with theme
- Basic folder structure
- Environment variables set

---

## Phase 2: API Client & Types

**Duration:** 45-60 minutes

### Tasks

1. **Create TypeScript types** (`api/types.ts`)
   - Copy from OpenAPI spec
   - Event, Booking, Guest, Schedule interfaces
   - Request/response types

2. **Create HTTP client** (`api/client.ts`)
   - Base URL from env
   - Basic Auth interceptor
   - JSON headers
   - Error handling wrapper

3. **Create API methods** (`api/events.ts`, `api/public.ts`)
   - Admin events CRUD
   - Public endpoints (no auth)
   - Proper typing for all methods

4. **Create transliteration utility** (`utils/slug.ts`)
   - ISO 9 transliteration map
   - `generateSlug(title)` function
   - Regex for slug validation

5. **Create date utilities** (`utils/date.ts`)
   - Date formatting (RU locale)
   - Time slot formatting
   - Calendar helpers

### Deliverables
- Complete type definitions
- Working API client with auth
- Utility functions ready

---

## Phase 3: Admin Panel - Events List

**Duration:** 60-90 minutes

### Tasks

1. **Create Layout component** (`components/Layout.tsx`)
   - Sidebar with navigation
   - "Event types" active item
   - Placeholder items (disabled)
   - Header with user info placeholder

2. **Create EventCard component** (`components/EventCard.tsx`)
   - Title, slug, duration badge
   - Active toggle switch (PATCH on change)
   - Edit, copy link, delete actions
   - Loading states

3. **Create EventsList page** (`pages/EventsList.tsx`)
   - Fetch events on mount
   - Sort by createdAt desc
   - Render EventCard list
   - "+ New" button → /admin/events/new
   - Empty state

4. **Implement actions**
   - Toggle active status (optimistic UI)
   - Copy link to clipboard (notification)
   - Delete with browser confirm

5. **Add error handling**
   - Loading skeletons
   - Error states
   - Toast notifications

### Deliverables
- Functional events list page
- Toggle working
- Copy link working
- Delete with confirm

---

## Phase 4: Admin Panel - Event Create/Edit

**Duration:** 90-120 minutes

### Tasks

1. **Create EventForm component** (`components/EventForm.tsx`)
   - Title input with auto-slug
   - Slug input (disabled on edit)
   - Duration number input (step 5)
   - Description textarea
   - Active switch
   - Validation rules

2. **Create transliteration logic**
   - On title blur: generate slug
   - Debounced 300ms on typing
   - Manual override detection
   - ISO 9 mapping implementation

3. **Create EventCreate page** (`pages/EventCreate.tsx`)
   - Form with defaults (duration: 30, active: true)
   - Submit: POST /events
   - Success: redirect to list
   - Error handling (409 SLUG_TAKEN)

4. **Create EventEdit page** (`pages/EventEdit.tsx`)
   - Load event data from route slug
   - Populate form
   - Submit: PATCH /events/{slug}
   - Delete button at bottom (red)
   - 409 HAS_ACTIVE_BOOKINGS error

5. **Setup routing** in `App.tsx`
   - /admin/events
   - /admin/events/new
   - /admin/events/:slug/edit
   - Protected by Basic Auth check

### Deliverables
- Working create page
- Working edit page
- Slug auto-generation
- Full error handling

---

## Phase 5: Public Pages - Events List & Booking

**Duration:** 120-150 minutes

### Tasks

1. **Create PublicLayout** (`components/PublicLayout.tsx`)
   - Minimal header (brand)
   - Footer with copyright
   - Clean, centered content

2. **Create EventCard (Public)** (`components/PublicEventCard.tsx`)
   - Icon, title, description (truncated)
   - Duration badge
   - "Выбрать время" button

3. **Create PublicEventsList page** (`pages/PublicEventsList.tsx`)
   - Landing page at `/`
   - Fetch active events only
   - Grid of cards
   - Loading skeletons
   - Empty state

4. **Create CalendarPicker component** (`components/CalendarPicker.tsx`)
   - Mantine DatePicker or custom
   - Min date: today
   - Max date: today + 13 days
   - Disable days without availability
   - Visual indicators

5. **Create TimeSlotList component** (`components/TimeSlotList.tsx`)
   - List of slot buttons
   - Green dot indicator
   - Time display
   - Click → navigate to booking form

6. **Create EventBooking page** (`pages/EventBooking.tsx`)
   - 3-column layout (desktop)
   - Event info panel (left)
   - Calendar (center)
   - Time slots (right)
   - Responsive (stacked mobile)
   - Fetch slots on date change
   - Loading states

### Deliverables
- Public landing page
- Event booking page with calendar
- Time slot selection
- Mobile responsive

---

## Phase 6: Public Pages - Booking Form & Success

**Duration:** 90-120 minutes

### Tasks

1. **Create BookingForm component** (`components/BookingForm.tsx`)
   - Selected time card (read-only)
   - Name input (required)
   - Email input with validation
   - Notes textarea (optional)
   - "Подтвердить бронирование" button

2. **Create BookingFormPage** (`pages/BookingFormPage.tsx`)
   - Parse slot from URL query
   - Show event info + selected time
   - Form submission
   - POST /public/events/{slug}/bookings
   - Error: 409 SLOT_UNAVAILABLE
   - Success: redirect to success page with token

3. **Create BookingSuccess page** (`pages/BookingSuccess.tsx`)
   - Parse bookingId and token from URL
   - Confirmation card with details
   - "Отменить бронирование" button
   - Copy link button (for management)
   - Cancellation flow (DELETE with token)
   - Success/error states

4. **Setup public routing** in `App.tsx`
   - / → PublicEventsList
   - /e/:slug → EventBooking
   - /e/:slug/book → BookingFormPage
   - /bookings/:id/success → BookingSuccess

5. **Add error boundaries**
   - 404 page
   - Generic error fallback

### Deliverables
- Working booking form
- Success page with cancellation
- Complete public flow functional
- Error handling

---

## Phase 7: Testing & Polish

**Duration:** 60-90 minutes

### Tasks

1. **Manual testing checklist**
   - [ ] Create, edit, delete events (admin)
   - [ ] Toggle active status
   - [ ] Copy link to clipboard
   - [ ] Slug auto-generation
   - [ ] Browse events (public)
   - [ ] Select slot on calendar
   - [ ] Submit booking form
   - [ ] View confirmation page
   - [ ] Cancel booking
   - [ ] Error scenarios (409, 404, network)
   - [ ] Mobile responsiveness
   - [ ] Basic Auth flow

2. **Polish UI**
   - Consistent spacing
   - Proper loading states
   - Toast notifications everywhere
   - Form validation feedback

3. **Build and verify**
   ```bash
   npm run build
   ```
   - No TypeScript errors
   - No build warnings
   - Assets generated

4. **Documentation**
   - README with setup instructions
   - Environment variables
   - Development workflow

### Deliverables
- Fully tested application
- Clean build output
- Updated documentation

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Setup | 45m | 45m |
| 2. API & Utils | 60m | 1h 45m |
| 3. Admin List | 90m | 3h 15m |
| 4. Admin Forms | 120m | 5h 15m |
| 5. Public Booking | 150m | 7h 45m |
| 6. Public Forms | 120m | 9h 45m |
| 7. Testing | 90m | 11h 15m |

**Total: ~11 hours** (realistic with breaks and debugging)

---

## Development Workflow

### Start Development

```bash
# Terminal 1: Backend (already running via docker-compose)
cd /workspace
docker-compose up backend

# Terminal 2: Frontend
cd /workspace/frontend
npm run dev

# Terminal 3: Prism (API mock for development)
npx prism mock ../api/generated/openapi.yaml --port 3000
```

### Testing Flow

1. **Admin features**: Navigate to `/admin/events`
2. **Public features**: Navigate to `/`
3. **Cross-testing**: Create event in admin → book it in public view

### Git Workflow

```bash
# After each phase
git add .
git commit -m "feat: phase X - description"

# Push when complete
git push origin main
```

---

## Success Criteria

- [ ] All admin CRUD operations working
- [ ] Public booking flow complete (4 pages)
- [ ] Basic Auth protecting admin routes
- [ ] Responsive on desktop and mobile
- [ ] Error handling for all API scenarios
- [ ] Clean build with no errors
- [ ] Documentation complete

---

## Phase 8: Testing & Quality Assurance

**Duration:** 120-150 minutes (parallel with development)

### Test Stack

| Type | Tool | Purpose |
|------|------|---------|
| **Unit** | Vitest | Pure functions, utilities, hooks |
| **UI/Integration** | React Testing Library + Vitest | Components in isolation |
| **E2E** | Playwright | Full user scenarios with Prism |

### Test Structure

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   ├── utils/
│   │   │   │   ├── slug.test.ts
│   │   │   │   └── date.test.ts
│   │   │   └── api/
│   │   │       └── client.test.ts
│   │   └── ui/
│   │       ├── components/
│   │       │   ├── EventCard.test.tsx
│   │       │   ├── EventForm.test.tsx
│   │       │   └── CalendarPicker.test.tsx
│   │       └── pages/
│   │           ├── EventsList.test.tsx
│   │           └── EventBooking.test.tsx
├── e2e/
│   ├── fixtures/           # JSON mocks for Prism
│   │   ├── events.json
│   │   ├── schedule.json
│   │   └── slots.json
│   ├── tests/
│   │   ├── guest-flow.spec.ts
│   │   └── admin-flow.spec.ts
│   └── playwright.config.ts
└── vitest.config.ts
```

### Unit Tests (Vitest)

**Coverage target:** Критичные функции (прагматичный подход)

| Module | Test Cases |
|--------|------------|
| `utils/slug.ts` | Transliteration (RU→EN), slug generation, validation |
| `utils/date.ts` | Formatting, parsing, calendar helpers |
| `api/client.ts` | HTTP headers, auth encoding, error handling |
| `hooks/useAuth.ts` | State management, localStorage (or memory) |

**Example:**
```typescript
// slug.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlug, transliterate } from '../utils/slug';

describe('transliterate', () => {
  it('converts Russian to Latin (ISO 9)', () => {
    expect(transliterate('Встреча')).toBe('vstrecha');
    expect(transliterate('Щука')).toBe('shchuka');
  });
});

describe('generateSlug', () => {
  it('removes special chars and collapses hyphens', () => {
    expect(generateSlug('Test @#$%')).toBe('test');
    expect(generateSlug('a---b')).toBe('a-b');
  });
});
```

### UI Tests (React Testing Library)

**Components to test:**

| Component | Scenarios |
|-----------|-----------|
| EventCard | Render props, toggle callback, delete callback |
| EventForm | Input changes, auto-slug generation, validation |
| CalendarPicker | Date selection, disabled dates, navigation |
| BookingForm | Guest data input, submit, error display |

**Example:**
```typescript
// EventForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { EventForm } from './EventForm';

describe('EventForm', () => {
  it('auto-generates slug from title input', async () => {
    render(<EventForm />);
    
    const titleInput = screen.getByLabelText(/название/i);
    await userEvent.type(titleInput, 'Встреча');
    
    const slugInput = screen.getByDisplayValue('vstrecha');
    expect(slugInput).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

**Prism Setup:** Mock API running on port 3000

**Scenarios:**

#### 1. Guest Booking Flow (Critical)
```typescript
// guest-flow.spec.ts
test('complete guest booking journey', async ({ page }) => {
  // 1. Landing page
  await page.goto('/');
  await expect(page.getByText('Встреча на 30 минут')).toBeVisible();
  
  // 2. Select event
  await page.click('text=Выбрать время');
  await expect(page).toHaveURL(/\/e\//);
  
  // 3. Calendar - select date
  await page.click('[data-testid="calendar-day-available"]');
  
  // 4. Select time slot
  await page.click('text=09:00');
  await expect(page).toHaveURL(/\/e\/.+\/book/);
  
  // 5. Fill booking form
  await page.fill('[name="name"]', 'Иван Петров');
  await page.fill('[name="email"]', 'ivan@example.com');
  await page.click('text=Подтвердить бронирование');
  
  // 6. Confirmation page
  await expect(page.getByText('Бронирование подтверждено')).toBeVisible();
  await expect(page.getByText('Иван Петров')).toBeVisible();
});
```

#### 2. Admin Event Management
```typescript
// admin-flow.spec.ts
test('owner creates and publishes event', async ({ page }) => {
  // 1. Login (Basic Auth)
  await page.goto('/admin/events');
  
  // 2. Create new event
  await page.click('text=+ New');
  await page.fill('[name="title"]', 'Тестовая встреча');
  await page.fill('[name="duration"]', '45');
  await page.fill('[name="description"]', 'Описание тестового события');
  await page.click('text=Создать');
  
  // 3. Verify in list
  await expect(page.getByText('Тестовая встреча')).toBeVisible();
  
  // 4. Verify in public view
  await page.goto('/');
  await expect(page.getByText('Тестовая встреча')).toBeVisible();
});
```

#### 3. Cancellation Flow
```typescript
test('guest can cancel booking', async ({ page }) => {
  // Assume booking created via API fixture
  await page.goto('/bookings/test-id/success?token=test-token');
  
  // Cancel
  page.on('dialog', dialog => dialog.accept());
  await page.click('text=Отменить бронирование');
  
  // Verify cancellation
  await expect(page.getByText('Бронирование отменено')).toBeVisible();
});
```

### Test Fixtures (Prism)

```json
// e2e/fixtures/events.json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Встреча на 30 минут",
    "description": "Короткая встреча для знакомства",
    "duration": 30,
    "slug": "vstrecha-30-minut",
    "active": true,
    "createdAt": "2026-04-11T10:00:00Z",
    "updatedAt": "2026-04-11T10:00:00Z"
  }
]
```

```json
// e2e/fixtures/schedule.json
{
  "weekdays": {
    "monday": { "enabled": true, "blocks": [{"start": "09:00", "end": "17:00"}] },
    "tuesday": { "enabled": true, "blocks": [{"start": "09:00", "end": "17:00"}] },
    "wednesday": { "enabled": false, "blocks": [] },
    "thursday": { "enabled": true, "blocks": [{"start": "09:00", "end": "17:00"}] },
    "friday": { "enabled": true, "blocks": [{"start": "09:00", "end": "15:00"}] },
    "saturday": { "enabled": false, "blocks": [] },
    "sunday": { "enabled": false, "blocks": [] }
  }
}
```

### NPM Scripts

```json
{
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "test:ui": "vitest run --config vitest.ui.config.ts",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "prism:start": "prism mock api/generated/openapi.yaml --port 3000",
  "test": "npm run test:unit && npm run test:ui && npm run test:e2e"
}
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-ui-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:ui
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run prism:start &
      - run: sleep 5  # Wait for Prism
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Data Strategy

**Approach:** JSON fixtures + static data

- **Pros:** Deterministic, fast, no external deps
- **Cons:** Manual maintenance when API changes
- **Mitigation:** TypeScript types shared between app and tests

**Alternative considered:** Faker.js factories
- Rejected: Prefer predictable data for E2E debugging

---

## Notes

- Use Prism for API mocking during development and E2E tests
- Keep components small and focused
- Follow existing Mantine patterns
- Russian UI text as per design
- Test on real backend before final commit (staging environment)
