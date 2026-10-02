import { Suspense, cache } from "react";
import { getWeatherSnapshot } from "@/lib/weather";
import { getUpcomingEvents, type CalendarResult } from "@/lib/calendar";
import { getRecentInbox, type InboxResult } from "@/lib/gmail";
import { TimeWeatherWidget } from "./TimeWeatherWidget";
import { CalendarWidget } from "./CalendarWidget";
import { GmailWidget } from "./GmailWidget";
import { SearchTrigger } from "@/components/search/SearchTrigger";

// Google Calendar, Gmail and weather are third-party calls. They stream in
// behind <Suspense> so the page never waits on them — before, every page in the
// app blocked until all three answered. cache() makes the desktop bar and the
// mobile header share one set of calls per request.
const getHeaderData = cache(() =>
  Promise.all([
    getWeatherSnapshot().catch(() => ({
      city: null,
      region: null,
      country: null,
      timezone: null,
      temperatureF: null,
      conditionLabel: null,
      conditionEmoji: null,
      isFallback: true,
    })),
    getUpcomingEvents().catch(
      (err): CalendarResult => ({ kind: "error", message: (err as Error).message }),
    ),
    getRecentInbox().catch(
      (err): InboxResult => ({ kind: "error", message: (err as Error).message }),
    ),
  ]),
);

async function DesktopWidgets() {
  const [weather, calendar, inbox] = await getHeaderData();
  return (
    <>
      <GmailWidget result={inbox} />
      <CalendarWidget result={calendar} />
      <TimeWeatherWidget weather={weather} />
    </>
  );
}

async function MobileWidgets() {
  const [weather, calendar, inbox] = await getHeaderData();
  return (
    <>
      <TimeWeatherWidget weather={weather} />
      <CalendarWidget result={calendar} compact />
      <GmailWidget result={inbox} compact />
    </>
  );
}

/** Mobile header widgets, streamed. Passed into MobileNav as a slot. */
export function MobileHeaderWidgets() {
  return (
    <Suspense fallback={null}>
      <MobileWidgets />
    </Suspense>
  );
}

export function TopBar() {
  return (
    <div className="hidden md:flex items-center justify-between gap-2 h-12 px-4 sm:px-6 border-b border-rule-soft bg-bg/50 backdrop-blur sticky top-0 z-30">
      <SearchTrigger />
      <div className="flex items-center gap-2">
        <Suspense fallback={null}>
          <DesktopWidgets />
        </Suspense>
      </div>
    </div>
  );
}
