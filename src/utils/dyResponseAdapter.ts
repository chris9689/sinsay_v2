export function extractDyItems(response: any): any[] {
  try {
    const slots = response?.response?.[0]?.slots ?? response?.slots;

    if (Array.isArray(slots)) {
      return slots
        .map((slot: any) => slot?.item)
        .filter((item: any) => item !== undefined && item !== null);
    }

    console.warn('No valid slots array found in response:', response);
    return [];
  } catch (error) {
    console.error('Failed to extract DY items:', error, response);
    return [];
  }
}
