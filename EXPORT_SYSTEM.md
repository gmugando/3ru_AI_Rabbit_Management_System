# Export System Documentation

## Overview

The Export System provides comprehensive data export capabilities for the Rabbit Management System, supporting multiple formats (CSV, Excel, PDF) across all major data types. This system enables users to export their farm data for external analysis, reporting, and record-keeping purposes.

## Architecture

### Core Components

```
Export System
├── ExportService (src/services/exportService.js)
├── ExportDialog (src/components/ExportDialog.vue)
├── Integration Points
│   ├── Weight Records
│   ├── Health Records
│   ├── Financial Transactions
│   ├── Breeding Records
│   ├── Feeding Records
│   └── Farm Reports
└── Dependencies
    ├── jsPDF (PDF generation)
    ├── jspdf-autotable (PDF tables)
    └── xlsx (Excel generation)
```

### Service Layer

The `ExportService` provides a centralized interface for all export operations:

- **Format Support**: CSV, Excel (.xlsx), PDF
- **Data Types**: Records, transactions, reports
- **Fallback Handling**: Automatic fallback to CSV if PDF/Excel fails
- **Error Resilience**: Graceful error handling with user feedback

## Features

### Supported Export Formats

#### 1. CSV Export
- **Use Case**: Data analysis, spreadsheet compatibility
- **Features**: 
  - Comma-separated values
  - Proper escaping of special characters
  - Excel-compatible format
  - Fastest export option

#### 2. Excel Export
- **Use Case**: Professional reports, data manipulation
- **Features**:
  - Native .xlsx format
  - Multiple worksheets support
  - Formatted data with headers
  - Preserves data types

#### 3. PDF Export
- **Use Case**: Official reports, documentation
- **Features**:
  - Professional formatting
  - Tables with styling
  - Headers and metadata
  - Print-ready format

### Data Type Support

#### Weight Records Export
```javascript
// Columns included
- Rabbit Name
- Weight (kg)
- Date
- Time
- Notes
- Recorded At
```

#### Health Records Export
```javascript
// Columns included
- Rabbit Name
- Record Type
- Date
- Symptoms
- Diagnosis
- Treatment
- Cost
- Veterinarian
- Notes
- Recorded At
```

#### Financial Transactions Export
```javascript
// Columns included
- Type (Revenue/Expense)
- Amount
- Description
- Date
- Category
- Reference
- Notes
- Recorded At
```

#### Breeding Records Export
```javascript
// Columns included
- Doe Name
- Buck Name
- Planned Date
- Status
- Expected Birth Date
- Notes
- Created At
```

#### Feeding Records Export
```javascript
// Columns included
- Rabbit Name
- Feed Type
- Amount (g)
- Feeding Date
- Feeding Time
- Notes
- Recorded At
```

#### Farm Reports Export
```javascript
// Comprehensive reports including
- Summary statistics
- Trend analysis
- Recommendations
- Detailed data tables
```

## Implementation Details

### ExportService Class

```javascript
class ExportService {
  // Core export methods
  exportToCSV(data, columns, filename)
  exportToExcel(data, columns, filename, sheetName)
  exportToPDF(data, columns, filename, options)
  
  // Specialized export methods
  exportWeightRecords(records, format)
  exportHealthRecords(records, format)
  exportFinancialTransactions(transactions, format)
  exportBreedingRecords(records, format)
  exportFeedingRecords(records, format)
  exportFarmReport(reportData, reportType, format)
}
```

### ExportDialog Component

A reusable Vue component that provides:
- **Format Selection**: Radio buttons for CSV, Excel, PDF
- **Visual Feedback**: Icons and descriptions for each format
- **Responsive Design**: Mobile-friendly interface
- **Event Handling**: Confirm/cancel actions

### Integration Points

#### Weight Records List
```vue
<template>
  <button @click="exportRecords">Export</button>
  <ExportDialog 
    :show="showExportDialog"
    default-format="csv"
    @confirm="handleExportConfirm"
    @close="handleExportClose"
  />
</template>
```

#### Health Records List
```vue
<template>
  <button @click="exportRecords">Export</button>
  <ExportDialog 
    :show="showExportDialog"
    default-format="csv"
    @confirm="handleExportConfirm"
    @close="handleExportClose"
  />
</template>
```

#### Financial Reports
```vue
<template>
  <button @click="exportReports">Export Report</button>
  <ExportDialog 
    :show="showExportDialog"
    default-format="pdf"
    @confirm="handleExportConfirm"
    @close="handleExportClose"
  />
</template>
```

#### Main Reports Dashboard
```vue
<template>
  <button @click="exportReport">Export Report</button>
  <ExportDialog 
    :show="showExportDialog"
    default-format="pdf"
    @confirm="handleExportConfirm"
    @close="handleExportClose"
  />
</template>
```

## User Experience Flow

### Typical Export Process

1. **User Action**: Click export button
2. **Dialog Display**: ExportDialog appears with format options
3. **Format Selection**: User chooses CSV, Excel, or PDF
4. **Data Processing**: System prepares data for export
5. **File Generation**: Export file is created
6. **Download**: File is automatically downloaded
7. **Feedback**: Success message in console

### Error Handling

- **No Data**: Alert user if no records to export
- **Export Failure**: Fallback to CSV format
- **Network Issues**: Clear error messages
- **Format Issues**: Automatic format validation

## Technical Implementation

### Dependencies

```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.1",
  "xlsx": "^0.18.5"
}
```

### File Structure

```
src/
├── services/
│   └── exportService.js          # Main export service
├── components/
│   └── ExportDialog.vue          # Export dialog component
└── views/
    ├── weight/
    │   └── WeightRecordsList.vue # Weight export integration
    ├── health/
    │   └── HealthRecordsList.vue # Health export integration
    ├── finance/
    │   └── FinancialReports.vue  # Financial export integration
    └── reports/
        └── AppReports.vue        # Reports export integration
```

### Data Formatting

#### Column Definitions
```javascript
const columns = [
  {
    key: 'rabbit_name',
    header: 'Rabbit Name',
    formatter: (value) => value || 'N/A'
  },
  {
    key: 'weight',
    header: 'Weight (kg)',
    formatter: (value) => `${value} kg`
  },
  {
    key: 'record_date',
    header: 'Date',
    formatter: (value) => new Date(value).toLocaleDateString()
  }
]
```

#### Currency Formatting
```javascript
// Uses currencyService for consistent formatting
formatter: (value) => currencyService.format(value || 0)
```

#### Date Formatting
```javascript
// Consistent date formatting across exports
formatter: (value) => new Date(value).toLocaleDateString()
```

## Security Considerations

### Data Privacy
- **User Isolation**: Only user's own data is exported
- **RLS Compliance**: Respects database security policies
- **No Sensitive Data**: Exports only necessary information

### File Security
- **Local Generation**: Files generated client-side
- **No Server Storage**: Files not stored on server
- **Immediate Download**: Direct browser download

## Performance Optimizations

### Lazy Loading
- **Dynamic Imports**: PDF/Excel libraries loaded on demand
- **Bundle Optimization**: Export libraries not in main bundle
- **Fallback Strategy**: CSV always available as backup

### Memory Management
- **File Cleanup**: Automatic cleanup of generated files
- **Blob Management**: Proper URL.revokeObjectURL usage
- **Garbage Collection**: Minimal memory footprint

## Future Enhancements

### Planned Features

1. **Batch Export**: Export multiple data types simultaneously
2. **Custom Templates**: User-defined export formats
3. **Scheduled Exports**: Automated export generation
4. **Email Integration**: Send exports via email
5. **Cloud Storage**: Save exports to cloud storage

### Advanced Formatting

1. **Custom Styling**: User-defined PDF/Excel styling
2. **Charts Export**: Include charts in PDF reports
3. **Multi-language**: Internationalization support
4. **Accessibility**: Screen reader friendly exports

### Integration Expansions

1. **API Endpoints**: Server-side export generation
2. **Third-party Services**: Integration with external tools
3. **Mobile Support**: Native mobile export capabilities
4. **Real-time Updates**: Live data export capabilities

## Testing

### Manual Testing Checklist

- [ ] CSV export works for all data types
- [ ] Excel export generates valid .xlsx files
- [ ] PDF export creates readable documents
- [ ] Export dialog displays correctly
- [ ] Error handling works as expected
- [ ] Fallback to CSV works when PDF/Excel fails
- [ ] File downloads automatically
- [ ] No data leaks between users

### Automated Testing

```javascript
// Example test cases
describe('ExportService', () => {
  test('exports weight records to CSV', async () => {
    const records = mockWeightRecords()
    const result = await exportService.exportWeightRecords(records, 'csv')
    expect(result).toBe(true)
  })
  
  test('falls back to CSV when PDF fails', async () => {
    const records = mockWeightRecords()
    const result = await exportService.exportWeightRecords(records, 'pdf')
    expect(result).toBe(true) // Should fallback to CSV
  })
})
```

## Troubleshooting

### Common Issues

1. **PDF Export Fails**
   - Check if jsPDF library is loaded
   - Verify data format is correct
   - Check browser console for errors

2. **Excel Export Fails**
   - Check if xlsx library is loaded
   - Verify data structure
   - Check for special characters in data

3. **File Not Downloading**
   - Check browser download settings
   - Verify file size is not too large
   - Check for popup blockers

4. **Export Dialog Not Showing**
   - Check component registration
   - Verify event handlers are connected
   - Check for JavaScript errors

### Debug Information

```javascript
// Enable debug logging
console.log('Export data:', data)
console.log('Export format:', format)
console.log('Export filename:', filename)
```

## Usage Examples

### Basic Export Usage

```javascript
// Export weight records
const records = await fetchWeightRecords()
await exportService.exportWeightRecords(records, 'csv')

// Export health records
const healthRecords = await fetchHealthRecords()
await exportService.exportHealthRecords(healthRecords, 'pdf')

// Export financial data
const transactions = await fetchTransactions()
await exportService.exportFinancialTransactions(transactions, 'excel')
```

### Custom Export Configuration

```javascript
// Custom column definitions
const customColumns = [
  { key: 'name', header: 'Animal Name' },
  { key: 'weight', header: 'Weight (lbs)', formatter: (value) => `${value} lbs` },
  { key: 'date', header: 'Measurement Date', formatter: (value) => new Date(value).toLocaleDateString() }
]

// Custom export
await exportService.exportToPDF(data, customColumns, 'custom_report', {
  title: 'Custom Report',
  subtitle: 'Generated on ' + new Date().toLocaleDateString()
})
```

## Conclusion

The Export System provides a comprehensive, user-friendly solution for data export across all major farm management functions. With support for multiple formats, robust error handling, and seamless integration, it enables users to easily extract and analyze their farm data for external use.

The system is designed to be extensible, allowing for future enhancements while maintaining backward compatibility and performance. The modular architecture ensures that new export formats and data types can be easily added as the system evolves.
