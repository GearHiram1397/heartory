/**
 * Format a date string to a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "January 1, 2023")
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  /**
   * Format a date string to a short format
   * @param dateString ISO date string
   * @returns Formatted date string (e.g., "Jan 1, 2023")
   */
  export const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  /**
   * Get relative time from now (e.g., "2 days ago", "in 3 months")
   * @param dateString ISO date string
   * @returns Relative time string
   */
  export const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    const absSeconds = Math.abs(diffInSeconds);
    
    // Less than a minute
    if (absSeconds < 60) {
      return diffInSeconds < 0 ? 'just now' : 'in a few seconds';
    }
    
    // Less than an hour
    if (absSeconds < 3600) {
      const minutes = Math.floor(absSeconds / 60);
      return diffInSeconds < 0 
        ? `${minutes} minute${minutes > 1 ? 's' : ''} ago` 
        : `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Less than a day
    if (absSeconds < 86400) {
      const hours = Math.floor(absSeconds / 3600);
      return diffInSeconds < 0 
        ? `${hours} hour${hours > 1 ? 's' : ''} ago` 
        : `in ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    // Less than a month
    if (absSeconds < 2592000) {
      const days = Math.floor(absSeconds / 86400);
      return diffInSeconds < 0 
        ? `${days} day${days > 1 ? 's' : ''} ago` 
        : `in ${days} day${days > 1 ? 's' : ''}`;
    }
    
    // Less than a year
    if (absSeconds < 31536000) {
      const months = Math.floor(absSeconds / 2592000);
      return diffInSeconds < 0 
        ? `${months} month${months > 1 ? 's' : ''} ago` 
        : `in ${months} month${months > 1 ? 's' : ''}`;
    }
    
    // More than a year
    const years = Math.floor(absSeconds / 31536000);
    return diffInSeconds < 0 
      ? `${years} year${years > 1 ? 's' : ''} ago` 
      : `in ${years} year${years > 1 ? 's' : ''}`;
  };