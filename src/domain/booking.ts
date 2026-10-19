import { z } from "zod";

export const BOOKING_EVENT_TYPES = [
  "club",
  "festival",
  "private",
  "wedding",
  "corporate",
  "other",
] as const;

export type BookingEventType = (typeof BOOKING_EVENT_TYPES)[number];

export const BOOKING_EVENT_TYPE_LABELS: Record<BookingEventType, string> = {
  club: "Club / Discoteca",
  festival: "Festival",
  private: "Fiesta privada",
  wedding: "Boda",
  corporate: "Corporativo",
  other: "Otro evento",
};

export const BOOKING_STATUSES = ["pending", "confirmed", "declined"] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  declined: "Rechazada",
};

export type Booking = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: BookingEventType;
  city: string | null;
  eventDate: string | null;
  note: string | null;
  status: BookingStatus;
  createdAt: string;
};

const phoneRegex = /^\+?[0-9 .()-]{7,30}$/;

export const createBookingInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "El nombre no puede superar 80 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresá un correo electrónico válido"),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || phoneRegex.test(val), {
      message: "Ingresá un teléfono o WhatsApp válido",
    })
    .nullable()
    .optional()
    .transform((val) => val?.trim() || null),
  eventType: z.enum(BOOKING_EVENT_TYPES, {
    message: "Seleccioná un tipo de evento",
  }),
  city: z
    .string()
    .trim()
    .max(80, "La ciudad no puede superar 80 caracteres")
    .nullable()
    .optional()
    .transform((val) => val?.trim() || null),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD")
    .nullable()
    .optional()
    .transform((val) => val?.trim() || null),
  note: z
    .string()
    .trim()
    .max(500, "El mensaje no puede superar 500 caracteres")
    .nullable()
    .optional()
    .transform((val) => val?.trim() || null),
  turnstileToken: z.string().trim().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES, {
    message: "Estado de contratación inválido",
  }),
});

export type BookingWhatsappDraft = {
  artistName: string;
  name?: string;
  email?: string;
  phone?: string;
  eventType?: BookingEventType;
  city?: string;
  eventDate?: string;
  note?: string;
};

function formatBookingDateForWhatsapp(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

/** Mensaje de bienvenida para abrir WhatsApp desde el formulario de contrataciones */
export function buildBookingInquiryWhatsappMessage(
  draft: BookingWhatsappDraft,
): string {
  const artist = draft.artistName.trim() || "el artista";
  const lines: string[] = [
    `¡Hola! Me contacto desde la web de contrataciones de *${artist}*.`,
    "",
  ];

  const contactName = draft.name?.trim();
  if (contactName) {
    lines.push(
      `Soy *${contactName}* y quiero consultar disponibilidad y cotización para un evento.`,
    );
  } else {
    lines.push(`Quiero consultar disponibilidad y cotización para un evento.`);
  }

  const eventDetails: string[] = [];
  if (draft.eventType) {
    eventDetails.push(
      `• Tipo de evento: ${BOOKING_EVENT_TYPE_LABELS[draft.eventType]}`,
    );
  }
  if (draft.city?.trim()) {
    eventDetails.push(`• Ciudad / lugar: ${draft.city.trim()}`);
  }
  if (draft.eventDate?.trim()) {
    eventDetails.push(
      `• Fecha estimada: ${formatBookingDateForWhatsapp(draft.eventDate.trim())}`,
    );
  }
  if (eventDetails.length > 0) {
    lines.push("", "Resumen del evento:", ...eventDetails);
  }

  const contactBits: string[] = [];
  if (draft.email?.trim()) contactBits.push(draft.email.trim());
  if (draft.phone?.trim()) contactBits.push(draft.phone.trim());
  if (contactBits.length > 0) {
    lines.push("", `Mis datos: ${contactBits.join(" · ")}`);
  }

  if (draft.note?.trim()) {
    lines.push(
      "",
      "Presupuesto, horario u otros detalles:",
      draft.note.trim(),
    );
  }

  lines.push(
    "",
    "¿Podemos coordinar fecha y confirmar cuánto sería el servicio?",
    "¡Gracias!",
  );

  return lines.join("\n");
}
