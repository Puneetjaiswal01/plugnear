# PlugNear public website

Static marketing website for the existing `plugnear-web` Vercel project. It introduces the early-access marketplace without claiming live booking/payment services or inventing charger availability, testimonials or customer statistics.

`npm run build:website` at the repository root exports the Expo web app and builds this website. `dist/` includes the landing page at `/` and the app at `/app/`, with shared compiled assets. The source `public/` directory alone does not contain the compiled app; preview `dist/` to verify both journeys.

`npm run test:e2e` includes responsive marketing-page checks, FAQ and legal dialogs, both calls to action and the embedded app route. AI-generated hero imagery is illustrative, not a charger listing. This site has no lead-capture form and does not collect payments.
