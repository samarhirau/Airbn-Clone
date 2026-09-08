/**
 * Utility to export an array of tabular objects into a downloadable CSV file
 * @param {string} filename - Base name for the downloaded file (without .csv)
 * @param {Array<Object>} data - Array of record objects
 * @param {Array<{ key: string, label: string }>} columns - Column definitions
 */
export function exportToCSV(filename, data, columns) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data available to export');
  }

  // Generate header row
  const headerRow = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Generate data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val = item[col.key];

        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }

        // Escape double quotes
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
