import { supabase } from '@/supabase'
import currencyService from '@/services/currency'

/**
 * Export Service
 * Handles PDF and Excel exports for various data types
 */
class ExportService {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Array of objects to export
   * @param {Array} columns - Column definitions with key, header, and formatter
   * @param {string} filename - Name of the exported file
   */
  exportToCSV(data, columns, filename) {
    try {
      // Create CSV header
      const headers = columns.map(col => col.header).join(',')
      
      // Create CSV rows
      const rows = data.map(item => {
        return columns.map(col => {
          let value = item[col.key]
          
          // Apply formatter if provided
          if (col.formatter) {
            value = col.formatter(value, item)
          }
          
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`
          }
          
          return value || ''
        }).join(',')
      })
      
      // Combine header and rows
      const csvContent = [headers, ...rows].join('\n')
      
      // Create and download file
      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv')
      
      return true
    } catch (error) {
      console.error('Failed to export CSV:', error)
      throw error
    }
  }

  /**
   * Export data to Excel format (XLSX)
   * @param {Array} data - Array of objects to export
   * @param {Array} columns - Column definitions with key, header, and formatter
   * @param {string} filename - Name of the exported file
   * @param {string} sheetName - Name of the worksheet
   */
  async exportToExcel(data, columns, filename, sheetName = 'Sheet1') {
    try {
      // Import XLSX library
      const XLSX = await import('xlsx')
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data.map(item => {
        const row = {}
        columns.forEach(col => {
          let value = item[col.key]
          if (col.formatter) {
            value = col.formatter(value, item)
          }
          row[col.header] = value
        })
        return row
      }))

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // Generate and download file
      XLSX.writeFile(workbook, `${filename}.xlsx`)
      
      return true
    } catch (error) {
      console.error('Failed to export Excel:', error)
      // Fallback to CSV if Excel export fails
      console.warn('Excel export failed, falling back to CSV')
      return this.exportToCSV(data, columns, filename)
    }
  }

  /**
   * Export data to PDF format
   * @param {Array} data - Array of objects to export
   * @param {Array} columns - Column definitions with key, header, and formatter
   * @param {string} filename - Name of the exported file
   * @param {Object} options - PDF options (title, subtitle, etc.)
   */
  async exportToPDF(data, columns, filename, options = {}) {
    try {
      // Import jsPDF and autoTable
      const { jsPDF } = await import('jspdf')
      await import('jspdf-autotable')
      
      const doc = new jsPDF()

      // Add title
      if (options.title) {
        doc.setFontSize(18)
        doc.text(options.title, 20, 20)
      }

      // Add subtitle
      if (options.subtitle) {
        doc.setFontSize(12)
        doc.text(options.subtitle, 20, 30)
      }

      // Add export date
      const exportDate = new Date().toLocaleDateString()
      doc.setFontSize(10)
      doc.text(`Exported on: ${exportDate}`, 20, 40)

      // Create table
      const tableData = data.map(item => {
        return columns.map(col => {
          let value = item[col.key]
          if (col.formatter) {
            value = col.formatter(value, item)
          }
          return value || ''
        })
      })

      // Add headers
      const headers = columns.map(col => col.header)
      tableData.unshift(headers)

      // Calculate table position
      const startY = options.title ? 50 : 20

      // Draw table
      doc.autoTable({
        head: [headers],
        body: tableData.slice(1),
        startY: startY,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 153, 225],
          textColor: 255
        }
      })

      // Save PDF
      doc.save(`${filename}.pdf`)
      
      return true
    } catch (error) {
      console.error('Failed to export PDF:', error)
      // Fallback to CSV if PDF export fails
      console.warn('PDF export failed, falling back to CSV')
      return this.exportToCSV(data, columns, filename)
    }
  }

  /**
   * Export weight records
   * @param {Array} records - Weight records to export
   * @param {string} format - Export format (csv, excel, pdf)
   */
  async exportWeightRecords(records, format = 'csv') {
    const columns = [
      { key: 'rabbit_name', header: 'Rabbit Name' },
      { key: 'weight', header: 'Weight (kg)', formatter: (value) => `${value} kg` },
      { key: 'record_date', header: 'Date', formatter: (value) => new Date(value).toLocaleDateString() },
      { key: 'record_time', header: 'Time', formatter: (value) => value || 'N/A' },
      { key: 'notes', header: 'Notes' },
      { key: 'created_at', header: 'Recorded At', formatter: (value) => new Date(value).toLocaleString() }
    ]

    const filename = `weight_records_${new Date().toISOString().split('T')[0]}`

    switch (format.toLowerCase()) {
      case 'excel':
        return await this.exportToExcel(records, columns, filename, 'Weight Records')
      case 'pdf':
        return await this.exportToPDF(records, columns, filename, {
          title: 'Weight Records Report',
          subtitle: `Total Records: ${records.length}`
        })
      default:
        return this.exportToCSV(records, columns, filename)
    }
  }

  /**
   * Export health records
   * @param {Array} records - Health records to export
   * @param {string} format - Export format (csv, excel, pdf)
   */
  async exportHealthRecords(records, format = 'csv') {
    const columns = [
      { key: 'rabbit_name', header: 'Rabbit Name' },
      { key: 'record_type', header: 'Record Type', formatter: (value) => this.capitalizeFirst(value) },
      { key: 'record_date', header: 'Date', formatter: (value) => new Date(value).toLocaleDateString() },
      { key: 'symptoms', header: 'Symptoms' },
      { key: 'diagnosis', header: 'Diagnosis' },
      { key: 'treatment', header: 'Treatment' },
      { key: 'cost', header: 'Cost', formatter: (value) => currencyService.format(value || 0) },
      { key: 'veterinarian', header: 'Veterinarian' },
      { key: 'notes', header: 'Notes' },
      { key: 'created_at', header: 'Recorded At', formatter: (value) => new Date(value).toLocaleString() }
    ]

    const filename = `health_records_${new Date().toISOString().split('T')[0]}`

    switch (format.toLowerCase()) {
      case 'excel':
        return await this.exportToExcel(records, columns, filename, 'Health Records')
      case 'pdf':
        return await this.exportToPDF(records, columns, filename, {
          title: 'Health Records Report',
          subtitle: `Total Records: ${records.length}`
        })
      default:
        return this.exportToCSV(records, columns, filename)
    }
  }

  /**
   * Export financial transactions
   * @param {Array} transactions - Financial transactions to export
   * @param {string} format - Export format (csv, excel, pdf)
   */
  async exportFinancialTransactions(transactions, format = 'csv') {
    const columns = [
      { key: 'type', header: 'Type', formatter: (value) => this.capitalizeFirst(value) },
      { key: 'amount', header: 'Amount', formatter: (value) => currencyService.format(value) },
      { key: 'description', header: 'Description' },
      { key: 'date', header: 'Date', formatter: (value) => new Date(value).toLocaleDateString() },
      { key: 'category', header: 'Category', formatter: (value) => this.capitalizeFirst(value) },
      { key: 'reference', header: 'Reference' },
      { key: 'notes', header: 'Notes' },
      { key: 'created_at', header: 'Recorded At', formatter: (value) => new Date(value).toLocaleString() }
    ]

    const filename = `financial_transactions_${new Date().toISOString().split('T')[0]}`

    switch (format.toLowerCase()) {
      case 'excel':
        return await this.exportToExcel(transactions, columns, filename, 'Financial Transactions')
      case 'pdf':
        return await this.exportToPDF(transactions, columns, filename, {
          title: 'Financial Transactions Report',
          subtitle: `Total Transactions: ${transactions.length}`
        })
      default:
        return this.exportToCSV(transactions, columns, filename)
    }
  }

  /**
   * Export breeding records
   * @param {Array} records - Breeding records to export
   * @param {string} format - Export format (csv, excel, pdf)
   */
  async exportBreedingRecords(records, format = 'csv') {
    const columns = [
      { key: 'doe_name', header: 'Doe Name' },
      { key: 'buck_name', header: 'Buck Name' },
      { key: 'planned_date', header: 'Planned Date', formatter: (value) => new Date(value).toLocaleDateString() },
      { key: 'status', header: 'Status', formatter: (value) => this.capitalizeFirst(value) },
      { key: 'expected_birth_date', header: 'Expected Birth', formatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
      { key: 'notes', header: 'Notes' },
      { key: 'created_at', header: 'Created At', formatter: (value) => new Date(value).toLocaleString() }
    ]

    const filename = `breeding_records_${new Date().toISOString().split('T')[0]}`

    switch (format.toLowerCase()) {
      case 'excel':
        return await this.exportToExcel(records, columns, filename, 'Breeding Records')
      case 'pdf':
        return await this.exportToPDF(records, columns, filename, {
          title: 'Breeding Records Report',
          subtitle: `Total Records: ${records.length}`
        })
      default:
        return this.exportToCSV(records, columns, filename)
    }
  }

  /**
   * Export feeding records
   * @param {Array} records - Feeding records to export
   * @param {string} format - Export format (csv, excel, pdf)
   */
  async exportFeedingRecords(records, format = 'csv') {
    const columns = [
      { key: 'rabbit_name', header: 'Rabbit Name' },
      { key: 'feed_type', header: 'Feed Type', formatter: (value) => this.capitalizeFirst(value) },
      { key: 'amount', header: 'Amount (g)', formatter: (value) => `${value} g` },
      { key: 'feeding_date', header: 'Feeding Date', formatter: (value) => new Date(value).toLocaleDateString() },
      { key: 'feeding_time', header: 'Feeding Time', formatter: (value) => value || 'N/A' },
      { key: 'notes', header: 'Notes' },
      { key: 'created_at', header: 'Recorded At', formatter: (value) => new Date(value).toLocaleString() }
    ]

    const filename = `feeding_records_${new Date().toISOString().split('T')[0]}`

    switch (format.toLowerCase()) {
      case 'excel':
        return await this.exportToExcel(records, columns, filename, 'Feeding Records')
      case 'pdf':
        return await this.exportToPDF(records, columns, filename, {
          title: 'Feeding Records Report',
          subtitle: `Total Records: ${records.length}`
        })
      default:
        return this.exportToCSV(records, columns, filename)
    }
  }

  /**
   * Export comprehensive farm report
   * @param {Object} reportData - Report data from reportsService
   * @param {string} reportType - Type of report (population, health, financial, breeding, feeding)
   * @param {string} format - Export format (csv, excel, pdf)
   */
  async exportFarmReport(reportData, reportType, format = 'pdf') {
    try {
      const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`
      
      // Create comprehensive report content
      const reportContent = this.generateReportContent(reportData, reportType)
      
      if (format.toLowerCase() === 'pdf') {
        return await this.exportReportToPDF(reportContent, filename, reportType)
      } else {
        // For CSV/Excel, export the detailed data
        const dataToExport = this.extractReportData(reportData, reportType)
        const columns = this.getReportColumns(reportType)
        
        if (format.toLowerCase() === 'excel') {
          return await this.exportToExcel(dataToExport, columns, filename, `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`)
        } else {
          return this.exportToCSV(dataToExport, columns, filename)
        }
      }
    } catch (error) {
      console.error('Failed to export farm report:', error)
      throw error
    }
  }

  /**
   * Generate comprehensive report content for PDF
   * @param {Object} reportData - Report data
   * @param {string} reportType - Type of report
   */
  generateReportContent(reportData, reportType) {
    const content = {
      title: `${this.capitalizeFirst(reportType)} Report`,
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      summary: reportData.summary || {},
      trends: reportData.trends || [],
      recommendations: reportData.recommendations || [],
      details: reportData.details || []
    }

    return content
  }

  /**
   * Export report to PDF with comprehensive layout
   * @param {Object} reportContent - Report content
   * @param {string} filename - Filename
   * @param {string} reportType - Report type
   */
  async exportReportToPDF(reportContent, filename) {
    try {
      // Import jsPDF and autoTable
      const { jsPDF } = await import('jspdf')
      await import('jspdf-autotable')
      
      const doc = new jsPDF()

      let yPosition = 20

      // Title
      doc.setFontSize(20)
      doc.text(reportContent.title, 20, yPosition)
      yPosition += 15

      // Subtitle
      doc.setFontSize(12)
      doc.text(reportContent.subtitle, 20, yPosition)
      yPosition += 20

      // Summary section
      if (reportContent.summary) {
        doc.setFontSize(16)
        doc.text('Summary', 20, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        Object.entries(reportContent.summary).forEach(([key, value]) => {
          const label = this.capitalizeFirst(key.replace(/_/g, ' '))
          const formattedValue = this.formatSummaryValue(value, key)
          doc.text(`${label}: ${formattedValue}`, 25, yPosition)
          yPosition += 6
        })
        yPosition += 10
      }

      // Recommendations section
      if (reportContent.recommendations && reportContent.recommendations.length > 0) {
        doc.setFontSize(16)
        doc.text('Recommendations', 20, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        reportContent.recommendations.forEach((rec, index) => {
          const text = `${index + 1}. ${rec.title || rec.description}`
          const lines = doc.splitTextToSize(text, 170)
          lines.forEach(line => {
            doc.text(line, 25, yPosition)
            yPosition += 5
          })
          yPosition += 3
        })
      }

      // Save PDF
      doc.save(`${filename}.pdf`)
      
      return true
    } catch (error) {
      console.error('Failed to export report to PDF:', error)
      throw error
    }
  }

  /**
   * Extract data for CSV/Excel export from report
   * @param {Object} reportData - Report data
   * @param {string} reportType - Report type
   */
  extractReportData(reportData, reportType) {
    switch (reportType) {
      case 'population':
        return reportData.details || []
      case 'health':
        return reportData.details || []
      case 'financial':
        return reportData.details || []
      case 'breeding':
        return reportData.details || []
      case 'feeding':
        return reportData.details || []
      default:
        return []
    }
  }

  /**
   * Get column definitions for report type
   * @param {string} reportType - Report type
   */
  getReportColumns(reportType) {
    switch (reportType) {
      case 'population':
        return [
          { key: 'name', header: 'Rabbit Name' },
          { key: 'breed', header: 'Breed' },
          { key: 'gender', header: 'Gender' },
          { key: 'age', header: 'Age' },
          { key: 'status', header: 'Status' }
        ]
      case 'health':
        return [
          { key: 'rabbit_name', header: 'Rabbit Name' },
          { key: 'record_type', header: 'Record Type' },
          { key: 'record_date', header: 'Date' },
          { key: 'diagnosis', header: 'Diagnosis' },
          { key: 'cost', header: 'Cost' }
        ]
      case 'financial':
        return [
          { key: 'type', header: 'Type' },
          { key: 'amount', header: 'Amount' },
          { key: 'description', header: 'Description' },
          { key: 'date', header: 'Date' },
          { key: 'category', header: 'Category' }
        ]
      case 'breeding':
        return [
          { key: 'doe_name', header: 'Doe Name' },
          { key: 'buck_name', header: 'Buck Name' },
          { key: 'planned_date', header: 'Planned Date' },
          { key: 'status', header: 'Status' },
          { key: 'expected_birth_date', header: 'Expected Birth' }
        ]
      case 'feeding':
        return [
          { key: 'rabbit_name', header: 'Rabbit Name' },
          { key: 'feed_type', header: 'Feed Type' },
          { key: 'amount', header: 'Amount' },
          { key: 'feeding_date', header: 'Feeding Date' },
          { key: 'feeding_time', header: 'Feeding Time' }
        ]
      default:
        return []
    }
  }

  /**
   * Format summary value for display
   * @param {*} value - Value to format
   * @param {string} key - Key name for context
   */
  formatSummaryValue(value, key) {
    if (typeof value === 'number') {
      if (key.includes('cost') || key.includes('amount') || key.includes('revenue') || key.includes('expense')) {
        return currencyService.format(value)
      }
      if (key.includes('percentage') || key.includes('rate')) {
        return `${value.toFixed(1)}%`
      }
      return value.toString()
    }
    return value || 'N/A'
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - String to capitalize
   */
  capitalizeFirst(str) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * Download file to user's device
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}

export const exportService = new ExportService()
