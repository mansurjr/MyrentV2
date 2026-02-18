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
