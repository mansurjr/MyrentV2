export function getTashkentTodayISO() {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function formatTashkentDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
export function getMonthName(monthNumber: number) {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];
  return months[monthNumber - 1] || `Oy ${monthNumber}`;
}

export function isDateWithinCurrentWeek(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Get Monday of current week
  const day = today.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(new Date().setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(23, 59, 59, 999);

  return targetDate >= monday && targetDate <= now;
}
