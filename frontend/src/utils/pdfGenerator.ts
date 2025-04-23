import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Type definitions for order and items
export interface OrderItem {
  id: string;
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  status: string;
  completionDate: Date | null;
  createdAt: Date;
  total: number;
  notes?: string;
}

/**
 * Generates a PDF receipt for an order
 * @param order The order to generate a receipt for
 * @returns The generated PDF document
 */
export const generateOrderReceipt = (order: Order): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add receipt header
  doc.setFontSize(20);
  doc.text('Tambakaji Farmasi', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Receipt', 105, 30, { align: 'center' });
  
  // Add line
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Add order details
  doc.setFontSize(10);
  
  // Left side - Customer info
  doc.text(`Customer: ${order.userName}`, 20, 45);
  doc.text(`Customer ID: ${order.userId}`, 20, 50);
  
  // Right side - Order info
  doc.text(`Order ID: ${order.id}`, 150, 45);
  doc.text(`Date: ${format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}`, 150, 50);
  doc.text(`Status: ${order.status.toUpperCase()}`, 150, 55);
  
  if (order.completionDate) {
    doc.text(`Completed: ${format(new Date(order.completionDate), 'dd/MM/yyyy HH:mm')}`, 150, 60);
  }
  
  // Add line
  doc.line(20, 65, 190, 65);
  
  // Add order items table
  const tableColumn = ["No", "Medicine ID", "Medicine Name", "Quantity", "Subtotal"];
  const tableRows: any[][] = [];
  
  // Add all the products
  order.items.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    tableRows.push([
      index + 1,
      item.medicineId,
      item.name,
      item.quantity,
      subtotal ? `Rp ${subtotal.toLocaleString('id-ID')}` : '-'
    ]);
  });
  
  // Generate the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [95, 139, 118] },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add total
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total: ${order.total ? `Rp ${order.total.toLocaleString('id-ID')}` : `${order.items.reduce((acc, item) => acc + item.quantity, 0)} units`}`, 150, finalY);
  
  // Add notes if available
  if (order.notes) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Notes: ${order.notes}`, 20, finalY + 10);
  }
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your order at Tambakaji Farmasi.', 105, finalY + 25, { align: 'center' });
  doc.text(`This receipt was generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, finalY + 30, { align: 'center' });
  
  return doc;
};

/**
 * Generates and downloads a PDF receipt
 * @param order The order to generate a receipt for
 */
export const downloadOrderReceipt = (order: Order): void => {
  const doc = generateOrderReceipt(order);
  const fileName = `receipt-${order.id}.pdf`;
  doc.save(fileName);
};

/**
 * Opens the PDF receipt in a new tab
 * @param order The order to generate a receipt for
 */
export const openOrderReceipt = (order: Order): void => {
  const doc = generateOrderReceipt(order);
  const pdfDataUri = doc.output('datauristring');
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`<iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>`);
  }
}; 