export const formatDateTime = (value?: string | null) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const formatDate = (value?: string | null) => {
  if (!value) return 'TBA';
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const formatCount = (value?: number | string | null) => Number(value || 0).toLocaleString();

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read image preview.'));
    reader.readAsDataURL(file);
  });

export const classNames = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
