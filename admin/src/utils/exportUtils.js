/**
 * Export Utilities for Thukilinam Admin Orders
 * Exports orders to Excel (.xlsx / .csv) and PDF format
 */

export const formatAddress = (order) => {
  if (order.delivery_address) return order.delivery_address;
  let ship = {};
  try {
    ship = typeof order.shipping_address === 'string' 
      ? JSON.parse(order.shipping_address) 
      : (order.shipping_address || {});
  } catch (e) {
    ship = {};
  }
  return [ship.line1, ship.city, ship.state, ship.pincode].filter(Boolean).join(', ');
};

export const getOrderLocation = (order) => {
  if (order.delivery_city) {
    return [order.delivery_city, order.delivery_state].filter(Boolean).join(', ');
  }
  let ship = {};
  try {
    ship = typeof order.shipping_address === 'string' 
      ? JSON.parse(order.shipping_address) 
      : (order.shipping_address || {});
  } catch (e) {
    ship = {};
  }
  return [ship.city, ship.state].filter(Boolean).join(', ') || 'N/A';
};

/**
 * Export orders to Excel format (.xlsx if available, or UTF-8 Excel CSV)
 */
export const exportOrdersToExcel = async (orders, filename = 'Thukilinam_Orders_Export') => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const exportData = orders.map((order, idx) => {
    let ship = {};
    try {
      ship = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : (order.shipping_address || {});
    } catch (e) {
      ship = {};
    }

    return {
      'S.No': idx + 1,
      'Order Number': order.order_number,
      'Order Date': new Date(order.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      'Customer Name': order.customer_name || ship.full_name || 'Guest',
      'Mobile Phone': order.customer_phone || ship.phone || 'N/A',
      'Email': order.customer_email || ship.email || 'N/A',
      'City / Place': order.delivery_city || ship.city || 'N/A',
      'State': order.delivery_state || ship.state || 'N/A',
      'Pincode': order.delivery_pincode || ship.pincode || 'N/A',
      'Delivery Address': formatAddress(order) || 'N/A',
      'Total Amount (INR)': Number(order.total || 0).toFixed(2),
      'Payment Method': (order.payment_method || 'online').toUpperCase(),
      'Payment Status': (order.payment_status || 'pending').toUpperCase(),
      'Order Status': (order.status || 'pending').toUpperCase(),
      'Courier': order.courier ? order.courier.replace(/_/g, ' ').toUpperCase() : 'N/A',
      'Tracking / AWB #': order.tracking_number || 'N/A',
      'Notes': order.notes || ''
    };
  });

  // Try dynamic import of xlsx
  try {
    const XLSX = await import('xlsx');
    if (XLSX && XLSX.utils) {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto column widths
      const colKeys = Object.keys(exportData[0] || {});
      worksheet['!cols'] = colKeys.map(key => {
        let maxLen = key.length;
        exportData.forEach(row => {
          const valStr = String(row[key] || '');
          if (valStr.length > maxLen) maxLen = valStr.length;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      return;
    }
  } catch (err) {
    console.info('Using UTF-8 Excel CSV export fallback');
  }

  // Robust UTF-8 Excel CSV fallback
  const headers = Object.keys(exportData[0]);
  const csvRows = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',')
  ];

  exportData.forEach(row => {
    const values = headers.map(h => {
      const val = row[h] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // \uFEFF ensures Excel displays UTF-8 properly
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export orders to PDF format (Crisp, printable high-res formatted PDF report)
 */
export const exportOrdersToPdf = async (orders, title = 'Thukilinam Orders Report') => {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const tableRowsHtml = orders.map((o, idx) => {
    let ship = {};
    try {
      ship = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : (o.shipping_address || {});
    } catch (e) {
      ship = {};
    }

    const place = [o.delivery_city || ship.city, o.delivery_state || ship.state].filter(Boolean).join(', ') || 'N/A';
    const statusColor = 
      o.status === 'delivered' ? '#15803d' :
      o.status === 'shipped' ? '#1d4ed8' :
      o.status === 'processing' ? '#0369a1' :
      o.status === 'cancelled' ? '#b91c1c' : '#b45309';

    return `
      <tr>
        <td style="text-align: center; color: #64748b; font-size: 11px;">${idx + 1}</td>
        <td>
          <strong style="color: #432176; font-size: 12px;">${o.order_number}</strong>
          <div style="font-size: 10px; color: #64748b;">${new Date(o.created_at).toLocaleDateString('en-IN')}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: #1e293b; font-size: 12px;">${o.customer_name || ship.full_name || 'Guest'}</div>
          <div style="font-size: 10px; color: #475569;">📞 ${o.customer_phone || ship.phone || 'N/A'}</div>
          ${o.customer_email ? `<div style="font-size: 9px; color: #94a3b8;">✉ ${o.customer_email}</div>` : ''}
        </td>
        <td>
          <div style="font-weight: 500; font-size: 11px; color: #334155;">${place}</div>
          <div style="font-size: 9px; color: #64748b;">${formatAddress(o)}</div>
        </td>
        <td>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${statusColor}18; color: ${statusColor}; border: 1px solid ${statusColor}40;">
            ${o.status || 'Pending'}
          </span>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
            ${(o.payment_method || 'Online').toUpperCase()} · ${(o.payment_status || 'Pending').toUpperCase()}
          </div>
        </td>
        <td style="text-align: right; font-weight: 700; font-size: 12px; color: #0f172a;">
          ₹${Number(o.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join('');

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${new Date().toISOString().slice(0, 10)}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm 10mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 16px;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #432176;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .brand-title {
          font-size: 26px;
          font-weight: 800;
          color: #432176;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .report-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0;
        }
        .kpi-strip {
          display: flex;
          gap: 16px;
          margin-bottom: 18px;
        }
        .kpi-card {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
        }
        .kpi-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .kpi-val {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        thead th {
          background: #432176;
          color: #ffffff;
          padding: 8px 10px;
          text-align: left;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        tbody tr {
          border-bottom: 1px solid #e2e8f0;
        }
        tbody tr:nth-child(even) {
          background-color: #fbfbfe;
        }
        tbody td {
          padding: 8px 10px;
          vertical-align: top;
        }
        .footer-note {
          margin-top: 18px;
          font-size: 10px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }
        .print-btn-bar {
          position: fixed;
          top: 14px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          padding: 6px 10px;
          border-radius: 8px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          display: flex;
          gap: 8px;
          z-index: 1000;
        }
        .print-btn {
          background: #432176;
          color: #ffffff;
          border: 0;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .close-btn {
          background: #e2e8f0;
          color: #334155;
          border: 0;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
        }
        @media print {
          .print-btn-bar {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
        <button class="close-btn" onclick="window.close()">✕ Close</button>
      </div>

      <div class="header">
        <div>
          <h1 class="brand-title">Thukilinam Boutique</h1>
          <p class="report-subtitle">Orders Summary & Dispatch Manifest</p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <div><strong>Generated:</strong> ${generatedDate}</div>
          <div><strong>Total Orders:</strong> ${orders.length}</div>
        </div>
      </div>

      <div class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-val">${orders.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-val">₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Delivered</div>
          <div class="kpi-val">${orders.filter(o => o.status === 'delivered').length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Pending / Processing</div>
          <div class="kpi-val">${orders.filter(o => o.status === 'pending' || o.status === 'processing').length}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 4%; text-align: center;">#</th>
            <th style="width: 16%;">Order / Date</th>
            <th style="width: 25%;">Customer (Name & Phone)</th>
            <th style="width: 27%;">Place & Delivery Address</th>
            <th style="width: 14%;">Status & Payment</th>
            <th style="width: 14%; text-align: right;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer-note">
        <span>Confidential · Thukilinam Admin Management</span>
        <span>Generated automatically on ${new Date().toLocaleDateString('en-IN')}</span>
      </div>

      <script>
        // Auto trigger print dialog when loaded
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
};
