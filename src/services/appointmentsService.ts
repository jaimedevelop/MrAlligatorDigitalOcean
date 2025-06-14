// src/firebase/services/appointmentsService.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// @ts-expect-error - Suppress missing declaration file error (ideally add .d.ts or convert)
import { 
  setDocument, 
  getDocument, 
  getAllDocuments, 
  deleteDocument,
  queryDocuments
// @ts-expect-error - Suppress missing declaration file error (ideally add .d.ts or convert)
} from '../utils/firebase/database'; 
// @ts-expect-error - Suppress missing declaration file error (ideally add .d.ts or convert)
import { checkAdminStatus } from '../utils/firebase/auth'; // Import the admin check function
import { Appointment, AppointmentSettings, ServiceType } from '../types/types'; 
import { sendCustomerEmail, sendAdminEmail } from './emailService';

// Collection names
const APPOINTMENTS_COLLECTION = 'appointments';
const SETTINGS_COLLECTION = 'settings';
const APPOINTMENT_SETTINGS_DOC_ID = 'appointment_settings';

// Define a more specific type for details if possible, using Record for now
type LogDetails = Record<string, unknown>; 

// Logging utility - Added types
const logOperation = (operation: string, details: LogDetails) => {
  console.log(`[Appointments Service ${operation}]`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Helper to safely convert Firestore Timestamps or strings/numbers to Date
const safeToDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  // Check if it's a Firestore Timestamp (has a toDate method)
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
  }
  // Try converting from string or number
  try {
    // Ensure it's not an object before passing to Date constructor directly
    if (typeof value !== 'object') {
        const date = new Date(value as string | number);
        if (!isNaN(date.getTime())) return date; // Valid date string/number
    }
  } catch { 
      /* ignore conversion errors */ 
  }
  return undefined; // Invalid or null
};

/**
 * Get all appointments
 * @returns {Promise<Appointment[]>} Array of appointments
 */
export async function getAllAppointments(): Promise<Appointment[]> {
  try {
    logOperation('getAllAppointments', { starting: true });
    
    const result: { success: boolean, data?: unknown[], error?: string } = await getAllDocuments(APPOINTMENTS_COLLECTION);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch appointments');
    }
    
    const appointments: Appointment[] = result.data.map((doc: unknown): Appointment => {
      const docData = doc as Record<string, unknown>; 
      return {
        id: (docData.id as string) || '', 
        customerName: (docData.customerName as string) || 'Unknown Customer',
        customerEmail: (docData.customerEmail as string) || '',
        customerPhone: (docData.customerPhone as string) || '',
        serviceType: (docData.serviceType as ServiceType) || 'other',
        preferredDate: safeToDate(docData.preferredDate) || new Date(), 
        alternativeDate: safeToDate(docData.alternativeDate),
        description: (docData.description as string) || '',
        status: (docData.status as Appointment['status']) || 'pending',
        createdAt: safeToDate(docData.createdAt) || new Date(), 
        updatedAt: safeToDate(docData.updatedAt) || new Date()  
      };
    });
    
    logOperation('getAllAppointments', { success: true, count: appointments.length });
    return appointments;
  } catch (error) {
    console.error(`[Appointments Service Error] getAllAppointments:`, error);
    throw error;
  }
}

/**
 * Get appointment by ID
 * @param {string} id - Appointment ID
 * @returns {Promise<Appointment|null>} Appointment or null if not found
 */
export async function getAppointmentById(id: string): Promise<Appointment | null> {
  try {
    logOperation('getAppointmentById', { id });
    
    const result: { success: boolean, data?: unknown, error?: string } = await getDocument(APPOINTMENTS_COLLECTION, id);
    
    if (!result.success) {
      if (result.error === 'Document not found') {
        logOperation('getAppointmentById', { notFound: true, id });
        return null;
      }
      throw new Error(result.error || `Failed to fetch appointment with ID: ${id}`);
    }
    
    const doc = result.data;
    if (!doc) return null; 
    
    const docData = doc as Record<string, unknown>; 
    const appointment: Appointment = {
      id: (docData.id as string) || '',
      customerName: (docData.customerName as string) || 'Unknown Customer',
      customerEmail: (docData.customerEmail as string) || '',
      customerPhone: (docData.customerPhone as string) || '',
      serviceType: (docData.serviceType as ServiceType) || 'other',
      preferredDate: safeToDate(docData.preferredDate) || new Date(),
      alternativeDate: safeToDate(docData.alternativeDate),
      description: (docData.description as string) || '',
      status: (docData.status as Appointment['status']) || 'pending',
      createdAt: safeToDate(docData.createdAt) || new Date(),
      updatedAt: safeToDate(docData.updatedAt) || new Date()
    };
    
    logOperation('getAppointmentById', { success: true, id });
    return appointment;
  } catch (error) {
    console.error(`[Appointments Service Error] getAppointmentById:`, error);
    throw error;
  }
}

/**
 * Save appointment (create or update)
 * @param {Partial<Appointment>} appointmentInput - Appointment data (id is optional for creation)
 * @returns {Promise<string>} Appointment ID
 */
export async function saveAppointment(appointmentInput: Partial<Appointment>): Promise<string> {
  try {
    logOperation('saveAppointment', { starting: true, id: appointmentInput.id });

    const docId = appointmentInput.id || Date.now().toString(); 
    const isNew = !appointmentInput.id;

    const appointmentData: Record<string, unknown> = {
      ...appointmentInput,
      id: docId, 
      updatedAt: new Date(), 
      preferredDate: appointmentInput.preferredDate, 
      alternativeDate: appointmentInput.alternativeDate,
      createdAt: isNew 
        ? new Date() 
        : appointmentInput.createdAt
    };

    // Remove undefined fields before saving
    Object.keys(appointmentData).forEach(key => {
      if (appointmentData[key] === undefined) {
        delete (appointmentData as any)[key]; // Keep 'as any' for dynamic delete
      }
    });

    const result: { success: boolean, error?: string } = await setDocument(
      APPOINTMENTS_COLLECTION, 
      docId, 
      appointmentData
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to save appointment');
    }

    // Reconstruct the full Appointment object for email notifications
    const savedAppointmentForEmail: Appointment = {
      id: docId,
      customerName: appointmentInput.customerName || 'N/A',
      customerEmail: appointmentInput.customerEmail || '',
      customerPhone: appointmentInput.customerPhone || '',
      serviceType: appointmentInput.serviceType || 'other',
      preferredDate: safeToDate(appointmentData.preferredDate) || new Date(), 
      alternativeDate: safeToDate(appointmentData.alternativeDate),
      description: appointmentInput.description || '',
      status: appointmentInput.status || 'pending',
      createdAt: safeToDate(appointmentData.createdAt) || new Date(),
      updatedAt: safeToDate(appointmentData.updatedAt) || new Date(),
    };

    try {
      if (savedAppointmentForEmail.status === 'pending') {
        await Promise.all([
          sendCustomerEmail(savedAppointmentForEmail),
          sendAdminEmail(savedAppointmentForEmail)
        ]);
        logOperation('saveAppointment', { notificationsSent: true, id: docId });
      } else if (savedAppointmentForEmail.status) { 
         await sendCustomerEmail(savedAppointmentForEmail);
         logOperation('saveAppointment', { customerNotified: true, id: docId });
      }
    } catch (emailError) {
      console.error('Failed to send notifications for appointment:', docId, emailError);
    }

    logOperation('saveAppointment', { success: true, id: docId });
    return docId;
  } catch (error) {
    console.error(`[Appointments Service Error] saveAppointment:`, error);
    throw error;
  }
}


/**
 * Save appointment settings
 * @param {Partial<AppointmentSettings>} settings - Appointment settings
 * @returns {Promise<void>}
 */
export async function saveAppointmentSettings(settings: Partial<AppointmentSettings>): Promise<void> {
  try {
    logOperation('saveAppointmentSettings', { starting: true });
    
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('User does not have admin privileges to modify settings');
    }
    
    const settingsData: Partial<AppointmentSettings> = {
        ...settings,
        excludedDates: settings.excludedDates?.map(dateValue => {
            // Check if it looks like a Date object by checking for toISOString method
            if (typeof dateValue === 'object' && dateValue !== null && typeof (dateValue as Date).toISOString === 'function') {
                 return (dateValue as Date).toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
            }
            // Assume string otherwise, or fallback
            if (typeof dateValue === 'string') return dateValue; 
            return String(dateValue); 
        }) || [],
    };

     // Remove undefined fields before saving
    Object.keys(settingsData).forEach(key => {
      const typedKey = key as keyof AppointmentSettings; 
      if (settingsData[typedKey] === undefined) {
        delete (settingsData as any)[typedKey]; // Keep 'as any' for dynamic delete
      }
    });


    const result: { success: boolean, error?: string } = await setDocument(
      SETTINGS_COLLECTION, 
      APPOINTMENT_SETTINGS_DOC_ID, 
      settingsData 
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save appointment settings');
    }
    
    logOperation('saveAppointmentSettings', { success: true });
  } catch (error) {
    console.error(`[Appointments Service Error] saveAppointmentSettings:`, error);
    throw error;
  }
}

/**
 * Delete appointment
 * @param {string} id - Appointment ID
 * @returns {Promise<void>}
 */
export async function deleteAppointment(id: string): Promise<void> {
  try {
    logOperation('deleteAppointment', { id });
    
    const result: { success: boolean, error?: string } = await deleteDocument(APPOINTMENTS_COLLECTION, id);
    
    if (!result.success) {
      throw new Error(result.error || `Failed to delete appointment with ID: ${id}`);
    }
    
    logOperation('deleteAppointment', { success: true, id });
  } catch (error) {
    console.error(`[Appointments Service Error] deleteAppointment:`, error);
    throw error;
  }
}

/**
 * Get appointments by status
 * @param {string} status - Appointment status
 * @returns {Promise<Appointment[]>} Filtered appointments
 */
export async function getAppointmentsByStatus(status: string): Promise<Appointment[]> {
  try {
    logOperation('getAppointmentsByStatus', { status });
    
    const result: { success: boolean, data?: unknown[], error?: string } = await queryDocuments(
      APPOINTMENTS_COLLECTION,
      [['status', '==', status]],
      'updatedAt', 
      'desc'
    );
    
    if (!result.success || !result.data) {
      throw new Error(result.error || `Failed to fetch appointments with status: ${status}`);
    }
    
    const appointments: Appointment[] = result.data.map((doc: unknown): Appointment => {
       const docData = doc as Record<string, unknown>;
       return {
        id: (docData.id as string) || '',
        customerName: (docData.customerName as string) || 'Unknown Customer',
        customerEmail: (docData.customerEmail as string) || '',
        customerPhone: (docData.customerPhone as string) || '',
        serviceType: (docData.serviceType as ServiceType) || 'other',
        preferredDate: safeToDate(docData.preferredDate) || new Date(),
        alternativeDate: safeToDate(docData.alternativeDate),
        description: (docData.description as string) || '',
        status: (docData.status as Appointment['status']) || 'pending',
        createdAt: safeToDate(docData.createdAt) || new Date(),
        updatedAt: safeToDate(docData.updatedAt) || new Date()
      };
    });
    
    logOperation('getAppointmentsByStatus', { success: true, count: appointments.length });
    return appointments;
  } catch (error) {
    console.error(`[Appointments Service Error] getAppointmentsByStatus:`, error);
    throw error;
  }
}

/**
 * Get appointments by date range
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {Promise<Appointment[]>} Filtered appointments
 */
export async function getAppointmentsByDateRange(start: Date, end: Date): Promise<Appointment[]> {
  try {
    logOperation('getAppointmentsByDateRange', { 
      start: start.toISOString(), 
      end: end.toISOString() 
    });
    
    const startStr = start.toISOString();
    const endStr = end.toISOString();
    
    const result: { success: boolean, data?: unknown[], error?: string } = await queryDocuments(
      APPOINTMENTS_COLLECTION,
      [
        ['preferredDate', '>=', startStr],
        ['preferredDate', '<=', endStr]
      ],
      'preferredDate',
      'asc'
    );
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch appointments by date range');
    }
    
    const appointments: Appointment[] = result.data.map((doc: unknown): Appointment => {
       const docData = doc as Record<string, unknown>;
       return {
        id: (docData.id as string) || '',
        customerName: (docData.customerName as string) || 'Unknown Customer',
        customerEmail: (docData.customerEmail as string) || '',
        customerPhone: (docData.customerPhone as string) || '',
        serviceType: (docData.serviceType as ServiceType) || 'other',
        preferredDate: safeToDate(docData.preferredDate) || new Date(),
        alternativeDate: safeToDate(docData.alternativeDate),
        description: (docData.description as string) || '',
        status: (docData.status as Appointment['status']) || 'pending',
        createdAt: safeToDate(docData.createdAt) || new Date(),
        updatedAt: safeToDate(docData.updatedAt) || new Date()
      };
    });
    
    logOperation('getAppointmentsByDateRange', { success: true, count: appointments.length });
    return appointments;
  } catch (error) {
    console.error(`[Appointments Service Error] getAppointmentsByDateRange:`, error);
    throw error;
  }
}

// Define a type for the availableHours object within settings document data
type AvailableHoursData = { start?: unknown; end?: unknown };

/**
 * Get appointment settings
 * @returns {Promise<AppointmentSettings>} Appointment settings
 */
export async function getAppointmentSettings(): Promise<AppointmentSettings> {
  try {
    logOperation('getAppointmentSettings', { starting: true });
    
    const result: { success: boolean, data?: unknown, error?: string } = await getDocument(SETTINGS_COLLECTION, APPOINTMENT_SETTINGS_DOC_ID);
    
    const defaultSettings: AppointmentSettings = {
      enableScheduling: true,
      availableDays: [1, 2, 3, 4, 5], // Mon-Fri
      availableHours: { start: "09:00", end: "17:00" },
      excludedDates: [],
      maxDaysInAdvance: 30,
      minDaysInAdvance: 1,
    };
    
    if (!result.success || !result.data) {
      if (result.error === 'Document not found') {
        logOperation('getAppointmentSettings', { notFound: true, usingDefault: true });
        return defaultSettings;
      }
      throw new Error(result.error || 'Failed to fetch appointment settings');
    }
    
    const doc = result.data as Record<string, unknown>; 
    const docAvailableHours = doc.availableHours as AvailableHoursData | undefined;

    const settings: AppointmentSettings = {
      enableScheduling: typeof doc.enableScheduling === 'boolean' 
        ? doc.enableScheduling 
        : defaultSettings.enableScheduling,
      availableDays: Array.isArray(doc.availableDays) 
        ? doc.availableDays 
        : defaultSettings.availableDays,
      availableHours: {
        start: typeof docAvailableHours?.start === 'string'
          ? docAvailableHours.start 
          : defaultSettings.availableHours.start,
        end: typeof docAvailableHours?.end === 'string'
          ? docAvailableHours.end 
          : defaultSettings.availableHours.end
      },
      excludedDates: Array.isArray(doc.excludedDates) 
        ? doc.excludedDates.map((d: unknown) => { 
            // Check if it's a Date object by checking for a Date method
            if (typeof d === 'object' && d !== null && typeof (d as Date).toISOString === 'function') { 
                 return (d as Date).toISOString().split('T')[0]; 
            }
            // Assume string otherwise, or fallback
            if (typeof d === 'string') return d;
            return String(d); 
          }) 
        : defaultSettings.excludedDates,
      maxDaysInAdvance: typeof doc.maxDaysInAdvance === 'number' 
        ? doc.maxDaysInAdvance 
        : defaultSettings.maxDaysInAdvance,
      minDaysInAdvance: typeof doc.minDaysInAdvance === 'number' 
        ? doc.minDaysInAdvance 
        : defaultSettings.minDaysInAdvance,
    };
    
    logOperation('getAppointmentSettings', { success: true });
    return settings;
  } catch (error) {
    console.error(`[Appointments Service Error] getAppointmentSettings:`, error);
    throw error;
  }
}

// React Query Hooks

export function useAppointments() {
  return useQuery<Appointment[], Error>({ 
    queryKey: ['appointments'],
    queryFn: getAllAppointments
  });
}

export function useAppointment(id: string | null | undefined) {
  return useQuery<Appointment | null, Error>({ 
    queryKey: ['appointment', id],
    queryFn: () => id ? getAppointmentById(id) : Promise.resolve(null), 
    enabled: !!id 
  });
}

export function useSaveAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation<string, Error, Partial<Appointment>>({ 
    mutationFn: saveAppointment, 
    onSuccess: (_data, variables) => { 
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (variables.id) {
         queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
      }
    }
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({ 
    mutationFn: deleteAppointment,
    onSuccess: (_data, id) => { 
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    }
  });
}

export function useAppointmentsByStatus(status: string | null | undefined) {
  return useQuery<Appointment[], Error>({ 
    queryKey: ['appointments', 'status', status],
    queryFn: () => status ? getAppointmentsByStatus(status) : Promise.resolve([]), 
    enabled: !!status 
  });
}

export function useAppointmentsByDateRange(start: Date | null, end: Date | null) {
  return useQuery<Appointment[], Error>({ 
    queryKey: ['appointments', 'dateRange', start?.toISOString(), end?.toISOString()],
    queryFn: () => {
      if (!start || !end) {
        return Promise.resolve([]);
      }
      return getAppointmentsByDateRange(start, end);
    },
    enabled: !!start && !!end 
  });
}

export function useAppointmentSettings() {
  return useQuery<AppointmentSettings, Error>({ 
    queryKey: ['appointmentSettings'],
    queryFn: getAppointmentSettings
  });
}

export function useSaveAppointmentSettings() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, Partial<AppointmentSettings>>({ 
    mutationFn: saveAppointmentSettings, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentSettings'] });
    }
  });
}