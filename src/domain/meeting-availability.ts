export const ALL_MEETING_HOURS = [
	"09:00",
	"10:00",
	"11:00",
	"13:00",
	"14:00",
	"15:00",
	"16:00",
	"17:00",
	"18:00",
	"19:00",
] as const;

export type MeetingAvailability = {
	/** Días de la semana habilitados (0 = Domingo ... 6 = Sábado) */
	weekdays: number[];
	/** Fechas específicas bloqueadas ("YYYY-MM-DD") */
	blockedDates: string[];
	/** Fechas específicas habilitadas aunque el día de semana esté bloqueado ("YYYY-MM-DD") */
	enabledDates: string[];
	/** Horas disponibles en formato 24h ("HH:mm") */
	hours: string[];
};

export const DEFAULT_MEETING_AVAILABILITY: MeetingAvailability = {
	weekdays: [1, 2, 3, 4, 5, 6],
	blockedDates: [],
	enabledDates: [],
	hours: [...ALL_MEETING_HOURS],
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const HOUR_RE = /^\d{2}:\d{2}$/;

export function normalizeMeetingAvailability(
	raw: unknown,
): MeetingAvailability {
	if (!raw || typeof raw !== "object") {
		return {
			weekdays: [...DEFAULT_MEETING_AVAILABILITY.weekdays],
			blockedDates: [],
			enabledDates: [],
			hours: [...DEFAULT_MEETING_AVAILABILITY.hours],
		};
	}

	const input = raw as Record<string, unknown>;

	const weekdays = Array.isArray(input.weekdays)
		? Array.from(
				new Set(
					input.weekdays
						.map((d) => Number(d))
						.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
				),
			).sort((a, b) => a - b)
		: [...DEFAULT_MEETING_AVAILABILITY.weekdays];

	const blockedDates = Array.isArray(input.blockedDates)
		? Array.from(
				new Set(
					input.blockedDates.filter(
						(d): d is string => typeof d === "string" && DATE_KEY_RE.test(d),
					),
				),
			).sort()
		: [];

	const enabledDates = Array.isArray(input.enabledDates)
		? Array.from(
				new Set(
					input.enabledDates.filter(
						(d): d is string => typeof d === "string" && DATE_KEY_RE.test(d),
					),
				),
			).sort()
		: [];

	const hours = Array.isArray(input.hours)
		? Array.from(
				new Set(
					input.hours.filter(
						(h): h is string => typeof h === "string" && HOUR_RE.test(h),
					),
				),
			).sort()
		: [...DEFAULT_MEETING_AVAILABILITY.hours];

	return {
		weekdays,
		blockedDates,
		enabledDates,
		hours: hours.length > 0 ? hours : [...DEFAULT_MEETING_AVAILABILITY.hours],
	};
}

export function isDateAvailableForMeeting(
	dateKey: string,
	todayKey: string,
	availability: MeetingAvailability,
): boolean {
	if (dateKey < todayKey) return false;
	if (availability.blockedDates.includes(dateKey)) return false;
	if (availability.enabledDates.includes(dateKey)) return true;
	const d = new Date(`${dateKey}T12:00:00-06:00`);
	return availability.weekdays.includes(d.getUTCDay());
}
