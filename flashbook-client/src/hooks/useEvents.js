import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const useEvents = (filters = {}) => {
  // Clean up undefined or empty string values from filters object
  const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  return useQuery({
    queryKey: ['events', cleanedFilters],
    queryFn: async () => {
      const response = await api.get('/events', { params: cleanedFilters });
      return response.data;
    },
  });
};
