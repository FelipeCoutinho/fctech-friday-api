import { PrismaClient } from '@prisma/client';

export interface OperatingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const BARBERSHOP_HOURS: OperatingHour[] = [
  { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isActive: false },
  { dayOfWeek: 1, startTime: '09:00', endTime: '20:00', isActive: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '20:00', isActive: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '20:00', isActive: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '20:00', isActive: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '20:00', isActive: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isActive: true },
];

const SALON_HOURS: OperatingHour[] = [
  { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isActive: false },
  { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '16:00', isActive: true },
];

const PETSHOP_HOURS: OperatingHour[] = [
  { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', isActive: true },
  { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 5, startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '15:00', isActive: true },
];

export const OPERATING_HOURS_BY_TYPE: Record<string, OperatingHour[]> = {
  BARBERSHOP: BARBERSHOP_HOURS,
  SALON: SALON_HOURS,
  PETSHOP: PETSHOP_HOURS,
};

const DEFAULT_HOURS = BARBERSHOP_HOURS;

export async function seedOperatingHoursForEstablishment(
  client: PrismaClient,
  establishmentId: string,
  establishmentType: string,
): Promise<void> {
  const hours =
    OPERATING_HOURS_BY_TYPE[establishmentType] ?? DEFAULT_HOURS;

  for (const hour of hours) {
    await client.establishmentSchedule.upsert({
      where: {
        establishmentId_dayOfWeek: {
          establishmentId,
          dayOfWeek: hour.dayOfWeek,
        },
      },
      update: {
        startTime: hour.startTime,
        endTime: hour.endTime,
        isActive: hour.isActive,
      },
      create: {
        establishmentId,
        dayOfWeek: hour.dayOfWeek,
        startTime: hour.startTime,
        endTime: hour.endTime,
        isActive: hour.isActive,
      },
    });
  }
}
