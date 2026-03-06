import { describe, it, expect } from "vitest";
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateICSContent,
  type CalendarEvent,
} from "@/lib/calendar";

// Fixed test date: 2026-03-10T14:00:00.000Z
const BASE_DATE = new Date("2026-03-10T14:00:00.000Z");
// 1 hour later
const END_DATE = new Date("2026-03-10T15:00:00.000Z");
// 2 hours later (custom end)
const CUSTOM_END = new Date("2026-03-10T16:00:00.000Z");

const MINIMAL_EVENT: CalendarEvent = {
  title: "Interview",
  startDate: BASE_DATE,
};

const FULL_EVENT: CalendarEvent = {
  title: "Technical Interview - Google",
  description: "2nd round with engineering team.\nBring laptop.",
  location: "1600 Amphitheatre Parkway, Mountain View",
  startDate: BASE_DATE,
  endDate: CUSTOM_END,
};

describe("generateGoogleCalendarUrl", () => {
  it("produces a valid Google Calendar URL with required params", () => {
    const url = generateGoogleCalendarUrl(MINIMAL_EVENT);

    expect(url).toContain("https://calendar.google.com/calendar/render?");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Interview");
  });

  it("formats dates as compact ISO without dashes or colons", () => {
    const url = generateGoogleCalendarUrl(MINIMAL_EVENT);

    // The dates param should contain start/end in YYYYMMDDTHHMMSSZ format
    // Start: 2026-03-10T14:00:00.000Z -> 20260310T140000Z
    // Default end (1hr later): 20260310T150000Z
    expect(url).toContain("20260310T140000Z");
    expect(url).toContain("20260310T150000Z");
  });

  it("defaults end date to 1 hour after start when not provided", () => {
    const url = generateGoogleCalendarUrl(MINIMAL_EVENT);

    // dates param format: start/end
    const datesMatch = url.match(/dates=([^&]+)/);
    expect(datesMatch).not.toBeNull();

    const [start, end] = decodeURIComponent(datesMatch![1]).split("/");
    expect(start).toBe("20260310T140000Z");
    expect(end).toBe("20260310T150000Z");
  });

  it("uses provided end date when given", () => {
    const url = generateGoogleCalendarUrl(FULL_EVENT);

    // Custom end: 2026-03-10T16:00:00.000Z -> 20260310T160000Z
    expect(url).toContain("20260310T160000Z");
  });

  it("includes description and location when provided", () => {
    const url = generateGoogleCalendarUrl(FULL_EVENT);

    expect(url).toContain("details=");
    expect(url).toContain("location=");
    // Verify content via URL parsing (handles + for spaces correctly)
    const parsed = new URL(url);
    expect(parsed.searchParams.get("details")).toContain(
      "2nd round with engineering team.",
    );
    expect(parsed.searchParams.get("location")).toBe(
      "1600 Amphitheatre Parkway, Mountain View",
    );
  });

  it("omits description and location when not provided", () => {
    const url = generateGoogleCalendarUrl(MINIMAL_EVENT);

    expect(url).not.toContain("details=");
    expect(url).not.toContain("location=");
  });

  it("encodes special characters in the title", () => {
    const event: CalendarEvent = {
      title: "Interview & Coffee Chat (Round 2)",
      startDate: BASE_DATE,
    };

    const url = generateGoogleCalendarUrl(event);

    // URLSearchParams encodes & as %26, ( as %28, ) as %29, spaces as +
    expect(url).toContain("text=");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("text")).toBe(
      "Interview & Coffee Chat (Round 2)",
    );
  });
});

describe("generateOutlookCalendarUrl", () => {
  it("produces a valid Outlook calendar URL", () => {
    const url = generateOutlookCalendarUrl(MINIMAL_EVENT);

    expect(url).toContain(
      "https://outlook.live.com/calendar/0/deeplink/compose?",
    );
    expect(url).toContain("rru=addevent");
    expect(url).toContain("subject=Interview");
  });

  it("includes ISO date strings for start and end", () => {
    const url = generateOutlookCalendarUrl(MINIMAL_EVENT);

    const parsed = new URL(url);
    const startDt = parsed.searchParams.get("startdt");
    const endDt = parsed.searchParams.get("enddt");

    expect(startDt).toBe(BASE_DATE.toISOString());
    expect(endDt).toBe(END_DATE.toISOString());
  });

  it("defaults end date to 1 hour after start when not provided", () => {
    const url = generateOutlookCalendarUrl(MINIMAL_EVENT);

    const parsed = new URL(url);
    const endDt = parsed.searchParams.get("enddt");
    expect(endDt).toBe(END_DATE.toISOString());
  });

  it("uses provided end date when given", () => {
    const url = generateOutlookCalendarUrl(FULL_EVENT);

    const parsed = new URL(url);
    const endDt = parsed.searchParams.get("enddt");
    expect(endDt).toBe(CUSTOM_END.toISOString());
  });

  it("includes body and location when provided", () => {
    const url = generateOutlookCalendarUrl(FULL_EVENT);

    const parsed = new URL(url);
    expect(parsed.searchParams.get("body")).toContain(
      "2nd round with engineering team.",
    );
    expect(parsed.searchParams.get("location")).toBe(
      "1600 Amphitheatre Parkway, Mountain View",
    );
  });

  it("omits body and location when not provided", () => {
    const url = generateOutlookCalendarUrl(MINIMAL_EVENT);

    expect(url).not.toContain("body=");
    expect(url).not.toContain("location=");
  });
});

describe("generateICSContent", () => {
  it("produces valid ICS structure with required fields", () => {
    const ics = generateICSContent(MINIMAL_EVENT);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("SUMMARY:Interview");
  });

  it("formats dates correctly in DTSTART and DTEND", () => {
    const ics = generateICSContent(MINIMAL_EVENT);

    expect(ics).toContain("DTSTART:20260310T140000Z");
    expect(ics).toContain("DTEND:20260310T150000Z");
  });

  it("defaults end date to 1 hour after start", () => {
    const ics = generateICSContent(MINIMAL_EVENT);

    expect(ics).toContain("DTEND:20260310T150000Z");
  });

  it("uses provided end date when given", () => {
    const ics = generateICSContent(FULL_EVENT);

    expect(ics).toContain("DTEND:20260310T160000Z");
  });

  it("includes DESCRIPTION and LOCATION when provided", () => {
    const ics = generateICSContent(FULL_EVENT);

    expect(ics).toContain("DESCRIPTION:");
    expect(ics).toContain("LOCATION:1600 Amphitheatre Parkway, Mountain View");
  });

  it("escapes newlines in description with backslash-n", () => {
    const ics = generateICSContent(FULL_EVENT);

    // The literal newline in the description should be escaped as \\n in ICS
    expect(ics).toContain("2nd round with engineering team.\\nBring laptop.");
  });

  it("omits DESCRIPTION and LOCATION when not provided", () => {
    const ics = generateICSContent(MINIMAL_EVENT);

    expect(ics).not.toContain("DESCRIPTION:");
    expect(ics).not.toContain("LOCATION:");
  });

  it("uses CRLF line endings as per ICS spec", () => {
    const ics = generateICSContent(MINIMAL_EVENT);

    // All lines should end with \r\n
    const lines = ics.split("\r\n");
    expect(lines.length).toBeGreaterThan(1);
    // The last element will be empty after the final \r\n split, so check the structure
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
  });

  it("includes PRODID header", () => {
    const ics = generateICSContent(MINIMAL_EVENT);

    expect(ics).toContain("PRODID:-//HireAgent//Calendar//EN");
  });
});
